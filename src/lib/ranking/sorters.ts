/**
 * ランキングのソート関数集
 * JavaScriptソートが必要なランキングタイプで使用
 */

import { Place } from './types';
import { HIDDEN_MIN_RATING, HIDDEN_MAX_VISITS } from './constants';

/**
 * 高評価率ソート（like_ratio降順 + place_id昇順）
 * セカンダリソートでplace_idを使用し、決定的な順序を保証
 */
export function likeRatioSort(a: Place, b: Place): number {
    const ratioA = a.like_ratio ?? calculateLikeRatio(a);
    const ratioB = b.like_ratio ?? calculateLikeRatio(b);

    const diff = ratioB - ratioA;
    if (Math.abs(diff) > 0.0001) {
        return diff;
    }

    // セカンダリソート（決定的順序）
    return a.place_id - b.place_id;
}

/**
 * お気に入り率ソート
 */
export function favoriteRatioSort(a: Place, b: Place): number {
    const ratioA = a.visit_count > 0
        ? (a.favorite_count || 0) / a.visit_count
        : 0;
    const ratioB = b.visit_count > 0
        ? (b.favorite_count || 0) / b.visit_count
        : 0;
    return ratioB - ratioA;
}

/**
 * 高評価ソート
 * レビュー数3未満は下位に配置
 */
export function ratingSort(a: Place, b: Place): number {
    // レビュー数3未満は下位
    if ((a.review_count || 0) < 3) return 1;
    if ((b.review_count || 0) < 3) return -1;
    return (b.average_rating || 0) - (a.average_rating || 0);
}

/**
 * レビュー数ソート
 */
export function reviewsSort(a: Place, b: Place): number {
    return (b.review_count || 0) - (a.review_count || 0);
}

/**
 * 急上昇ソート
 */
export function trendingSort(a: Place, b: Place): number {
    return (b.trend_score || 0) - (a.trend_score || 0);
}

/**
 * 隠れた名作ソート
 * 条件: 評価4.5以上 & 訪問数100万未満
 */
export function hiddenSort(a: Place, b: Place): number {
    const isHiddenA = (a.average_rating || 0) >= HIDDEN_MIN_RATING && a.visit_count < HIDDEN_MAX_VISITS;
    const isHiddenB = (b.average_rating || 0) >= HIDDEN_MIN_RATING && b.visit_count < HIDDEN_MAX_VISITS;

    // 条件を満たすものを優先
    if (isHiddenA && !isHiddenB) return -1;
    if (!isHiddenA && isHiddenB) return 1;

    // 両方とも条件を満たす、または満たさない場合は評価順
    return (b.average_rating || 0) - (a.average_rating || 0);
}

/**
 * マイリスト数ソート
 */
export function mylistSort(a: Place, b: Place): number {
    return (b.mylist_count || 0) - (a.mylist_count || 0);
}

// ===== ヘルパー関数 =====

/**
 * like_ratioを計算
 */
function calculateLikeRatio(place: Place): number {
    const likeCount = place.like_count || 0;
    const dislikeCount = place.dislike_count || 0;
    const total = likeCount + dislikeCount;
    return total > 0 ? likeCount / total : 0;
}
