"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getGenreName } from "@/lib/roblox";
import Link from "next/link";
import { Trophy, Users, Star, Gem, Heart, ChevronLeft, Eye, MessageCircle, List, TrendingUp, Sparkles, Medal, RefreshCw, ThumbsUp, ChevronDown, ChevronUp } from "lucide-react";
import { RankingListSkeleton } from "@/components/Skeleton";

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
    first_released_at?: string;
    last_updated_at?: string;
};

type RankingType = "overall" | "playing" | "favorites" | "trending" | "rating" | "reviews" | "mylist" | "hidden" | "newest" | "updated" | "likeRatio" | "favoriteRatio";

export default function RankingPage() {
    const [places, setPlaces] = useState<Place[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [rankingType, setRankingType] = useState<RankingType>("overall");
    const [selectedGenre, setSelectedGenre] = useState<string>("all");
    const [minRating, setMinRating] = useState<string>("all");
    const [minReviews, setMinReviews] = useState<string>("all");
    const [genres, setGenres] = useState<Array<{ id: string; name: string }>>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isTabsExpanded, setIsTabsExpanded] = useState(false); // Mobile tabs collapse state
    const observer = useRef<IntersectionObserver | null>(null);
    const router = useRouter();

    // 自動読み込みなし（初回のみ、以降はボタン）
    const AUTO_LOAD_MAX_PAGE = 1;

    // Infinite Scroll Observer（上限まで自動読み込み）
    const lastPlaceRef = useCallback(
        (node: HTMLDivElement | null) => {
            if (loading || loadingMore) return;
            // 上限に達したら自動読み込みを停止
            if (page >= AUTO_LOAD_MAX_PAGE) return;
            if (observer.current) observer.current.disconnect();
            observer.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && hasMore && page < AUTO_LOAD_MAX_PAGE) {
                    setPage((prev) => prev + 1);
                }
            });
            if (node) observer.current.observe(node);
        },
        [loading, loadingMore, hasMore, page]
    );

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
                // Default fallback logic (overall, playing, trending, favorites, newest, updated, likeRatio, favoriteRatio)
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
                    case "newest":
                        query = query.order("first_released_at", { ascending: false });
                        break;
                    case "updated":
                        query = query.order("last_updated_at", { ascending: false });
                        break;
                    case "likeRatio":
                        // Filter: At least 10 total votes for reliability
                        query = query.not("like_count", "is", null)
                            .not("dislike_count", "is", null)
                            .gte("like_count", 5) // At least some votes
                            .order("like_ratio", { ascending: false });
                        break;
                    case "favoriteRatio":
                        // Filter: At least 1000 visits for reliability
                        query = query.gte("visit_count", 1000)
                            .order("visit_count", { ascending: false }); // Fetch all, will sort by ratio in JS
                        break;
                    default:
                        // trending uses visits as base then sorts in JS
                        // overall uses visits
                        query = query.order("visit_count", { ascending: false });
                }
                query = query.limit(50);
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
            setHasMore(withRatings.length >= 50); // 50件取得時は続きがある可能性
        }

        fetchRanking();
    }, [rankingType, selectedGenre]);

    // フィルタ変更時にページをリセット
    useEffect(() => {
        setPage(1);
        setHasMore(true);
    }, [rankingType, selectedGenre]);

    // 追加データを読み込む（ページ2以降）
    useEffect(() => {
        if (page === 1) return;

        async function loadMore() {
            setLoadingMore(true);
            try {
                const res = await fetch(
                    `/api/ranking?type=${rankingType}&genre=${selectedGenre}&page=${page}&limit=50`
                );
                const json = await res.json();
                if (json.data && json.data.length > 0) {
                    // 重複を排除
                    setPlaces((prev) => {
                        const existingIds = new Set(prev.map(p => p.place_id));
                        const newItems = json.data.filter((p: Place) => !existingIds.has(p.place_id));
                        return [...prev, ...newItems];
                    });
                    setHasMore(json.hasMore);
                } else {
                    setHasMore(false);
                }
            } catch (error) {
                console.error("Failed to load more:", error);
            }
            setLoadingMore(false);
        }

        loadMore();
    }, [page, rankingType, selectedGenre]);

    // Apply client-side filters for rating and reviews
    const filteredPlaces = [...places].filter(place => {
        if (minRating !== "all") {
            const rating = place.average_rating || 0;
            if (rating < parseFloat(minRating)) return false;
        }
        if (minReviews !== "all") {
            const reviews = place.review_count || 0;
            if (reviews < parseInt(minReviews)) return false;
        }
        return true;
    });

    const sortedPlaces = filteredPlaces.sort((a, b) => {
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
            case "newest":
                // Sort by first_released_at (newest first)
                return 0; // Already sorted by DB query
            case "updated":
                // Sort by last_updated_at (most recently updated first)
                return 0; // Already sorted by DB query
            case "likeRatio":
                // Sort by like_ratio (highest first)
                return 0; // Already sorted by DB query
            case "favoriteRatio":
                // Calculate favorite ratio dynamically
                const ratioA = a.visit_count > 0 ? (a.favorite_count || 0) / a.visit_count : 0;
                const ratioB = b.visit_count > 0 ? (b.favorite_count || 0) / b.visit_count : 0;
                return ratioB - ratioA;
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
    // User Journey Order: Discovery (row 1) → Evaluation (row 2)
    const robloxTabs = [
        // Row 1: Discovery rankings
        { id: "overall", label: "総訪問数", icon: Trophy },
        { id: "trending", label: "急上昇", icon: TrendingUp },
        { id: "newest", label: "新作ゲーム", icon: Sparkles },
        { id: "updated", label: "最近更新", icon: RefreshCw },
        // Row 2: Evaluation rankings
        { id: "playing", label: "今プレイ中", icon: Users },
        { id: "likeRatio", label: "高評価率", icon: ThumbsUp },
        { id: "favorites", label: "お気に入り", icon: Heart },
        { id: "favoriteRatio", label: "お気に入り率", icon: Heart },
    ];

    const siteTabs = [
        { id: "rating", label: "高評価", icon: Star },
        { id: "reviews", label: "レビュー数", icon: MessageCircle },
        { id: "mylist", label: "マイリスト", icon: List },
        { id: "hidden", label: "隠れた名作", icon: Gem },
    ];

    // Get current selected ranking info
    const getCurrentRanking = () => {
        const allTabs = [...robloxTabs, ...siteTabs];
        return allTabs.find(tab => tab.id === rankingType) || robloxTabs[0];
    };

    const currentRanking = getCurrentRanking();

    // Define display configuration for each ranking type
    const getStatsDisplayConfig = (type: RankingType) => {
        const configs: Record<string, string[]> = {
            trending: ["trend_score:accent", "visits"],
            playing: ["playing:accent", "favorites"],
            overall: ["visits:accent", "playing"],
            favorites: ["favorites:accent", "visits"],
            rating: ["rating:accent", "visits"],
            reviews: ["reviews:accent", "visits"],
            mylist: ["mylist:accent", "favorites"],
            hidden: ["hidden_score:accent", "favorites"],
            newest: ["release_date:accent", "visits"],
            updated: ["update_date:accent", "visits"],
            likeRatio: ["like_ratio:accent", "visits"],
            favoriteRatio: ["favorite_ratio:accent", "visits"],
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
                        {/* Mobile: Collapsible Tabs Toggle Button */}
                        <button
                            onClick={() => setIsTabsExpanded(!isTabsExpanded)}
                            className="md:hidden flex items-center justify-between px-4 py-3 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700 hover:border-slate-600 transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <currentRanking.icon className="w-5 h-5 text-yellow-400 shrink-0" />
                                <div className="text-left">
                                    <div className="text-sm font-medium text-white">{currentRanking.label}</div>
                                    <div className="text-xs text-slate-400">タップして変更</div>
                                </div>
                            </div>
                            {isTabsExpanded ? (
                                <ChevronUp className="w-5 h-5 text-slate-400" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-slate-400" />
                            )}
                        </button>

                        {/* Tabs Container - Collapsible on Mobile, Always visible on Desktop */}
                        <div className={`space-y-6 ${isTabsExpanded ? 'block' : 'hidden md:block'}`}>
                            {/* Roblox Data Tabs */}
                            <div className="space-y-3">
                                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold px-1 block">Roblox Stats</span>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {robloxTabs.map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => {
                                                setRankingType(tab.id as RankingType);
                                                setIsTabsExpanded(false); // Auto-collapse on mobile after selection
                                            }}
                                            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs md:text-sm font-medium transition-all border ${rankingType === tab.id
                                                ? "bg-gradient-to-br from-slate-700 to-slate-800 text-white border-slate-500 shadow-lg shadow-slate-900/50 ring-2 ring-yellow-500/20"
                                                : "bg-slate-900/30 text-slate-400 border-slate-800 hover:bg-slate-800/50 hover:text-slate-200 hover:border-slate-600"
                                                }`}
                                        >
                                            <tab.icon className={`w-4 h-4 shrink-0 ${rankingType === tab.id ? "text-yellow-400" : "text-slate-500"}`} />
                                            <span className="truncate">{tab.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Site Data Tabs */}
                            <div className="space-y-3">
                                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold px-1 block">Community Stats</span>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {siteTabs.map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => {
                                                setRankingType(tab.id as RankingType);
                                                setIsTabsExpanded(false); // Auto-collapse on mobile after selection
                                            }}
                                            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs md:text-sm font-medium transition-all border ${rankingType === tab.id
                                                ? "bg-gradient-to-br from-slate-700 to-slate-800 text-white border-slate-500 shadow-lg shadow-slate-900/50 ring-2 ring-yellow-500/20"
                                                : "bg-slate-900/30 text-slate-400 border-slate-800 hover:bg-slate-800/50 hover:text-slate-200 hover:border-slate-600"
                                                }`}
                                        >
                                            <tab.icon className={`w-4 h-4 shrink-0 ${rankingType === tab.id ? "text-yellow-400" : "text-slate-500"}`} />
                                            <span className="truncate">{tab.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Filters Row */}
                        <div className="flex flex-wrap gap-3">
                            {/* Genre Filter */}
                            <div className="relative">
                                <select
                                    value={selectedGenre}
                                    onChange={(e) => setSelectedGenre(e.target.value)}
                                    className="appearance-none bg-[#1A1F29] border border-white/10 text-slate-200 rounded-lg pl-4 pr-10 py-2 text-sm focus:ring-2 focus:ring-slate-600 outline-none hover:border-slate-500 transition-colors cursor-pointer"
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

                            {/* Rating Filter */}
                            <div className="relative">
                                <select
                                    value={minRating}
                                    onChange={(e) => setMinRating(e.target.value)}
                                    className="appearance-none bg-[#1A1F29] border border-white/10 text-slate-200 rounded-lg pl-4 pr-10 py-2 text-sm focus:ring-2 focus:ring-slate-600 outline-none hover:border-slate-500 transition-colors cursor-pointer"
                                >
                                    <option value="all">評価: すべて</option>
                                    <option value="4.5">⭐ 4.5以上</option>
                                    <option value="4.0">⭐ 4.0以上</option>
                                    <option value="3.5">⭐ 3.5以上</option>
                                    <option value="3.0">⭐ 3.0以上</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>

                            {/* Reviews Filter */}
                            <div className="relative">
                                <select
                                    value={minReviews}
                                    onChange={(e) => setMinReviews(e.target.value)}
                                    className="appearance-none bg-[#1A1F29] border border-white/10 text-slate-200 rounded-lg pl-4 pr-10 py-2 text-sm focus:ring-2 focus:ring-slate-600 outline-none hover:border-slate-500 transition-colors cursor-pointer"
                                >
                                    <option value="all">レビュー: すべて</option>
                                    <option value="10">10件以上</option>
                                    <option value="5">5件以上</option>
                                    <option value="3">3件以上</option>
                                    <option value="1">1件以上</option>
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
                    <RankingListSkeleton count={10} />
                ) : (
                    <div className="space-y-3">
                        {sortedPlaces.map((place, index) => {
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
                                                        <div key={key} className={`flex items-center gap-1 ${isAccent ? "" : "hidden sm:flex"} ${isAccent ? "text-blue-400 font-bold" : "text-slate-500"}`}>
                                                            <Eye className={`w-3.5 h-3.5 ${isAccent ? "text-blue-400" : "text-slate-600"}`} />
                                                            <span>{formatCompactNumber(place.visit_count)}</span>
                                                        </div>
                                                    );
                                                }

                                                if (key === "favorites") {
                                                    return (
                                                        <div key={key} className={`flex items-center gap-1 ${isAccent ? "" : "hidden sm:flex"} ${isAccent ? "text-pink-400 font-bold" : "text-slate-500"}`}>
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

                                                if (key === "like_ratio" && rankingType === "likeRatio") {
                                                    // Display like_ratio as percentage
                                                    const ratio = (place as any).like_ratio || 0;
                                                    return (
                                                        <div key={key} className={`flex items-center gap-1 ${isAccent ? "text-emerald-400 font-bold" : "text-slate-500"}`}>
                                                            <ThumbsUp className="w-3.5 h-3.5" />
                                                            <span>{(ratio * 100).toFixed(1)}%</span>
                                                        </div>
                                                    );
                                                }

                                                if (key === "favorite_ratio" && rankingType === "favoriteRatio") {
                                                    // Calculate and display favorite ratio as percentage
                                                    const ratio = place.visit_count > 0 ? (place.favorite_count / place.visit_count) : 0;
                                                    return (
                                                        <div key={key} className={`flex items-center gap-1 ${isAccent ? "text-pink-400 font-bold" : "text-slate-500"}`}>
                                                            <Heart className="w-3.5 h-3.5 fill-pink-400" />
                                                            <span>{(ratio * 100).toFixed(2)}%</span>
                                                        </div>
                                                    );
                                                }

                                                if (key === "release_date" && rankingType === "newest" && place.first_released_at) {
                                                    // Display release date
                                                    const date = new Date(place.first_released_at);
                                                    const formatted = `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
                                                    return (
                                                        <div key={key} className={`flex items-center gap-1 ${isAccent ? "text-blue-400 font-bold" : "text-slate-500"}`}>
                                                            <Sparkles className="w-3.5 h-3.5" />
                                                            <span>{formatted}</span>
                                                        </div>
                                                    );
                                                }

                                                if (key === "update_date" && rankingType === "updated" && place.last_updated_at) {
                                                    // Display update date
                                                    const date = new Date(place.last_updated_at);
                                                    const formatted = `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
                                                    return (
                                                        <div key={key} className={`flex items-center gap-1 ${isAccent ? "text-cyan-400 font-bold" : "text-slate-500"}`}>
                                                            <RefreshCw className="w-3.5 h-3.5" />
                                                            <span>{formatted}</span>
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

                {/* Infinite Scroll Trigger（100件まで自動） */}
                {!loading && hasMore && page < AUTO_LOAD_MAX_PAGE && (
                    <div ref={lastPlaceRef} className="flex justify-center py-8">
                        {loadingMore && (
                            <div className="flex items-center gap-2 text-slate-400">
                                <div className="w-5 h-5 border-2 border-slate-600 border-t-yellow-500 rounded-full animate-spin" />
                                <span>読み込み中...</span>
                            </div>
                        )}
                    </div>
                )}

                {/* 100件以降は手動ボタン */}
                {!loading && hasMore && page >= AUTO_LOAD_MAX_PAGE && (
                    <div className="flex flex-col items-center py-8 gap-4">
                        {loadingMore ? (
                            <div className="flex items-center gap-2 text-slate-400">
                                <div className="w-5 h-5 border-2 border-slate-600 border-t-yellow-500 rounded-full animate-spin" />
                                <span>読み込み中...</span>
                            </div>
                        ) : (
                            <>
                                <p className="text-slate-500 text-sm">
                                    {sortedPlaces.length}件を表示中
                                </p>
                                <button
                                    onClick={() => setPage((prev) => prev + 1)}
                                    className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold rounded-lg hover:from-yellow-400 hover:to-amber-400 transition-all shadow-lg hover:shadow-yellow-500/25"
                                >
                                    さらに50件を読み込む
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* End of List */}
                {!loading && !hasMore && sortedPlaces.length > 0 && (
                    <div className="text-center py-8 text-slate-500 text-sm">
                        すべてのゲームを表示しました（{sortedPlaces.length}件）
                    </div>
                )}
            </div>
        </main>
    );
}
