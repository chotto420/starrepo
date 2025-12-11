"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getGenreName } from "@/lib/roblox";
import Link from "next/link";
import { Trophy, Users, Star, Gem, Heart, ChevronLeft, Eye, MessageCircle, List, TrendingUp } from "lucide-react";

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
    mylist_count?: number;
    trend_score?: number;
    genre: string | null;
};

type RankingType = "overall" | "playing" | "favorites" | "trending" | "rating" | "reviews" | "mylist" | "hidden";

export default function RankingPage() {
    const [places, setPlaces] = useState<Place[]>([]);
    const [loading, setLoading] = useState(true);
    const [rankingType, setRankingType] = useState<RankingType>("overall");
    const [selectedGenre, setSelectedGenre] = useState<string>("all");
    const [genres, setGenres] = useState<Array<{ id: string; name: string }>>([]);
    const router = useRouter();

    useEffect(() => {
        async function fetchGenres() {
            const { data } = await supabase
                .from("places")
                .select("genre")
                .gte("favorite_count", 50)
                .not("genre", "is", null);

            if (data) {
                const uniqueGenres = [...new Set(data.map((p: { genre: string | null }) => p.genre).filter(Boolean))];
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

            let query = supabase
                .from("places")
                .select("*")
                .gte("favorite_count", 50);

            if (selectedGenre !== "all") {
                query = query.eq("genre", selectedGenre);
            }

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

            const placeIds = placeData.map((p: Place) => p.place_id);
            const { data: allReviews } = await supabase
                .from("reviews")
                .select("place_id, rating")
                .in("place_id", placeIds);

            const { data: mylistData } = await supabase
                .from("user_mylist")
                .select("place_id")
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

            const mylistMap = new Map<number, number>();
            if (mylistData) {
                for (const m of mylistData) {
                    mylistMap.set(m.place_id, (mylistMap.get(m.place_id) || 0) + 1);
                }
            }

            // Fetch yesterday's stats for trending calculation
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            const { data: historyData } = await supabase
                .from("place_stats_history")
                .select("place_id, visit_count")
                .eq("recorded_at", yesterdayStr)
                .in("place_id", placeIds);

            const historyMap = new Map<number, number>();
            if (historyData) {
                for (const h of historyData) {
                    historyMap.set(h.place_id, h.visit_count || 0);
                }
            }

            const withRatings = placeData.map((p: Place) => {
                const stats = reviewsMap.get(p.place_id);
                const count = stats?.count || 0;
                const avg = count > 0 ? stats!.sum / count : 0;

                // Calculate trend score (visit increase from yesterday)
                const yesterdayVisits = historyMap.get(p.place_id) || 0;
                const currentVisits = p.visit_count || 0;
                const trendScore = yesterdayVisits > 0
                    ? ((currentVisits - yesterdayVisits) / yesterdayVisits) * 100
                    : 0;

                return {
                    ...p,
                    average_rating: avg,
                    review_count: count,
                    mylist_count: mylistMap.get(p.place_id) || 0,
                    trend_score: trendScore,
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
                // Roblox公式データのみ使用（訪問数ベース）
                return (b.visit_count || 0) - (a.visit_count || 0);
            case "playing":
                return (b.playing || 0) - (a.playing || 0);
            case "favorites":
                return (b.favorite_count || 0) - (a.favorite_count || 0);
            case "trending":
                return (b.trend_score || 0) - (a.trend_score || 0);
            case "rating":
                if ((a.review_count || 0) < 3) return 1;
                if ((b.review_count || 0) < 3) return -1;
                return (b.average_rating || 0) - (a.average_rating || 0);
            case "reviews":
                return (b.review_count || 0) - (a.review_count || 0);
            case "mylist":
                return (b.mylist_count || 0) - (a.mylist_count || 0);
            case "hidden":
                const isHiddenA = (a.average_rating || 0) >= 4.5 && a.visit_count < 1000000;
                const isHiddenB = (b.average_rating || 0) >= 4.5 && b.visit_count < 1000000;
                if (isHiddenA && !isHiddenB) return -1;
                if (!isHiddenA && isHiddenB) return 1;
                return (b.average_rating || 0) - (a.average_rating || 0);
            default:
                return 0;
        }
    });

    const robloxTabs = [
        { id: "overall", label: "総合", icon: Trophy },
        { id: "playing", label: "今プレイ中", icon: Users },
        { id: "favorites", label: "お気に入り", icon: Heart },
        { id: "trending", label: "急上昇", icon: TrendingUp },
    ];

    const siteTabs = [
        { id: "rating", label: "高評価", icon: Star },
        { id: "reviews", label: "レビュー数", icon: MessageCircle },
        { id: "mylist", label: "マイリスト", icon: List },
        { id: "hidden", label: "隠れた名作", icon: Gem },
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

                    <div className="flex flex-col gap-4">
                        {/* Roblox Data Tabs */}
                        <div className="flex flex-col gap-2">
                            <span className="text-xs text-slate-500 font-medium">Robloxデータ</span>
                            <div className="flex gap-1 overflow-x-auto no-scrollbar -mx-6 px-6 md:mx-0 md:px-0">
                                {robloxTabs.map((tab) => (
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
                        </div>

                        {/* Site Data Tabs */}
                        <div className="flex flex-col gap-2">
                            <span className="text-xs text-slate-500 font-medium">サイトデータ</span>
                            <div className="flex gap-1 overflow-x-auto no-scrollbar -mx-6 px-6 md:mx-0 md:px-0">
                                {siteTabs.map((tab) => (
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
                        </div>

                        {/* Genre Filter */}
                        <div className="mt-2">
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
                    <div className="space-y-2 sm:space-y-3">
                        {sortedPlaces.slice(0, 50).map((place, index) => (
                            <div
                                key={place.place_id}
                                onClick={() => router.push(`/place/${place.place_id}`)}
                                className="group cursor-pointer bg-[#151921] hover:bg-[#1c222c] rounded-xl p-2 sm:p-3 md:p-4 border border-slate-800 hover:border-slate-700 transition-all flex items-center gap-2 sm:gap-4"
                            >
                                {/* Rank */}
                                <div
                                    className={`text-lg sm:text-2xl md:text-3xl font-bold w-7 sm:w-12 md:w-16 text-center shrink-0 font-mono ${index === 0
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
                                <div className="w-16 h-10 sm:w-24 sm:h-14 md:w-40 md:h-24 bg-slate-800 rounded-lg overflow-hidden shrink-0 relative">
                                    {place.thumbnail_url ? (
                                        <img
                                            src={place.thumbnail_url}
                                            alt={place.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-600">
                                            <Gem className="w-6 h-6 sm:w-8 sm:h-8 opacity-20" />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0 py-0.5 sm:py-1">
                                    <h3 className="text-sm sm:text-base md:text-lg font-bold text-slate-100 truncate group-hover:text-yellow-400 transition-colors">
                                        {place.name}
                                    </h3>
                                    <div className="flex items-center gap-2 text-[10px] sm:text-xs md:text-sm text-slate-500 mb-1 sm:mb-2">
                                        <span className="truncate">by {place.creator_name}</span>
                                        {place.genre && (
                                            <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-[10px] hidden sm:inline-block border border-slate-700">
                                                {getGenreName(place.genre)}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-xs md:text-sm text-slate-400">
                                        {/* 1st: Always show rating */}
                                        <div className="flex items-center gap-0.5 sm:gap-1 text-yellow-500 font-bold bg-yellow-500/10 px-1 sm:px-1.5 py-0.5 rounded">
                                            <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 fill-yellow-500" />
                                            {place.average_rating ? place.average_rating.toFixed(1) : "-"}
                                        </div>

                                        {/* 2nd: Ranking-specific metric */}
                                        {rankingType === "trending" && (
                                            <div className={`flex items-center gap-0.5 sm:gap-1 font-bold px-1.5 sm:px-2 py-0.5 rounded ${(place.trend_score || 0) > 0
                                                ? "text-green-400 bg-green-500/10"
                                                : (place.trend_score || 0) < 0
                                                    ? "text-red-400 bg-red-500/10"
                                                    : "text-slate-400 bg-slate-700/50"
                                                }`}>
                                                <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                                {(place.trend_score || 0) > 0 ? "+" : ""}{(place.trend_score || 0).toFixed(1)}%
                                            </div>
                                        )}
                                        {rankingType === "playing" && place.playing !== null && place.playing > 0 && (
                                            <div className="flex items-center gap-0.5 sm:gap-1 text-green-400 bg-green-500/10 px-1 sm:px-1.5 py-0.5 rounded font-medium">
                                                <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" />
                                                {place.playing.toLocaleString()}
                                            </div>
                                        )}
                                        {rankingType === "favorites" && (
                                            <div className="flex items-center gap-0.5 sm:gap-1 text-pink-400 bg-pink-500/10 px-1 sm:px-1.5 py-0.5 rounded font-medium">
                                                <Heart className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 fill-pink-400" />
                                                {(place.favorite_count / 1000).toFixed(1)}K+
                                            </div>
                                        )}
                                        {rankingType === "overall" && (
                                            <div className="flex items-center gap-0.5 sm:gap-1 text-slate-300 bg-slate-700/50 px-1 sm:px-1.5 py-0.5 rounded font-medium">
                                                <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" />
                                                {(place.visit_count / 1000000).toFixed(1)}M+
                                            </div>
                                        )}
                                        {rankingType === "reviews" && (
                                            <div className="flex items-center gap-0.5 sm:gap-1 text-blue-400 bg-blue-500/10 px-1 sm:px-1.5 py-0.5 rounded font-medium">
                                                <MessageCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" />
                                                {place.review_count || 0}
                                            </div>
                                        )}
                                        {rankingType === "mylist" && (
                                            <div className="flex items-center gap-0.5 sm:gap-1 text-purple-400 bg-purple-500/10 px-1 sm:px-1.5 py-0.5 rounded font-medium">
                                                <List className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" />
                                                {place.mylist_count || 0}
                                            </div>
                                        )}
                                        {rankingType === "hidden" && (
                                            <div className="flex items-center gap-0.5 sm:gap-1 text-slate-400 bg-slate-700/50 px-1 sm:px-1.5 py-0.5 rounded">
                                                <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                                {(place.visit_count / 1000000).toFixed(1)}M
                                            </div>
                                        )}

                                        {/* Secondary stats - hidden on mobile */}
                                        {rankingType !== "playing" && place.playing !== null && place.playing > 0 && (
                                            <div className="items-center gap-0.5 sm:gap-1 text-green-400 bg-green-500/10 px-1 sm:px-1.5 py-0.5 rounded font-medium hidden sm:flex">
                                                <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" />
                                                {place.playing.toLocaleString()}
                                            </div>
                                        )}
                                        {rankingType !== "overall" && rankingType !== "hidden" && (
                                            <div className="items-center gap-0.5 sm:gap-1 hidden sm:flex">
                                                <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" />
                                                {(place.visit_count / 1000000).toFixed(1)}M+
                                            </div>
                                        )}
                                        {rankingType !== "favorites" && (
                                            <div className="items-center gap-1 hidden sm:flex">
                                                <Heart className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                                {(place.favorite_count / 1000).toFixed(1)}K+
                                            </div>
                                        )}
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
