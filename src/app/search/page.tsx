"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const supabase = createClient();

type Place = {
    place_id: number;
    name: string;
    creator_name: string;
    thumbnail_url: string | null;
    visit_count: number;
    favorite_count: number;
    average_rating?: number;
    review_count?: number;
};

function SearchContent() {
    const [places, setPlaces] = useState<Place[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [page, setPage] = useState(0);
    const [keyword, setKeyword] = useState("");
    const [minRating, setMinRating] = useState(0);
    const [sortBy, setSortBy] = useState<"relevance" | "rating" | "visits">("relevance");
    const router = useRouter();
    const searchParams = useSearchParams();

    const ITEMS_PER_PAGE = 24;

    useEffect(() => {
        const q = searchParams.get("q");
        if (q) {
            setKeyword(q);
            setPage(0);
            performSearch(q, 0);
        }
    }, [searchParams]);

    const performSearch = async (searchKeyword?: string, pageNum: number = 0) => {
        const query = searchKeyword || keyword;
        if (!query.trim()) return;

        const isInitialLoad = pageNum === 0;
        if (isInitialLoad) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }

        const from = pageNum * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;

        // Search in database
        const { data: placeData, count } = await supabase
            .from("places")
            .select("*", { count: "exact" })
            .gte("favorite_count", 50)
            .or(`name.ilike.%${query}%,creator_name.ilike.%${query}%`)
            .range(from, to);

        if (!placeData) {
            setLoading(false);
            setLoadingMore(false);
            return;
        }

        // Fetch reviews
        const placeIds = placeData.map((p) => p.place_id);
        const { data: allReviews } = await supabase
            .from("reviews")
            .select("place_id, rating")
            .in("place_id", placeIds);

        const reviewsMap = new Map<number, { count: number; sum: number }>();
        if (allReviews) {
            for (const r of allReviews) {
                const current = reviewsMap.get(r.place_id) || { count: 0, sum: 0 };
                reviewsMap.set(r.place_id, {
                    count: current.count + 1,
                    sum: current.sum + r.rating,
                });
            }
        }

        const withRatings = placeData.map((p) => {
            const stats = reviewsMap.get(p.place_id);
            const count = stats?.count || 0;
            const avg = count > 0 ? stats!.sum / count : 0;

            return {
                ...p,
                average_rating: avg,
                review_count: count,
            };
        });

        // Filter by rating
        const filtered = withRatings.filter((p) => (p.average_rating || 0) >= minRating);

        if (isInitialLoad) {
            setPlaces(filtered);
        } else {
            setPlaces(prev => [...prev, ...filtered]);
        }

        // Check if there are more items
        if (count !== null) {
            setHasMore((pageNum + 1) * ITEMS_PER_PAGE < count);
        }

        setLoading(false);
        setLoadingMore(false);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(0);
        performSearch(keyword, 0);
    };

    const loadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        performSearch(keyword, nextPage);
    };

    const sortedPlaces = [...places].sort((a, b) => {
        switch (sortBy) {
            case "rating":
                return (b.average_rating || 0) - (a.average_rating || 0);
            case "visits":
                return (b.visit_count || 0) - (a.visit_count || 0);
            default:
                return 0;
        }
    });

    return (
        <main className="min-h-screen bg-slate-900 text-white pb-20">
            {/* Header */}
            <div className="bg-slate-800 border-b border-slate-700">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <Link href="/" className="text-sm text-slate-400 hover:text-white mb-4 inline-block">
                        &larr; ホームに戻る
                    </Link>
                    <h1 className="text-4xl font-bold mb-2">検索</h1>
                    <p className="text-slate-400">お気に入りのゲームを見つけよう</p>
                </div>
            </div>

            {/* Search Form */}
            <div className="bg-slate-800/50 border-b border-slate-700">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <form onSubmit={handleSearch} className="space-y-4">
                        {/* Keyword */}
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">キーワード</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={keyword}
                                    onChange={(e) => setKeyword(e.target.value)}
                                    placeholder="ゲーム名、作者名で検索..."
                                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none"
                                />
                                <button
                                    type="submit"
                                    className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-8 py-3 rounded-lg transition-colors"
                                >
                                    検索
                                </button>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">最低評価</label>
                                <select
                                    value={minRating}
                                    onChange={(e) => setMinRating(Number(e.target.value))}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none"
                                >
                                    <option value={0}>すべて</option>
                                    <option value={4}>★4以上</option>
                                    <option value={4.5}>★4.5以上</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">並び替え</label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as any)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none"
                                >
                                    <option value="relevance">関連度順</option>
                                    <option value="rating">評価順</option>
                                    <option value="visits">訪問数順</option>
                                </select>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* Results */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {loading ? (
                    <div className="text-center py-20 text-slate-500">検索中...</div>
                ) : places.length === 0 && keyword ? (
                    <div className="text-center py-20">
                        <p className="text-slate-400 text-lg">「{keyword}」の検索結果が見つかりませんでした</p>
                    </div>
                ) : places.length > 0 ? (
                    <>
                        <p className="text-slate-400 mb-6">{sortedPlaces.length}件の結果</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {sortedPlaces.map((place) => (
                                <div
                                    key={place.place_id}
                                    onClick={() => router.push(`/place/${place.place_id}`)}
                                    className="group cursor-pointer bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-yellow-500/50 hover:shadow-lg transition-all"
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
                                    <div className="p-4 flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-1">
                                            <span className="text-yellow-500">★</span>
                                            <span>{place.average_rating ? place.average_rating.toFixed(1) : "-"}</span>
                                        </div>
                                        <div className="flex gap-3 text-xs text-slate-400">
                                            <span>👁 {(place.visit_count / 1000000).toFixed(1)}M+</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Load More Button */}
                        {hasMore && (
                            <div className="flex justify-center mt-8">
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
                    </>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-slate-400">キーワードを入力して検索してください</p>
                    </div>
                )}
            </div>
        </main>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <main className="min-h-screen bg-slate-900 text-white pb-20">
                <div className="text-center py-20 text-slate-500">読み込み中...</div>
            </main>
        }>
            <SearchContent />
        </Suspense>
    );
}
