import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, Clock, Star, Eye, Heart, Sparkles } from "lucide-react";
import { getGenreName } from "@/lib/roblox";

export const metadata: Metadata = {
    title: "サイト新着",
    description: "StarRepoに最近登録されたRobloxゲームをチェック！新しいゲームを発見しよう。",
};

export const dynamic = "force-dynamic";

type Place = {
    place_id: number;
    name: string;
    creator_name: string;
    thumbnail_url: string | null;
    visit_count: number;
    favorite_count: number;
    genre: string | null;
    created_at: string;
    average_rating?: number;
    review_count?: number;
};

async function getNewPlaces(): Promise<Place[]> {
    const supabase = await createClient();

    // 最新の登録ゲームを50件取得
    const { data: places, error } = await supabase
        .from("places")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

    if (error || !places) {
        console.error("Error fetching new places:", error);
        return [];
    }

    // レビュー統計を取得
    const placeIds = places.map((p) => p.place_id);
    const { data: reviews } = await supabase
        .from("reviews")
        .select("place_id, rating")
        .in("place_id", placeIds);

    const ratingsByPlace: Record<number, number[]> = {};
    reviews?.forEach((r) => {
        if (!ratingsByPlace[r.place_id]) {
            ratingsByPlace[r.place_id] = [];
        }
        ratingsByPlace[r.place_id].push(r.rating);
    });

    return places.map((p) => ({
        ...p,
        average_rating: ratingsByPlace[p.place_id]
            ? ratingsByPlace[p.place_id].reduce((a, b) => a + b, 0) / ratingsByPlace[p.place_id].length
            : 0,
        review_count: ratingsByPlace[p.place_id]?.length || 0
    }));
}

function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) {
        return "たった今";
    } else if (diffHours < 24) {
        return `${diffHours}時間前`;
    } else if (diffDays === 1) {
        return "昨日";
    } else if (diffDays < 7) {
        return `${diffDays}日前`;
    } else {
        return date.toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
    }
}

function formatNumber(num: number) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
}

export default async function NewGamesPage() {
    const places = await getNewPlaces();

    return (
        <main className="min-h-screen bg-[#0B0E14] text-white pb-20">
            {/* Header */}
            <div className="bg-[#0B0E14]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-slate-400 hover:text-white transition-colors p-2 -ml-2 rounded-full hover:bg-white/5">
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                                <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-yellow-400" />
                                サイト新着
                            </h1>
                            <p className="text-xs md:text-sm text-slate-400 mt-1">
                                最近StarRepoに登録されたゲーム
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Game List */}
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
                {places.length === 0 ? (
                    <div className="text-center py-16 text-slate-500">
                        まだゲームが登録されていません
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                        {places.map((place) => (
                            <Link
                                key={place.place_id}
                                href={`/place/${place.place_id}`}
                                className="group relative bg-[#151921] rounded-xl overflow-hidden border border-slate-800/50 hover:border-slate-600 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20"
                            >
                                {/* Thumbnail */}
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
                                        <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                            <Sparkles className="w-8 h-8 text-slate-600" />
                                        </div>
                                    )}

                                    {/* NEW Badge */}
                                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-gradient-to-r from-yellow-500 to-amber-500 text-black text-[10px] font-bold rounded-full shadow-lg flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" />
                                        NEW
                                    </div>

                                    {/* Genre Badge */}
                                    {place.genre && (
                                        <div className="absolute top-2 right-2 px-2 py-0.5 bg-slate-900/80 text-slate-300 text-[10px] font-medium rounded-full">
                                            {getGenreName(place.genre)}
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-3 sm:p-4">
                                    <h3 className="text-sm sm:text-base font-bold text-white truncate group-hover:text-yellow-400 transition-colors">
                                        {place.name}
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                                        {place.creator_name}
                                    </p>

                                    {/* Stats */}
                                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/50">
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="flex items-center gap-1 text-yellow-400 font-bold">
                                                <Star className="w-3.5 h-3.5 fill-yellow-400" />
                                                {(place.average_rating || 0).toFixed(1)}
                                            </span>
                                            <span className="flex items-center gap-1 text-slate-500">
                                                <Eye className="w-3.5 h-3.5" />
                                                {formatNumber(place.visit_count)}
                                            </span>
                                        </div>

                                        {/* Time since added */}
                                        <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                            <Clock className="w-3 h-3" />
                                            {formatDate(place.created_at)}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
