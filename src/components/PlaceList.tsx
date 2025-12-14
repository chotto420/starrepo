"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Star, User, Users, Activity, Eye, Heart } from "lucide-react";
import { PlaceCardSkeleton } from "./Skeleton";

type Place = {
    place_id: number;
    name: string;
    description: string;
    thumbnail_url: string;
    visit_count: number;
    favorite_count: number;
    average_rating: number | null;
    created_at: string;
    updated_at: string;
    genre: string | null;
    creator_name: string;
    review_count: number;
};

export default function PlaceList() {
    const [places, setPlaces] = useState<Place[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const observer = useRef<IntersectionObserver | null>(null);
    const [loading, setLoading] = useState(false); // To prevent double fetch
    const [initialLoading, setInitialLoading] = useState(true); // 初回ロード用

    // 自動読み込みの上限（4ページ = 48件）12件/ページ）
    const AUTO_LOAD_MAX_PAGE = 4;

    // Infinite Scroll Observer（上限まで自動読み込み）
    const lastPlaceElementRef = useCallback(
        (node: HTMLAnchorElement | null) => {
            if (loading) return;
            // 上限に達したら自動読み込みを停止
            if (page >= AUTO_LOAD_MAX_PAGE) return;
            if (observer.current) observer.current.disconnect();
            observer.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && hasMore && page < AUTO_LOAD_MAX_PAGE) {
                    setPage((prevPage) => prevPage + 1);
                }
            });
            if (node) observer.current.observe(node);
        },
        [loading, hasMore, page]
    );

    useEffect(() => {
        const fetchPlaces = async () => {
            setLoading(true);
            const supabase = createClient();
            const start = (page - 1) * 12;
            const end = start + 11;

            const { data, error } = await supabase
                .from("places")
                .select("*")
                .order("visit_count", { ascending: false }) // 人気順
                .range(start, end);

            if (error) {
                console.error("Error fetching places:", error);
            } else if (data && data.length > 0) {
                // Fetch average ratings from reviews
                const placeIds = data.map((p: Place) => p.place_id);
                const { data: reviewStats } = await supabase
                    .from("reviews")
                    .select("place_id, rating")
                    .in("place_id", placeIds);

                // Calculate average ratings
                const ratingsByPlace: Record<number, number[]> = {};
                reviewStats?.forEach((r: { place_id: number; rating: number }) => {
                    if (!ratingsByPlace[r.place_id]) {
                        ratingsByPlace[r.place_id] = [];
                    }
                    ratingsByPlace[r.place_id].push(r.rating);
                });

                const placesWithRatings = data.map((p: Place) => ({
                    ...p,
                    average_rating: ratingsByPlace[p.place_id]
                        ? ratingsByPlace[p.place_id].reduce((a, b) => a + b, 0) / ratingsByPlace[p.place_id].length
                        : null,
                    review_count: ratingsByPlace[p.place_id]?.length || 0
                }));

                setPlaces((prevPlaces) => {
                    // 重複排除 (念のため)
                    const newPlaces = placesWithRatings.filter(
                        (p: Place) => !prevPlaces.some((existing) => existing.place_id === p.place_id)
                    );
                    return [...prevPlaces, ...newPlaces];
                });
                if (data.length < 12) {
                    setHasMore(false);
                }
            }
            setLoading(false);
            setInitialLoading(false); // 初回ロード完了
        };

        fetchPlaces();
    }, [page]);

    // Format numbers like 31M+, 500k, etc.
    const formatNumber = (num: number) => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + "M";
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + "k";
        }
        return num.toString();
    };

    // 初回ロード中はスケルトングリッドを表示
    if (initialLoading) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 pb-12">
                {[...Array(8)].map((_, i) => (
                    <PlaceCardSkeleton key={`initial-skeleton-${i}`} />
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 pb-12">
            {places.map((place, index) => {
                const isLast = places.length === index + 1;
                return (
                    <Link
                        href={`/place/${place.place_id}`}
                        key={place.place_id}
                        ref={isLast ? lastPlaceElementRef : null}
                        className="group relative bg-[#1c222c] rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 block"
                    >
                        {/* Thumbnail Container */}
                        <div className="relative aspect-video overflow-hidden">
                            {place.thumbnail_url ? (
                                <Image
                                    src={place.thumbnail_url}
                                    alt={place.name}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                    placeholder="blur"
                                    blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWUyOTNiIi8+PC9zdmc+"
                                />
                            ) : (
                                <div className="w-full h-full bg-slate-700 flex items-center justify-center text-4xl">
                                    <Activity className="w-12 h-12 text-slate-500 opacity-50" />
                                </div>
                            )}

                            {/* Genre Badge */}
                            {place.genre && (
                                <div className="absolute top-2 left-2 px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold rounded-full shadow-lg">
                                    {place.genre}
                                </div>
                            )}

                            {/* Overlay Gradient on Hover */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>

                        {/* Content */}
                        <div className="p-2 sm:p-4">
                            <h3 className="text-white font-bold text-sm sm:text-lg mb-0.5 sm:mb-1 truncate group-hover:text-yellow-400 transition-colors">
                                {place.name}
                            </h3>
                            <p className="text-slate-400 text-xs mb-2 sm:mb-3 flex items-center gap-1 truncate">
                                <User className="w-3 h-3" />
                                <span className="hidden sm:inline">{place.creator_name}</span>
                                <span className="sm:hidden">{place.creator_name?.slice(0, 12)}{place.creator_name?.length > 12 ? '...' : ''}</span>
                            </p>

                            <div className="flex items-center justify-between pt-1.5 sm:pt-2 border-t border-slate-700/50">
                                <div className="flex items-center gap-0.5 sm:gap-1 text-yellow-400 font-bold text-xs sm:text-sm">
                                    <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-yellow-400" />
                                    <span>{(place.average_rating || 0).toFixed(1)}</span>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-3 text-xs font-medium text-slate-400">
                                    <span className="flex items-center gap-0.5 sm:gap-1" title="総訪問数">
                                        <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                        <span className="hidden sm:inline">{formatNumber(place.visit_count)}</span>
                                        <span className="sm:hidden text-[10px]">{formatNumber(place.visit_count)}</span>
                                    </span>
                                    <span className="flex items-center gap-0.5 sm:gap-1" title="お気に入り数">
                                        <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                        <span className="hidden sm:inline">{formatNumber(place.favorite_count)}</span>
                                        <span className="sm:hidden text-[10px]">{formatNumber(place.favorite_count)}</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Link>
                );
            })}

            {/* Loading Skeletons（自動読み込み中） */}
            {hasMore && page < AUTO_LOAD_MAX_PAGE && loading && (
                <>
                    {[...Array(4)].map((_, i) => (
                        <div key={`skeleton-${i}`} className="bg-[#1c222c] rounded-xl overflow-hidden shadow-lg animate-pulse">
                            <div className="aspect-video bg-slate-700"></div>
                            <div className="p-4 space-y-3">
                                <div className="h-6 bg-slate-700 rounded w-3/4"></div>
                                <div className="h-4 bg-slate-700 rounded w-1/2"></div>
                                <div className="pt-2 border-t border-slate-700/50 flex justify-between">
                                    <div className="h-5 w-10 bg-slate-700 rounded"></div>
                                    <div className="h-5 w-20 bg-slate-700 rounded"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </>
            )}

            {/* 96件以降は手動ボタン */}
            {hasMore && page >= AUTO_LOAD_MAX_PAGE && (
                <div className="col-span-full flex flex-col items-center py-8 gap-4">
                    {loading ? (
                        <div className="flex items-center gap-2 text-slate-400">
                            <div className="w-5 h-5 border-2 border-slate-600 border-t-yellow-500 rounded-full animate-spin" />
                            <span>読み込み中...</span>
                        </div>
                    ) : (
                        <>
                            <p className="text-slate-500 text-sm">
                                {places.length}件を表示中
                            </p>
                            <button
                                onClick={() => setPage((prev) => prev + 1)}
                                className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold rounded-lg hover:from-yellow-400 hover:to-amber-400 transition-all shadow-lg hover:shadow-yellow-500/25"
                            >
                                さらに12件を読み込む
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* End of List */}
            {!hasMore && places.length > 0 && (
                <div className="col-span-full text-center py-8 text-slate-500 text-sm">
                    すべてのゲームを表示しました（{places.length}件）
                </div>
            )}
        </div>
    );
}
