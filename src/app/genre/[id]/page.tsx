"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
    genre: number | string | null;
    average_rating?: number;
    review_count?: number;
};

export default function GenreDetailPage() {
    const params = useParams();
    const genreId = decodeURIComponent(params.id as string);
    const [places, setPlaces] = useState<Place[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function fetchPlaces() {
            setLoading(true);

            // Fetch places by genre
            const { data: placeData } = await supabase
                .from("places")
                .select("*")
                .eq("genre", genreId)
                .gte("favorite_count", 50) // Only show games with 50+ favorites
                .order("visit_count", { ascending: false })
                .limit(100);

            if (!placeData) {
                setLoading(false);
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

            setPlaces(withRatings);
            setLoading(false);
        }

        fetchPlaces();
    }, [genreId]);

    const genreName = getGenreName(genreId);

    return (
        <main className="min-h-screen bg-slate-900 text-white pb-20">
            {/* Header */}
            <div className="bg-slate-800 border-b border-slate-700">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <Link href="/genre" className="text-sm text-slate-400 hover:text-white mb-4 inline-block">
                        &larr; ジャンル一覧に戻る
                    </Link>
                    <h1 className="text-4xl font-bold mb-2">{genreName}</h1>
                    <p className="text-slate-400">{places.length}件のゲーム</p>
                </div>
            </div>

            {/* Games Grid */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {loading ? (
                    <div className="text-center py-20 text-slate-500">読み込み中...</div>
                ) : places.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {places.map((place) => (
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
                ) : (
                    <div className="text-center py-20">
                        <p className="text-slate-400 text-lg">このジャンルのゲームはまだ登録されていません</p>
                        <Link
                            href="/"
                            className="inline-block mt-6 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-6 py-3 rounded-lg transition-colors"
                        >
                            ゲームを探す
                        </Link>
                    </div>
                )}
            </div>
        </main>
    );
}
