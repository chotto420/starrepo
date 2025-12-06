"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getAllGenres, getGenreName } from "@/lib/roblox";
import Link from "next/link";
import {
    Gamepad2, Building2, Crown, Rocket, Swords, Ghost, Anchor,
    Smile, Mountain, Tent, Keyboard, MonitorPlay, Hammer,
    Target, Trophy, BookOpen, ChevronLeft
} from "lucide-react";

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
        <main className="min-h-screen bg-[#0B0E14] text-white pb-20">
            {/* Header */}
            <div className="bg-[#0B0E14]/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <Link href="/" className="inline-flex items-center text-slate-400 hover:text-white mb-4 transition-colors">
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        ホームに戻る
                    </Link>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Gamepad2 className="w-8 h-8 text-purple-500" />
                        ジャンルから探す
                    </h1>
                </div>
            </div>

            {/* Genre Grid */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="bg-[#151921] h-32 rounded-xl animate-pulse border border-slate-800" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {genres.map((genre) => {
                            const count = genreCounts[genre.id] || 0;
                            const Icon = getGenreIcon(genre.id);

                            return (
                                <div
                                    key={genre.id}
                                    onClick={() => router.push(`/genre/${encodeURIComponent(genre.id)}`)}
                                    className="group cursor-pointer bg-[#151921] hover:bg-[#1c222c] rounded-xl p-6 border border-slate-800 hover:border-purple-500/50 transition-all transform hover:-translate-y-1 relative overflow-hidden"
                                >
                                    <div className="absolute -top-6 -right-6 w-24 h-24 bg-purple-500/5 rounded-full group-hover:bg-purple-500/10 transition-colors blur-xl" />

                                    <div className="relative z-10">
                                        <div className="mb-4 p-3 bg-slate-800 w-fit rounded-lg text-purple-400 group-hover:text-purple-300 transition-colors">
                                            <Icon className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-100 group-hover:text-white transition-colors mb-1">
                                            {genre.name}
                                        </h3>
                                        <p className="text-slate-500 text-xs font-medium">
                                            {count > 0 ? `${count} Titles` : "No titles"}
                                        </p>
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

function getGenreIcon(genre: string) {
    const icons: Record<string, any> = {
        "All": Gamepad2,
        "Town and City": Building2,
        "Medieval": Crown, // Lucide doesn't have Castle? Using Crown for now, or maybe Building is safe.
        "Scifi": Rocket,
        "Fighting": Swords, // or Shield
        "Horror": Ghost,
        "Naval": Anchor,
        "Comedy": Smile,
        "Western": Mountain, // Close enough?
        "Military": Target,
        "Building": Hammer,
        "FPS": CrosshairIcon, // wait, Crosshair might not be exported as such. Let's stick to safe ones.
        "RPG": BookOpen, // Story? or Sword?
        "Adventure": Tent,
        "Sports": Trophy,
        "Tutorial": MonitorPlay,
    };
    return icons[genre] || Gamepad2;
}

// Helper for FPS if needed
const CrosshairIcon = Target;
