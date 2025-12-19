/**
 * ランキング機能の定数定義
 * マジックナンバーを排除し、設定値を一元管理
 */

/** デフォルトのページサイズ */
export const DEFAULT_PAGE_SIZE = 50;

/** 最小お気に入り数（品質フィルター） */
export const MIN_FAVORITE_COUNT = 50;

/** 高評価率ランキングの最小いいね数 */
export const LIKE_RATIO_MIN_LIKES = 5;

/** 高評価率ランキングの取得件数（JSソート用） */
export const LIKE_RATIO_FETCH_SIZE = 500;

/** 高評価ランキングの最小レビュー数 */
export const RATING_MIN_REVIEWS = 3;

/** 隠れた名作の訪問数上限 */
export const HIDDEN_MAX_VISITS = 1000000;

/** 隠れた名作の最小評価 */
export const HIDDEN_MIN_RATING = 4.5;

/** お気に入り率ランキングの最小訪問数 */
export const FAVORITE_RATIO_MIN_VISITS = 1000;

/** 集計系ランキングのトップ件数 */
export const AGGREGATION_TOP_COUNT = 100;

/** ページネーションの最大ページ数（DoS対策） */
export const MAX_PAGE = 1000;

/** リミットの最大値（DoS対策） */
export const MAX_LIMIT = 100;

/** リミットの最小値 */
export const MIN_LIMIT = 1;

/** SELECTするカラムのリスト（データ露出対策） */
export const PLACE_COLUMNS = [
    'place_id',
    'name',
    'creator_name',
    'thumbnail_url',
    'visit_count',
    'favorite_count',
    'playing',
    'genre',
    'first_released_at',
    'last_updated_at',
    'like_count',
    'dislike_count',
    'like_ratio'
].join(',');
