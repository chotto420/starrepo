"use client";

import { FC } from "react";

// スケルトン用のシマーエフェクト付きベースコンポーネント
interface SkeletonProps {
    className?: string;
}

export const Skeleton: FC<SkeletonProps> = ({ className = "" }) => (
    <div className={`bg-slate-700 rounded animate-shimmer ${className}`} />
);

// ゲームカード用スケルトン
export const PlaceCardSkeleton: FC = () => (
    <div className="bg-[#1c222c] rounded-xl overflow-hidden shadow-lg">
        <div className="aspect-video bg-slate-700 animate-shimmer" />
        <div className="p-2 sm:p-4 space-y-2 sm:space-y-3">
            <Skeleton className="h-5 sm:h-6 w-3/4" />
            <Skeleton className="h-3 sm:h-4 w-1/2" />
            <div className="pt-1.5 sm:pt-2 border-t border-slate-700/50 flex justify-between">
                <Skeleton className="h-4 sm:h-5 w-10" />
                <Skeleton className="h-4 sm:h-5 w-20" />
            </div>
        </div>
    </div>
);

// ゲームカードグリッド用スケルトン（複数表示）
interface PlaceGridSkeletonProps {
    count?: number;
}

export const PlaceGridSkeleton: FC<PlaceGridSkeletonProps> = ({ count = 8 }) => (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
        {[...Array(count)].map((_, i) => (
            <PlaceCardSkeleton key={`skeleton-${i}`} />
        ))}
    </div>
);

// ランキングリスト用スケルトン
export const RankingItemSkeleton: FC = () => (
    <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
        {/* Rank Number */}
        <Skeleton className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0" />
        {/* Thumbnail */}
        <Skeleton className="w-16 h-10 sm:w-20 sm:h-12 rounded-lg flex-shrink-0" />
        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-4 sm:h-5 w-3/4" />
            <Skeleton className="h-3 sm:h-4 w-1/2" />
        </div>
        {/* Stats */}
        <Skeleton className="w-16 h-8 sm:w-20 sm:h-10 rounded-lg flex-shrink-0" />
    </div>
);

// ランキングリスト用スケルトン（複数表示）
interface RankingListSkeletonProps {
    count?: number;
}

export const RankingListSkeleton: FC<RankingListSkeletonProps> = ({ count = 10 }) => (
    <div className="space-y-3">
        {[...Array(count)].map((_, i) => (
            <RankingItemSkeleton key={`ranking-skeleton-${i}`} />
        ))}
    </div>
);

// レビュー用スケルトン
export const ReviewSkeleton: FC = () => (
    <div className="bg-slate-800/50 rounded-xl p-4 sm:p-6 border border-slate-700/50">
        <div className="flex items-start gap-3 sm:gap-4">
            {/* Avatar */}
            <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-3">
                {/* Header */}
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 sm:h-5 w-24" />
                    <Skeleton className="h-3 sm:h-4 w-16" />
                </div>
                {/* Stars */}
                <Skeleton className="h-4 w-20" />
                {/* Content */}
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-2/3" />
                </div>
            </div>
        </div>
    </div>
);

// レビューリスト用スケルトン
interface ReviewListSkeletonProps {
    count?: number;
}

export const ReviewListSkeleton: FC<ReviewListSkeletonProps> = ({ count = 3 }) => (
    <div className="space-y-4">
        {[...Array(count)].map((_, i) => (
            <ReviewSkeleton key={`review-skeleton-${i}`} />
        ))}
    </div>
);
