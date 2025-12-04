"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getAllGenres, getGenreName } from "@/lib/roblox";
import Link from "next/link";

const supabase = createClient();

export default function GenrePage() {
    const [genreCounts, setGenreCounts] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function fetchGenreCounts() {
            const { data } = await supabase.from("places").select("genre");

            if (data) {
                const counts: Record<string, number> = {};
                for (const place of data) {
                    const genre = place.genre;
                    if (genre) {
                        counts[genre] = (counts[genre] || 0) + 1;
                    }
                }
                setGenreCounts(counts);
            }
            setLoading(false);
        }

        fetchGenreCounts();
    }, []);

    // Show all genres with "その他" (All) at the end
    const genres = getAllGenres().sort((a, b) => {
        if (a.id === "All") return 1;
        if (b.id === "All") return -1;
        return 0;
    });

    return (
        <main className="min-h-screen bg-slate-900 text-white pb-20">
            {/* Header */}
            <div className="bg-slate-800 border-b border-slate-700">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <Link href="/" className="text-sm text-slate-400 hover:text-white mb-4 inline-block">
                        &larr; ホームに戻る
                    </Link>
                    <h1 className="text-4xl font-bold mb-2">ジャンル</h1>
                    <p className="text-slate-400">ジャンル別にゲームを探す</p>
                </div>
            </div>

            {/* Genre Grid */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {loading ? (
                    <div className="text-center py-20 text-slate-500">読み込み中...</div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {genres.map((genre) => {
                            const count = genreCounts[genre.id] || 0;
                            const icon = getGenreIcon(genre.id);

                            return (
                                <div
                                    key={genre.id}
                                    onClick={() => router.push(`/genre/${encodeURIComponent(genre.id)}`)}
                                    className="group cursor-pointer bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-yellow-500/50 hover:shadow-lg hover:shadow-yellow-500/10 transition-all transform hover:-translate-y-1"
                                >
                                    <div className="text-4xl mb-3">{icon}</div>
                                    <h3 className="text-xl font-bold text-white group-hover:text-yellow-400 transition-colors mb-2">
                                        {genre.name}
                                    </h3>
                                    <p className="text-slate-400 text-sm">
                                        {count > 0 ? `${count}件のゲーム` : "ゲームなし"}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}

function getGenreIcon(genre: string): string {
    const icons: Record<string, string> = {
        "All": "🎮",
        "Town and City": "🏙️",
        "Medieval": "⚔️",
        "Scifi": "🚀",
        "Fighting": "🥊",
        "Horror": "👻",
        "Naval": "⚓",
        "Comedy": "😂",
        "Western": "🤠",
        "Military": "🎖️",
        "Building": "🏗️",
        "FPS": "🔫",
        "RPG": "🗡️",
        "Adventure": "🗺️",
        "Sports": "⚽",
        "Tutorial": "📚",
    };
    return icons[genre] || "🎮";
}
