"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getGenreName } from "@/lib/roblox";
import Link from "next/link";
import { Trophy, Users, Star, Gem, Heart, ChevronLeft, Eye, MessageCircle } from "lucide-react";

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
    genre: string | null;
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
        { id: "overall", label: "総合", icon: Trophy },
        { id: "playing", label: "今プレイ中", icon: Users },
        { id: "rating", label: "高評価", icon: Star },
        { id: "hidden", label: "隠れた名作", icon: Gem },
        { id: "favorites", label: "お気に入り", icon: Heart },
    ];

    return (
        <main className="min-h-screen bg-[#0B0E14] text-white pb-20">
            {/* Header */}
            <div className="bg-[#0B0E14]/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center gap-4 mb-6">
                        <Link href="/" className="text-slate-400 hover:text-white transition-colors p-2 -ml-2 rounded-full hover:bg-slate-800">
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <Trophy className="w-6 h-6 text-yellow-500" />
                                ランキング
                            </h1>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Tabs */}
                        <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1 -mx-6 px-6 md:mx-0 md:px-0 md:pb-0">
                            {rankingTabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setRankingType(tab.id as RankingType)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all border ${rankingType === tab.id
                                        ? "bg-slate-800 text-white border-slate-600 shadow-lg shadow-black/20"
                                        : "bg-transparent text-slate-400 border-transparent hover:bg-slate-800/50 hover:text-slate-200"
                                        }`}
                                >
                                    <tab.icon className={`w-4 h-4 ${rankingType === tab.id ? "text-yellow-400" : ""}`} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Genre Filter */}
                        <div className="shrink-0">
                            <select
                                value={selectedGenre}
                                onChange={(e) => setSelectedGenre(e.target.value)}
                                className="bg-[#151921] border border-slate-700 text-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-slate-600 outline-none w-full md:w-auto hover:border-slate-600 transition-colors cursor-pointer"
                            >
                                <option value="all">全ジャンル</option>
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

            {/* Ranking List */}
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
                {loading ? (
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="bg-[#151921] rounded-xl h-24 w-full animate-pulse border border-slate-800" />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {sortedPlaces.slice(0, 50).map((place, index) => (
                            <div
                                key={place.place_id}
                                onClick={() => router.push(`/place/${place.place_id}`)}
                                className="group cursor-pointer bg-[#151921] hover:bg-[#1c222c] rounded-xl p-3 md:p-4 border border-slate-800 hover:border-slate-700 transition-all flex items-center gap-4"
                            >
                                {/* Rank */}
                                <div
                                    className={`text-2xl md:text-3xl font-bold w-12 md:w-16 text-center shrink-0 font-mono ${index === 0
                                        ? "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.3)]"
                                        : index === 1
                                            ? "text-slate-300"
                                            : index === 2
                                                ? "text-amber-600"
                                                : "text-slate-600"
                                        }`}
                                >
                                    {index + 1}
                                </div>

                                {/* Thumbnail */}
                                <div className="w-24 h-14 md:w-40 md:h-24 bg-slate-800 rounded-lg overflow-hidden shrink-0 relative">
                                    {place.thumbnail_url ? (
                                        <img
                                            src={place.thumbnail_url}
                                            alt={place.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-600">
                                            <Gem className="w-8 h-8 opacity-20" />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0 py-1">
                                    <h3 className="text-base md:text-lg font-bold text-slate-100 truncate group-hover:text-yellow-400 transition-colors">
                                        {place.name}
                                    </h3>
                                    <div className="flex items-center gap-2 text-xs md:text-sm text-slate-500 mb-2">
                                        <span className="truncate">by {place.creator_name}</span>
                                        {place.genre && (
                                            <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-[10px] hidden sm:inline-block border border-slate-700">
                                                {getGenreName(place.genre)}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-4 text-xs md:text-sm text-slate-400">
                                        <div className="flex items-center gap-1 text-yellow-500 font-bold bg-yellow-500/10 px-1.5 py-0.5 rounded">
                                            <Star className="w-3 h-3 md:w-3.5 md:h-3.5 fill-yellow-500" />
                                            {place.average_rating ? place.average_rating.toFixed(1) : "-"}
                                        </div>
                                        {place.playing !== null && place.playing > 0 && (
                                            <div className="flex items-center gap-1 text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded font-medium hidden sm:flex">
                                                <Users className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                                {place.playing.toLocaleString()}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1">
                                            <Eye className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                            {(place.visit_count / 1000000).toFixed(1)}M+
                                        </div>
                                        <div className="flex items-center gap-1 hidden sm:flex">
                                            <Heart className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                            {(place.favorite_count / 1000).toFixed(1)}K+
                                        </div>
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
