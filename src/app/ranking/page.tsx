"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getGenreName } from "@/lib/roblox";
import Link from "next/link";
import { Trophy, Users, Star, Gem, Heart, ChevronLeft, Eye, MessageCircle, List, TrendingUp, Sparkles, Medal } from "lucide-react";

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

            // Place ids for specific fetching
            let targetPlaceIds: number[] | null = null;
            let overrideMaps: {
                reviewCount?: Map<number, number>;
                avgRating?: Map<number, number>;
                mylistCount?: Map<number, number>;
            } = {};

            // For dynamic rankings (mylist, reviews, rating), we need to aggregate first
            // Note: This approach scales well for small-medium apps. 
            // For large scale, we should maintain counter columns in 'places' table via triggers.
            if (rankingType === "mylist") {
                const { data: allMylists } = await supabase
                    .from("user_mylist")
                    .select("place_id");

                if (allMylists) {
                    const counts = new Map<number, number>();
                    allMylists.forEach((item: { place_id: number }) => {
                        counts.set(item.place_id, (counts.get(item.place_id) || 0) + 1);
                    });

                    // Sort by count descending and take top 100
                    targetPlaceIds = Array.from(counts.entries())
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 100)
                        .map(entry => entry[0]);

                    overrideMaps.mylistCount = counts;
                }
            } else if (rankingType === "reviews" || rankingType === "rating") {
                const { data: allReviews } = await supabase
                    .from("reviews")
                    .select("place_id, rating");

                if (allReviews) {
                    const counts = new Map<number, number>(); // Review count
                    const ratings = new Map<number, { sum: number; count: number }>(); // For avg

                    allReviews.forEach((r: { place_id: number; rating: number }) => {
                        // Count
                        counts.set(r.place_id, (counts.get(r.place_id) || 0) + 1);
                        // Rating
                        const current = ratings.get(r.place_id) || { sum: 0, count: 0 };
                        ratings.set(r.place_id, { sum: current.sum + r.rating, count: current.count + 1 });
                    });

                    // Sort logic
                    if (rankingType === "reviews") {
                        targetPlaceIds = Array.from(counts.entries())
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 100)
                            .map(entry => entry[0]);
                    } else {
                        // rating: filter < 3 reviews
                        targetPlaceIds = Array.from(ratings.entries())
                            .filter(entry => entry[1].count >= 3)
                            .map(entry => [entry[0], entry[1].sum / entry[1].count] as [number, number])
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 100)
                            .map(entry => entry[0]);
                    }

                    overrideMaps.reviewCount = counts;
                    overrideMaps.avgRating = new Map(
                        Array.from(ratings.entries()).map(([k, v]) => [k, v.sum / v.count])
                    );
                }
            }

            // Build Main Query
            let query = supabase
                .from("places")
                .select("*");

            // Apply filters
            if (targetPlaceIds !== null) {
                // If we found specific IDs from secondary tables, fetch only those
                if (targetPlaceIds.length === 0) {
                    // No data found for this ranking
                    setPlaces([]);
                    setLoading(false);
                    return;
                }
                query = query.in("place_id", targetPlaceIds);
            } else {
                // Default fallback logic (overall, playing, trending, favorites)
                // Use default filters
                query = query.gte("favorite_count", 50);

                switch (rankingType) {
                    case "playing":
                        query = query.order("playing", { ascending: false });
                        break;
                    case "favorites":
                        query = query.order("favorite_count", { ascending: false });
                        break;
                    case "hidden":
                        query = query.lt("visit_count", 1000000).order("visit_count", { ascending: false });
                        break;
                    default:
                        // trending uses visits as base then sorts in JS
                        // overall uses visits
                        query = query.order("visit_count", { ascending: false });
                }
                query = query.limit(100);
            }

            if (selectedGenre !== "all") {
                query = query.eq("genre", selectedGenre);
            }

            const { data: placeData } = await query;

            if (!placeData) {
                setLoading(false);
                return;
            }

            const fetchIds = placeData.map((p: Place) => p.place_id);

            // --- Secondary Data Fetching (Stats) ---
            // Even if we already have some stats from step 1 (overrideMaps), we might need others
            // e.g. trending needs history, all need mylists/reviews for display

            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            const [reviewsResult, mylistResult, historyResult] = await Promise.all([
                supabase.from("reviews").select("place_id, rating").in("place_id", fetchIds),
                supabase.from("user_mylist").select("place_id").in("place_id", fetchIds),
                supabase.from("place_stats_history").select("place_id, visit_count").eq("recorded_at", yesterdayStr).in("place_id", fetchIds)
            ]);

            const allReviews = reviewsResult.data;
            const mylistData = mylistResult.data;
            const historyData = historyResult.data;

            // Compute Stats
            // (Use overrideMaps if available for primary sorting metric to ensure consistency, 
            // but refresh other metrics)

            const reviewsDisplayMap = new Map<number, { count: number; sum: number }>();
            if (allReviews) {
                for (const r of allReviews) {
                    const current = reviewsDisplayMap.get(r.place_id) || { count: 0, sum: 0 };
                    reviewsDisplayMap.set(r.place_id, {
                        count: current.count + 1,
                        sum: current.sum + r.rating,
                    });
                }
            }

            const mylistDisplayMap = new Map<number, number>();
            if (mylistData) {
                for (const m of mylistData) {
                    mylistDisplayMap.set(m.place_id, (mylistDisplayMap.get(m.place_id) || 0) + 1);
                }
            }

            const historyMap = new Map<number, number>();
            if (historyData) {
                for (const h of historyData) {
                    historyMap.set(h.place_id, h.visit_count || 0);
                }
            }

            // Merge Data
            const withRatings = placeData.map((p: Place) => {
                const reviewStats = reviewsDisplayMap.get(p.place_id);
                // Prefer fetching fresh stats, but logic flow ensures consistency

                const count = reviewStats?.count || 0;
                const avg = count > 0 ? (reviewStats!.sum / count) : 0;
                const mylistCount = mylistDisplayMap.get(p.place_id) || 0;

                // Calculate trend
                const yesterdayVisits = historyMap.get(p.place_id) || 0;
                const currentVisits = p.visit_count || 0;
                const trendScore = yesterdayVisits > 0
                    ? ((currentVisits - yesterdayVisits) / yesterdayVisits) * 100
                    : 0;

                return {
                    ...p,
                    average_rating: avg,
                    review_count: count,
                    mylist_count: mylistCount,
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
                return (b.visit_count || 0) - (a.visit_count || 0);
            case "playing":
                return (b.playing || 0) - (a.playing || 0);
            case "favorites":
                return (b.favorite_count || 0) - (a.favorite_count || 0);
            case "trending":
                return (b.trend_score || 0) - (a.trend_score || 0);
            case "rating":
                // Primary sorting manually done in fetch phase for rating
                if ((a.review_count || 0) < 3) return 1;
                if ((b.review_count || 0) < 3) return -1;
                return (b.average_rating || 0) - (a.average_rating || 0);
            case "reviews":
                // Primary sorting manually done in fetch phase for reviews
                return (b.review_count || 0) - (a.review_count || 0);
            case "mylist":
                // Primary sorting manually done in fetch phase for mylist
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

    // --- Format Utilities ---
    const formatCompactNumber = (num: number) => {
        return Intl.NumberFormat('en-US', {
            notation: "compact",
            maximumFractionDigits: 1
        }).format(num);
    };

    // --- UI Configurations ---
    const robloxTabs = [
        { id: "overall", label: "総訪問数", icon: Trophy },
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

    // Define display configuration for each ranking type
    const getStatsDisplayConfig = (type: RankingType) => {
        const configs: Record<string, string[]> = {
            trending: ["trend_score:accent", "playing"],
            playing: ["playing:accent", "favorites"],
            overall: ["visits:accent", "playing"],
            favorites: ["favorites:accent", "playing"],
            rating: ["rating:accent", "visits"],
            reviews: ["reviews:accent", "visits"],
            mylist: ["mylist:accent", "favorites"],
            hidden: ["hidden_score:accent", "favorites"],
            default: ["playing:accent", "visits"]
        };
        return configs[type] || configs["default"];
    };

    return (
        <main className="min-h-screen bg-[#0B0E14] text-white pb-20">
            {/* Header */}
            <div className="bg-[#0B0E14]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
                    <div className="flex items-center gap-4 mb-6">
                        <Link href="/" className="text-slate-400 hover:text-white transition-colors p-2 -ml-2 rounded-full hover:bg-white/5">
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                                <Trophy className="w-5 h-5 md:w-6 md:h-6 text-yellow-500" />
                                ランキング
                            </h1>
                        </div>
                    </div>

                    <div className="flex flex-col gap-6">
                        {/* Tabs Container */}
                        <div className="space-y-4">
                            {/* Roblox Data Tabs */}
                            <div className="space-y-2">
                                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold px-1">Roblox Stats</span>
                                <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                                    {robloxTabs.map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setRankingType(tab.id as RankingType)}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs md:text-sm font-medium whitespace-nowrap transition-all border ${rankingType === tab.id
                                                ? "bg-slate-800 text-white border-slate-600 shadow-[0_0_15px_-5px_rgba(0,0,0,0.5)]"
                                                : "bg-transparent text-slate-400 border-transparent hover:bg-slate-800/50 hover:text-slate-200"
                                                }`}
                                        >
                                            <tab.icon className={`w-3.5 h-3.5 ${rankingType === tab.id ? "text-yellow-400" : ""}`} />
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Site Data Tabs */}
                            <div className="space-y-2">
                                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold px-1">Community Stats</span>
                                <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                                    {siteTabs.map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setRankingType(tab.id as RankingType)}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs md:text-sm font-medium whitespace-nowrap transition-all border ${rankingType === tab.id
                                                ? "bg-slate-800 text-white border-slate-600 shadow-[0_0_15px_-5px_rgba(0,0,0,0.5)]"
                                                : "bg-transparent text-slate-400 border-transparent hover:bg-slate-800/50 hover:text-slate-200"
                                                }`}
                                        >
                                            <tab.icon className={`w-3.5 h-3.5 ${rankingType === tab.id ? "text-yellow-400" : ""}`} />
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Genre Filter */}
                        <div>
                            <div className="relative inline-block w-full md:w-auto">
                                <select
                                    value={selectedGenre}
                                    onChange={(e) => setSelectedGenre(e.target.value)}
                                    className="appearance-none bg-[#1A1F29] border border-white/10 text-slate-200 rounded-lg pl-4 pr-10 py-2 text-sm focus:ring-2 focus:ring-slate-600 outline-none w-full hover:border-slate-500 transition-colors cursor-pointer"
                                >
                                    <option value="all">全ジャンル</option>
                                    {genres.map((genre) => (
                                        <option key={genre.id} value={genre.id}>
                                            {genre.name}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
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
                        {sortedPlaces.slice(0, 50).map((place, index) => {
                            const statsConfig = getStatsDisplayConfig(rankingType);
                            const isTop3 = index < 3;

                            return (
                                <div
                                    key={place.place_id}
                                    onClick={() => router.push(`/place/${place.place_id}`)}
                                    className={`group cursor-pointer relative bg-[#151921]/50 hover:bg-[#1A1F29] rounded-xl p-3 md:p-4 border transition-all duration-300 flex items-center gap-3 sm:gap-5 ${isTop3
                                        ? "border-yellow-500/20 shadow-[0_0_20px_-10px_rgba(234,179,8,0.1)] hover:shadow-[0_0_25px_-10px_rgba(234,179,8,0.2)]"
                                        : "border-white/5 hover:border-slate-600"
                                        }`}
                                >
                                    {/* Rank Badge */}
                                    <div className={`
                                        flex flex-col items-center justify-center w-8 sm:w-12 shrink-0
                                        ${index === 0 ? "text-yellow-400" : index === 1 ? "text-slate-300" : index === 2 ? "text-amber-600" : "text-slate-600"}
                                    `}>
                                        {index < 3 && <Medal className="w-4 h-4 sm:w-6 sm:h-6 mb-0.5 opacity-80" />}
                                        <span className={`font-mono font-bold leading-none ${index < 3 ? "text-xl sm:text-2xl" : "text-lg sm:text-xl"}`}>
                                            {index + 1}
                                        </span>
                                    </div>

                                    {/* Thumbnail */}
                                    <div className="w-20 h-12 sm:w-32 sm:h-20 bg-slate-800 rounded-lg overflow-hidden shrink-0 relative shadow-lg">
                                        {place.thumbnail_url ? (
                                            <img
                                                src={place.thumbnail_url}
                                                alt={place.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-600">
                                                <Gem className="w-6 h-6 sm:w-8 sm:h-8 opacity-20" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info & Stats */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
                                        <div>
                                            <h3 className="text-sm sm:text-lg font-bold text-slate-100 truncate group-hover:text-yellow-400 transition-colors">
                                                {place.name}
                                            </h3>
                                            <div className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-500">
                                                <span className="truncate hover:text-slate-300 transition-colors">{place.creator_name}</span>
                                                {place.genre && (
                                                    <span className="bg-white/5 text-slate-400 px-1.5 py-0.5 rounded text-[10px] border border-white/5">
                                                        {getGenreName(place.genre)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Dynamic Stats Row */}
                                        <div className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm">
                                            {/* Always show Rating if available */}
                                            {place.average_rating !== undefined && place.average_rating > 0 && (
                                                <div className="flex items-center gap-1 text-yellow-500 font-bold" title="Average Rating">
                                                    <Star className="w-3.5 h-3.5 fill-yellow-500" />
                                                    {place.average_rating.toFixed(1)}
                                                </div>
                                            )}

                                            {/* Configurable Stats */}
                                            {statsConfig.map((configStr, i) => {
                                                const [key, modifier] = configStr.split(":");
                                                const isAccent = modifier === "accent";

                                                if (key === "trend_score" && rankingType === "trending") {
                                                    const score = place.trend_score || 0;
                                                    const isPositive = score > 0;
                                                    return (
                                                        <div key={key} className={`flex items-center gap-1 font-bold ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
                                                            <TrendingUp className="w-3.5 h-3.5" />
                                                            <span>{isPositive && "+"}{score.toFixed(1)}%</span>
                                                        </div>
                                                    );
                                                }

                                                if (key === "playing" && place.playing !== null) {
                                                    return (
                                                        <div key={key} className={`flex items-center gap-1 ${isAccent ? "text-green-400 font-bold" : "text-slate-500"}`}>
                                                            <Users className={`w-3.5 h-3.5 ${isAccent ? "text-green-400" : "text-slate-600"}`} />
                                                            <span>{place.playing.toLocaleString()}</span>
                                                        </div>
                                                    );
                                                }

                                                if (key === "visits") {
                                                    return (
                                                        <div key={key} className={`flex items-center gap-1 hidden sm:flex ${isAccent ? "text-blue-200 font-bold" : "text-slate-500"}`}>
                                                            <Eye className={`w-3.5 h-3.5 ${isAccent ? "text-blue-400" : "text-slate-600"}`} />
                                                            <span>{formatCompactNumber(place.visit_count)}</span>
                                                        </div>
                                                    );
                                                }

                                                if (key === "favorites") {
                                                    return (
                                                        <div key={key} className={`flex items-center gap-1 hidden sm:flex ${isAccent ? "text-pink-400 font-bold" : "text-slate-500"}`}>
                                                            <Heart className={`w-3.5 h-3.5 ${isAccent ? "fill-pink-400 text-pink-400" : "text-slate-600"}`} />
                                                            <span>{formatCompactNumber(place.favorite_count)}</span>
                                                        </div>
                                                    );
                                                }

                                                if (key === "reviews" && place.review_count !== undefined) {
                                                    return (
                                                        <div key={key} className={`flex items-center gap-1 ${isAccent ? "text-blue-400 font-bold" : "text-slate-500"}`}>
                                                            <MessageCircle className="w-3.5 h-3.5" />
                                                            <span>{place.review_count}</span>
                                                        </div>
                                                    );
                                                }

                                                if (key === "mylist" && place.mylist_count !== undefined) {
                                                    return (
                                                        <div key={key} className={`flex items-center gap-1 ${isAccent ? "text-purple-400 font-bold" : "text-slate-500"}`}>
                                                            <List className="w-3.5 h-3.5" />
                                                            <span>{place.mylist_count}</span>
                                                        </div>
                                                    );
                                                }

                                                return null;
                                            })}
                                        </div>
                                    </div>

                                    {/* Right Side Decoration (Desktop only) */}
                                    <div className="hidden md:block ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ChevronLeft className="w-5 h-5 text-slate-600 rotate-180" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}
