/**
 * ランキングプロセッサー
 * すべてのランキング処理を統括するメインクラス
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Place, RankingRequest, RankingResponse, RankingConfig } from './types';
import { RANKING_CONFIGS } from './configs';
import { applyFilters } from './filters';
import { RankingAggregator } from './aggregators';
import { validateRankingRequest, sanitizePage, sanitizeLimit } from './validators';
import { PLACE_COLUMNS } from './constants';

/**
 * ランキングプロセッサークラス
 * 各ランキングタイプに応じた処理を実行
 */
export class RankingProcessor {
    private aggregator: RankingAggregator;

    constructor(private supabase: SupabaseClient) {
        this.aggregator = new RankingAggregator(supabase);
    }

    /**
     * ランキングデータを取得
     * @param request ランキングリクエスト
     * @returns ランキングレスポンス
     * @throws 入力検証エラー
     */
    async getRanking(request: RankingRequest): Promise<RankingResponse> {
        // 入力検証
        const validation = validateRankingRequest(request);
        if (!validation.valid) {
            throw new Error(validation.error);
        }

        const config = RANKING_CONFIGS[request.type];
        const page = sanitizePage(request.page);
        const limit = sanitizeLimit(request.limit, config.limit);

        // 集計が必要なランキング（rating, reviews, mylist）
        if (config.requiresAggregation) {
            return this.processAggregationRanking(config, request, page, limit);
        } else {
            return this.processDirectRanking(config, request, page, limit);
        }
    }

    /**
     * 直接データ取得型のランキング処理
     * （overall, playing, favorites, likeRatio, trending, hidden, など）
     */
    private async processDirectRanking(
        config: RankingConfig,
        request: RankingRequest,
        page: number,
        limit: number
    ): Promise<RankingResponse> {
        // クエリ構築
        let query = this.supabase
            .from(config.dataSource)
            .select(PLACE_COLUMNS);  // セキュリティ: 必要なカラムのみ

        // フィルター適用
        query = applyFilters(query, config.filters);

        // ジャンルフィルター
        if (request.genre && request.genre !== 'all') {
            query = query.eq('genre', request.genre);
        }

        // ソート方法で分岐
        if (config.sortMethod === 'db') {
            return this.executeDbSort(query, config, page, limit);
        } else {
            return this.executeJsSort(query, config, page, limit);
        }
    }

    /**
     * DBソート実行
     */
    private async executeDbSort(
        query: any,
        config: RankingConfig,
        page: number,
        limit: number
    ): Promise<RankingResponse> {
        // DBでソート
        query = query.order(config.sortKey!, { ascending: false });

        // ページネーション
        const offset = (page - 1) * limit;
        query = query.range(offset, offset + limit - 1);

        const { data, error } = await query;

        if (error) {
            throw new Error(`Database error: ${error.message}`);
        }

        return {
            data: data || [],
            page,
            hasMore: data?.length === limit
        };
    }

    /**
     * JavaScriptソート実行
     */
    private async executeJsSort(
        query: any,
        config: RankingConfig,
        page: number,
        limit: number
    ): Promise<RankingResponse> {
        // 全データ取得（または設定されたlimit分）
        query = query.limit(config.limit);
        const { data: allData, error } = await query;

        if (error) {
            throw new Error(`Database error: ${error.message}`);
        }

        if (!allData || allData.length === 0) {
            return { data: [], page, hasMore: false };
        }

        // trendingの場合、trend_scoreを計算
        let processedData = allData;
        if (config.type === 'trending') {
            const placeIds = allData.map((p: Place) => p.place_id);
            const yesterdayVisits = await this.aggregator.getYesterdayVisits(placeIds);

            processedData = allData.map((place: Place) => {
                const yesterdayCount = yesterdayVisits.get(place.place_id) || 0;
                const trendScore = this.aggregator.calculateTrendScore(
                    place.visit_count,
                    yesterdayCount
                );

                return {
                    ...place,
                    trend_score: trendScore
                };
            });
        }

        // ソート実行
        if (config.sortFunction) {
            processedData.sort(config.sortFunction);
        }

        // ページネーション
        const offset = (page - 1) * limit;
        const paginatedData = processedData.slice(offset, offset + limit);

        return {
            data: paginatedData,
            page,
            hasMore: processedData.length > offset + limit,
            totalCount: processedData.length
        };
    }

    /**
     * 集計型のランキング処理
     * （rating, reviews, mylist）
     */
    private async processAggregationRanking(
        config: RankingConfig,
        request: RankingRequest,
        page: number,
        limit: number
    ): Promise<RankingResponse> {
        let targetPlaceIds: number[] = [];
        let statsMap: Map<number, any> = new Map();

        // タイプに応じて集計
        switch (config.type) {
            case 'rating':
            case 'reviews': {
                const reviewStats = await this.aggregator.aggregateReviews();

                if (config.type === 'reviews') {
                    // レビュー数ランキング
                    targetPlaceIds = Array.from(reviewStats.entries())
                        .sort((a, b) => b[1].count - a[1].count)
                        .slice(0, config.limit)
                        .map(entry => entry[0]);
                } else {
                    // 高評価ランキング（レビュー数3以上）
                    targetPlaceIds = Array.from(reviewStats.entries())
                        .filter(entry => entry[1].count >= 3)
                        .sort((a, b) => b[1].avg - a[1].avg)
                        .slice(0, config.limit)
                        .map(entry => entry[0]);
                }

                statsMap = reviewStats;
                break;
            }

            case 'mylist': {
                const mylistCounts = await this.aggregator.aggregateMylist();
                targetPlaceIds = Array.from(mylistCounts.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, config.limit)
                    .map(entry => entry[0]);

                statsMap = mylistCounts;
                break;
            }
        }

        if (targetPlaceIds.length === 0) {
            return { data: [], page, hasMore: false };
        }

        // placesテーブルから取得
        let query = this.supabase
            .from('places')
            .select(PLACE_COLUMNS)
            .in('place_id', targetPlaceIds);

        // ジャンルフィルター
        if (request.genre && request.genre !== 'all') {
            query = query.eq('genre', request.genre);
        }

        const { data: places, error } = await query;

        if (error) {
            throw new Error(`Database error: ${error.message}`);
        }

        // 統計情報をマージ
        const placesWithStats = ((places as unknown) as Place[])?.map(place => {
            const stats = statsMap.get(place.place_id);
            if (config.type === 'rating' || config.type === 'reviews') {
                return {
                    ...place,
                    review_count: stats?.count || 0,
                    average_rating: stats?.avg || 0
                } as Place;
            } else if (config.type === 'mylist') {
                return {
                    ...place,
                    mylist_count: stats || 0
                } as Place;
            }
            return place;
        }) || [];

        // ソート（IDの順序が崩れている可能性があるため）
        if (config.sortFunction) {
            placesWithStats.sort(config.sortFunction);
        }

        // ページネーション
        const offset = (page - 1) * limit;
        const paginatedData = placesWithStats.slice(offset, offset + limit);

        return {
            data: paginatedData,
            page,
            hasMore: placesWithStats.length > offset + limit,
            totalCount: placesWithStats.length
        };
    }
}
