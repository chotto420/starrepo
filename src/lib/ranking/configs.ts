/**
 * ランキング設定
 * 各ランキングタイプの詳細設定を定義
 */

import { RankingConfig, RankingType } from './types';
import * as CONST from './constants';
import * as sorters from './sorters';

/**
 * 各ランキングタイプの設定マップ
 */
export const RANKING_CONFIGS: Record<RankingType, RankingConfig> = {
    // ===== Roblox Stats系 =====

    overall: {
        type: 'overall',
        dataSource: 'places',
        requiresAggregation: false,
        filters: [
            { field: 'favorite_count', operator: '>=', value: CONST.MIN_FAVORITE_COUNT }
        ],
        sortMethod: 'db',
        sortKey: 'visit_count',
        limit: CONST.DEFAULT_PAGE_SIZE
    },

    playing: {
        type: 'playing',
        dataSource: 'places',
        requiresAggregation: false,
        filters: [
            { field: 'favorite_count', operator: '>=', value: CONST.MIN_FAVORITE_COUNT }
        ],
        sortMethod: 'db',
        sortKey: 'playing',
        limit: CONST.DEFAULT_PAGE_SIZE
    },

    favorites: {
        type: 'favorites',
        dataSource: 'places',
        requiresAggregation: false,
        filters: [],  // お気に入り数でソートするため、フィルターなし
        sortMethod: 'db',
        sortKey: 'favorite_count',
        limit: CONST.DEFAULT_PAGE_SIZE
    },

    likeRatio: {
        type: 'likeRatio',
        dataSource: 'places',
        requiresAggregation: false,
        filters: [
            { field: 'like_count', operator: 'IS_NOT_NULL' },
            { field: 'dislike_count', operator: 'IS_NOT_NULL' },
            { field: 'like_count', operator: '>=', value: CONST.LIKE_RATIO_MIN_LIKES }
        ],
        sortMethod: 'js',  // like_ratioがnullの場合があるためJSソート
        sortFunction: sorters.likeRatioSort,
        limit: CONST.LIKE_RATIO_FETCH_SIZE  // 500件取得してJSソート
    },

    // ===== Discovery系 =====

    newest: {
        type: 'newest',
        dataSource: 'places',
        requiresAggregation: false,
        filters: [
            { field: 'favorite_count', operator: '>=', value: CONST.MIN_FAVORITE_COUNT }
        ],
        sortMethod: 'db',
        sortKey: 'first_released_at',
        limit: CONST.DEFAULT_PAGE_SIZE
    },

    updated: {
        type: 'updated',
        dataSource: 'places',
        requiresAggregation: false,
        filters: [
            { field: 'favorite_count', operator: '>=', value: CONST.MIN_FAVORITE_COUNT }
        ],
        sortMethod: 'db',
        sortKey: 'last_updated_at',
        limit: CONST.DEFAULT_PAGE_SIZE
    },

    // ===== Community Stats系 =====

    rating: {
        type: 'rating',
        dataSource: 'reviews',
        requiresAggregation: true,  // 全レビューを集計
        filters: [
            { field: 'favorite_count', operator: '>=', value: CONST.MIN_FAVORITE_COUNT }
        ],
        sortMethod: 'js',
        sortFunction: sorters.ratingSort,
        limit: CONST.AGGREGATION_TOP_COUNT
    },

    reviews: {
        type: 'reviews',
        dataSource: 'reviews',
        requiresAggregation: true,  // 全レビューを集計
        filters: [
            { field: 'favorite_count', operator: '>=', value: CONST.MIN_FAVORITE_COUNT }
        ],
        sortMethod: 'js',
        sortFunction: sorters.reviewsSort,
        limit: CONST.AGGREGATION_TOP_COUNT
    },

    mylist: {
        type: 'mylist',
        dataSource: 'mylist',
        requiresAggregation: true,  // 全マイリストを集計
        filters: [],
        sortMethod: 'js',
        sortFunction: sorters.mylistSort,
        limit: CONST.AGGREGATION_TOP_COUNT
    },

    // ===== Trend系 =====

    trending: {
        type: 'trending',
        dataSource: 'places',
        requiresAggregation: false,  // 履歴データは別途取得
        filters: [
            { field: 'favorite_count', operator: '>=', value: CONST.MIN_FAVORITE_COUNT }
        ],
        sortMethod: 'js',
        sortFunction: sorters.trendingSort,
        limit: 500  // JSソートのため全件取得
    },

    // ===== Special系 =====

    hidden: {
        type: 'hidden',
        dataSource: 'places',
        requiresAggregation: false,
        filters: [
            { field: 'favorite_count', operator: '>=', value: CONST.MIN_FAVORITE_COUNT },
            { field: 'visit_count', operator: '<', value: CONST.HIDDEN_MAX_VISITS }
        ],
        sortMethod: 'js',
        sortFunction: sorters.hiddenSort,
        limit: CONST.DEFAULT_PAGE_SIZE
    },

    favoriteRatio: {
        type: 'favoriteRatio',
        dataSource: 'places',
        requiresAggregation: false,
        filters: [
            { field: 'visit_count', operator: '>=', value: CONST.FAVORITE_RATIO_MIN_VISITS }
        ],
        sortMethod: 'js',
        sortFunction: sorters.favoriteRatioSort,
        limit: 500  // JSソートのため全件取得
    },
};
