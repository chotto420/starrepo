/**
 * ランキング集計処理
 * reviews, mylist, trendingなどの集計が必要なランキング用
 */

import { SupabaseClient } from '@supabase/supabase-js';

/**
 * ランキング集計クラス
 */
export class RankingAggregator {
    constructor(private supabase: SupabaseClient) { }

    /**
     * レビュー集計
     * 全レビューを集計して、各ゲームの統計情報を返す
     */
    async aggregateReviews(): Promise<Map<number, { count: number; sum: number; avg: number }>> {
        const { data } = await this.supabase
            .from('reviews')
            .select('place_id, rating');

        const stats = new Map<number, { count: number; sum: number; avg: number }>();

        data?.forEach((r: { place_id: number; rating: number }) => {
            const current = stats.get(r.place_id) || { count: 0, sum: 0, avg: 0 };
            current.count += 1;
            current.sum += r.rating;
            current.avg = current.sum / current.count;
            stats.set(r.place_id, current);
        });

        return stats;
    }

    /**
     * マイリスト集計
     * 各ゲームのマイリスト登録数を返す
     */
    async aggregateMylist(): Promise<Map<number, number>> {
        const { data } = await this.supabase
            .from('user_mylist')
            .select('place_id');

        const counts = new Map<number, number>();

        data?.forEach((item: { place_id: number }) => {
            counts.set(item.place_id, (counts.get(item.place_id) || 0) + 1);
        });

        return counts;
    }

    /**
     * トレンド計算用の前日訪問数を取得
     * 急上昇率を計算するために使用
     */
    async getYesterdayVisits(placeIds: number[]): Promise<Map<number, number>> {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        const { data } = await this.supabase
            .from('place_stats_history')
            .select('place_id, visit_count')
            .eq('recorded_at', yesterdayStr)
            .in('place_id', placeIds);

        const visits = new Map<number, number>();

        data?.forEach((h: { place_id: number; visit_count: number }) => {
            visits.set(h.place_id, h.visit_count);
        });

        return visits;
    }

    /**
     * トレンドスコアを計算
     */
    calculateTrendScore(currentVisits: number, yesterdayVisits: number): number {
        if (yesterdayVisits === 0) {
            return 0;
        }
        return ((currentVisits - yesterdayVisits) / yesterdayVisits) * 100;
    }
}
