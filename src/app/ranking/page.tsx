"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getGenreName } from "@/lib/roblox";
import Link from "next/link";

const supabase = createClient();

type Place = {
    place_id: number;
    name: string;
    creator_name: string;
    thumbnail_url: string | null;
    visit_count: number;
    favorite_count: number;
    playing: number | null;
    average_rating?: number;
    review_count?: number;
};

type RankingType = "overall" | "playing" | "rating" | "hidden" | "favorites";

export default function RankingPage() {
    const [places, setPlaces] = useState<Place[]>([]);
    const [loading, setLoading] = useState(true);
    const [rankingType, setRankingType] = useState<RankingType>("overall");
    const [selectedGenre, setSelectedGenre] = useState<string>("all");
    const [genres, setGenres] = useState<Array<{ id: string; name: string }>>([]);
    const router = useRouter();

    useEffect(() => {
        // Fetch available genres
        async function fetchGenres() {
            const { data } = await supabase
                .from("places")
                .select("genre")
                .gte("favorite_count", 50)
                .not("genre", "is", null);

            if (data) {
                const uniqueGenres = [...new Set(data.map(p => p.genre).filter(Boolean))];
                const genreList = uniqueGenres.map(g => ({
                    id: g as string,
                    name: getGenreName(g as string)
                }));
                setGenres(genreList);
            }
        }
        fetchGenres();
    }, []);

    useEffect(() => {
        async function fetchRanking() {
            setLoading(true);

            // Build query
            let query = supabase
                .from("places")
                .select("*")
                .gte("favorite_count", 50);

            // Apply genre filter
            if (selectedGenre !== "all") {
                query = query.eq("genre", selectedGenre);
            }

            // Apply sorting based on ranking type
            switch (rankingType) {
                case "playing":
                    query = query.order("playing", { ascending: false });
                    break;
                case "favorites":
                    query = query.order("favorite_count", { ascending: false });
                    break;
                default:
                    query = query.order("visit_count", { ascending: false });
            }

            const { data: placeData } = await query.limit(100);

            if (!placeData) {
                setLoading(false);
                return;
            }

            // Fetch reviews for all places
            const placeIds = placeData.map((p) => p.place_id);
            const { data: allReviews } = await supabase
                .from("reviews")
                .select("place_id, rating")
                .in("place_id", placeIds);

            // Calculate ratings
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

            setPlaces(withRatings);
            setLoading(false);
        }

        fetchRanking();
    }, [rankingType, selectedGenre]);

    const sortedPlaces = [...places].sort((a, b) => {
        switch (rankingType) {
            case "overall":
                // 総合: 評価 × 訪問数
                const scoreA = (a.average_rating || 0) * Math.log10(a.visit_count || 1);
                const scoreB = (b.average_rating || 0) * Math.log10(b.visit_count || 1);
                return scoreB - scoreA;
            case "playing":
                // 今プレイ中: playing順
                return (b.playing || 0) - (a.playing || 0);
            case "rating":
                // 高評価: 平均評価が高い順（レビュー数3件以上）
                if ((a.review_count || 0) < 3) return 1;
                if ((b.review_count || 0) < 3) return -1;
                return (b.average_rating || 0) - (a.average_rating || 0);
            case "hidden":
                // 隠れた名作: 高評価 & 低訪問数
                const isHiddenA = (a.average_rating || 0) >= 4.5 && a.visit_count < 1000000;
                const isHiddenB = (b.average_rating || 0) >= 4.5 && b.visit_count < 1000000;
                if (isHiddenA && !isHiddenB) return -1;
                if (!isHiddenA && isHiddenB) return 1;
                return (b.average_rating || 0) - (a.average_rating || 0);
            case "favorites":
                // お気に入り: favorite_count順
                return (b.favorite_count || 0) - (a.favorite_count || 0);
            default:
                return 0;
        }
    });

    const rankingTabs = [
        { id: "overall", label: "🏆 総合", icon: "🏆" },
        { id: "playing", label: "👥 今プレイ中", icon: "👥" },
        { id: "rating", label: "⭐ 高評価", icon: "⭐" },
        { id: "hidden", label: "💎 隠れた名作", icon: "💎" },
        { id: "favorites", label: "❤️ お気に入り", icon: "❤️" },
    ];

    return (
        <main className="min-h-screen bg-slate-900 text-white pb-20">
            {/* Header */}
            <div className="bg-slate-800 border-b border-slate-700">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <Link href="/" className="text-sm text-slate-400 hover:text-white mb-4 inline-block">
                        &larr; ホームに戻る
                    </Link>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold mb-2">ランキング</h1>
                            <p className="text-slate-400">人気のRobloxゲームをチェック</p>
                        </div>
                        {/* Genre Filter */}
                        <div className="hidden md:block">
                            <label className="block text-xs text-slate-400 mb-2">ジャンル</label>
                            <select
                                value={selectedGenre}
                                onChange={(e) => setSelectedGenre(e.target.value)}
                                className="bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-yellow-500 outline-none min-w-[150px]"
                            >
                                <option value="all">すべて</option>
                                {genres.map((genre) => (
                                    <option key={genre.id} value={genre.id}>
                                        {genre.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Genre Filter */}
            <div className="md:hidden bg-slate-800/50 border-b border-slate-700 px-6 py-3">
                <label className="block text-xs text-slate-400 mb-2">ジャンル</label>
                <select
                    value={selectedGenre}
                    onChange={(e) => setSelectedGenre(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-yellow-500 outline-none"
                >
                    <option value="all">すべて</option>
                    {genres.map((genre) => (
                        <option key={genre.id} value={genre.id}>
                            {genre.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Tabs */}
            <div className="bg-slate-800/50 border-b border-slate-700 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar py-4">
                        {rankingTabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setRankingType(tab.id as RankingType)}
                                className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-all ${rankingType === tab.id
                                    ? "bg-yellow-500 text-black"
                                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Ranking List */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {loading ? (
                    <div className="text-center py-20 text-slate-500">読み込み中...</div>
                ) : (
                    <div className="space-y-4">
                        {sortedPlaces.slice(0, 50).map((place, index) => (
                            <div
                                key={place.place_id}
                                onClick={() => router.push(`/place/${place.place_id}`)}
                                className="group cursor-pointer bg-slate-800 rounded-xl p-4 border border-slate-700 hover:border-yellow-500/50 transition-all flex items-center gap-4"
                            >
                                {/* Rank */}
                                <div
                                    className={`text-3xl font-bold w-16 text-center shrink-0 ${index === 0
                                        ? "text-yellow-400"
                                        : index === 1
                                            ? "text-slate-300"
                                            : index === 2
                                                ? "text-orange-400"
                                                : "text-slate-500"
                                        }`}
                                >
                                    {index + 1}
                                </div>

                                {/* Thumbnail */}
                                <div className="w-32 h-20 bg-slate-700 rounded-lg overflow-hidden shrink-0">
                                    {place.thumbnail_url ? (
                                        <img
                                            src={place.thumbnail_url}
                                            alt={place.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                                            画像なし
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-bold text-white truncate group-hover:text-yellow-400 transition-colors">
                                        {place.name}
                                    </h3>
                                    <p className="text-sm text-slate-400 truncate">by {place.creator_name}</p>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-300">
                                        <span className="flex items-center gap-1">
                                            <span className="text-yellow-500">★</span>
                                            {place.average_rating ? place.average_rating.toFixed(1) : "-"}
                                            <span className="text-slate-500 text-xs">({place.review_count || 0})</span>
                                        </span>
                                        {place.playing !== null && place.playing > 0 && (
                                            <span className="text-green-400">👥 {place.playing.toLocaleString()}</span>
                                        )}
                                        <span>👁 {(place.visit_count / 1000000).toFixed(1)}M+</span>
                                        <span>♥ {(place.favorite_count / 1000).toFixed(1)}K+</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
