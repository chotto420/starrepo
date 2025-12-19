/**
 * ランキング機能の型定義
 * すべてのランキング処理で使用する共通の型とインターフェース
 */

/** ランキングタイプの列挙 */
export type RankingType =
    | "overall"         // 総訪問数
    | "playing"         // 今プレイ中
    | "favorites"       // お気に入り
    | "likeRatio"       // 高評価率
    | "trending"        // 急上昇
    | "newest"          // 新作ゲーム
    | "updated"         // 最近更新
    | "rating"          // 高評価
    | "reviews"         // レビュー数
    | "mylist"          // マイリスト
    | "hidden"          // 隠れた名作
    | "favoriteRatio";  // お気に入り率

/** ゲームデータの型定義 */
export interface Place {
    place_id: number;
    name: string;
    creator_name: string;
    thumbnail_url: string | null;
    visit_count: number;
    favorite_count: number;
    playing: number | null;
    genre: string | null;
    first_released_at?: string;
    last_updated_at?: string;
    like_count?: number;
    dislike_count?: number;
    like_ratio?: number;

    // 計算フィールド（ランキング処理で追加される）
    average_rating?: number;
    review_count?: number;
    mylist_count?: number;
    trend_score?: number;
}

/** フィルター条件の型定義 */
export interface FilterCondition {
    field: string;
    operator: '=' | '>' | '>=' | '<' | '<=' | 'IS_NOT_NULL' | 'IS_NULL';
    value?: any;
}

/** ランキング設定の型定義 */
export interface RankingConfig {
    type: RankingType;
    dataSource: 'places' | 'reviews' | 'mylist';
    requiresAggregation: boolean;
    filters: FilterCondition[];
    sortMethod: 'db' | 'js';
    sortKey?: string;  // DBソート時のカラム名
    sortFunction?: (a: Place, b: Place) => number;  // JSソート時の関数
    limit: number;
}

/** ランキングリクエストの型定義 */
export interface RankingRequest {
    type: RankingType;
    genre?: string;
    page?: number;
    limit?: number;
}

/** ランキングレスポンスの型定義 */
export interface RankingResponse {
    data: Place[];
    page: number;
    hasMore: boolean;
    totalCount?: number;
}

/** 検証結果の型定義 */
export interface ValidationResult {
    valid: boolean;
    error?: string;
}
