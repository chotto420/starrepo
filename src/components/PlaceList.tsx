"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getGenreName } from "@/lib/roblox";

const supabase = createClient();

type Place = {
    place_id: number;
    name: string;
    creator_name: string;
    thumbnail_url: string | null;
    visit_count: number;
    favorite_count: number;
    genre: string | null;
    average_rating?: number;
};

const ITEMS_PER_PAGE = 24;

export default function PlaceList() {
    const [places, setPlaces] = useState<Place[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);
    const router = useRouter();

    useEffect(() => {
        fetchPlaces(0);
    }, []);

    async function fetchPlaces(pageNum: number) {
        const isInitialLoad = pageNum === 0;
        if (isInitialLoad) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }

        const from = pageNum * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;

        const { data, error, count } = await supabase
            .from("places")
            .select("*", { count: "exact" })
            .gte("favorite_count", 50)
            .order("last_updated_at", { ascending: false })
            .range(from, to);

        if (data) {
            if (isInitialLoad) {
                setPlaces(data);
            } else {
                setPlaces(prev => [...prev, ...data]);
            }

            // Check if there are more items
            if (count !== null) {
                setHasMore((pageNum + 1) * ITEMS_PER_PAGE < count);
            }
        }

        setLoading(false);
        setLoadingMore(false);
    }

    const loadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchPlaces(nextPage);
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 animate-pulse">
                        <div className="h-48 bg-slate-700"></div>
                        <div className="p-4 space-y-2">
                            <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                            <div className="h-3 bg-slate-700 rounded w-1/2"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {places.map((place) => (
                    <div
                        key={place.place_id}
                        onClick={() => router.push(`/place/${place.place_id}`)}
                        className="group cursor-pointer bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-yellow-500/50 hover:shadow-lg hover:shadow-yellow-500/10 transition-all"
                    >
                        <div className="relative h-48 bg-slate-700">
                            {place.thumbnail_url ? (
                                <img
                                    src={place.thumbnail_url}
                                    alt={place.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-500">画像なし</div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent"></div>
                            <div className="absolute bottom-3 left-3 right-3">
                                <h3 className="text-lg font-bold text-white truncate group-hover:text-yellow-400 transition-colors">
                                    {place.name}
                                </h3>
                                <p className="text-xs text-slate-400 truncate">by {place.creator_name}</p>
                            </div>
                        </div>
                        <div className="p-4">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-1">
                                    <span className="text-yellow-500">★</span>
                                    <span>{place.average_rating ? place.average_rating.toFixed(1) : "-"}</span>
                                </div>
                                <div className="flex gap-3 text-xs text-slate-400">
                                    <span>👁 {(place.visit_count / 1000000).toFixed(1)}M+</span>
                                </div>
                            </div>
                            {place.genre && (
                                <div className="mt-2">
                                    <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
                                        {getGenreName(place.genre)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
                <div className="flex justify-center">
                    <button
                        onClick={loadMore}
                        disabled={loadingMore}
                        className="px-8 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loadingMore ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                読み込み中...
                            </span>
                        ) : (
                            "もっと見る"
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
