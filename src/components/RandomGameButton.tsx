"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dices } from "lucide-react";

export default function RandomGameButton() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleRandomGame = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/random");
            const data = await res.json();

            if (res.ok && data.placeId) {
                router.push(`/place/${data.placeId}`);
            } else {
                console.error("Random game error:", data.error);
            }
        } catch (error) {
            console.error("Random game error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleRandomGame}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full text-sm font-medium text-purple-400 hover:from-purple-500/30 hover:to-pink-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="ランダムでゲームを探す"
        >
            {loading ? (
                <div className="animate-spin h-4 w-4 border-2 border-purple-400 border-t-transparent rounded-full" />
            ) : (
                <Dices className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">運命のゲーム</span>
            <span className="sm:hidden">ランダム</span>
        </button>
    );
}
