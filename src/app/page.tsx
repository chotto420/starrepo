"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image"; // Added Image
import { Search, Plus, Sparkles, Trophy } from "lucide-react";
import PlaceList from "@/components/PlaceList";
import { showToast } from "@/components/ToastContainer";
import CreatorModal from "@/components/CreatorModal"; // Added Modal
import RollingMascot from "@/components/RollingMascot"; // Added Rolling Mascot

export default function Home() {
    const [placeId, setPlaceId] = useState("");
    const [loading, setLoading] = useState(false);
    const [isCreatorModalOpen, setIsCreatorModalOpen] = useState(false); // Added state
    const router = useRouter();

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!placeId.trim()) return;

        // もし入力されたのが数字のみなら->登録ロジック（あるいは詳細ページへ）
        // 普通のキーワードなら->検索ページへ
        // 今回の要件では「登録」機能を検索バーに統合する形にするが、
        // ユーザーが「検索」つもりで打つことも考慮し、数字の場合は登録/移動、文字列の場合は検索ページへ飛ばすのがスマート

        // Check if input is a Place ID (digits)
        if (/^\d+$/.test(placeId.trim())) {
            registerOrGoToPlace(placeId.trim());
        } else {
            // It's a keyword -> go to search
            router.push(`/search?q=${encodeURIComponent(placeId.trim())}`);
        }
    };

    const registerOrGoToPlace = async (id: string) => {
        setLoading(true);
        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ placeId: id }),
            });
            const json = await res.json();

            if (res.ok) {
                if (json.alreadyExists) {
                    // すでに存在する場合はそのまま詳細ページへ（トーストは情報として出す）
                    // showToast(json.message, "info");
                    router.push(`/place/${id}`);
                } else {
                    showToast(`${json.gameName || "ゲーム"}を登録しました！`, "success");
                    router.push(`/place/${json.placeId}`);
                }
            } else {
                showToast(json.error || "登録に失敗しました", "error");
            }
        } catch (err) {
            console.error(err);
            showToast("エラーが発生しました。", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen pb-20 overflow-x-hidden bg-[#0B0E14]">
            {/* Hero Section */}
            <section className="relative min-h-[50vh] sm:min-h-[70vh] flex flex-col items-center justify-center overflow-hidden pt-12 sm:pt-20">
                {/* Background Decor */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                    <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] opacity-30 mix-blend-screen animate-pulse"></div>
                    <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-yellow-600/10 rounded-full blur-[120px] opacity-30 mix-blend-screen animate-pulse delay-1000"></div>

                    {/* Rolling Mascot (random, rare appearance) */}
                    <RollingMascot />
                </div>

                <div className="relative z-10 w-full max-w-4xl mx-auto px-6 text-center">
                    <div className="animate-fade-in-up space-y-4 sm:space-y-8">
                        {/* Easter Egg: Above Tagline */}
                        <div className="flex justify-center py-2">
                            <button
                                onClick={() => setIsCreatorModalOpen(true)}
                                className="group relative cursor-pointer hover:scale-105 transition-transform"
                                aria-label="Supporters"
                            >
                                <div className="relative w-32 h-16 sm:w-40 sm:h-20">
                                    <Image
                                        src="/images/creators/pixel_members_transparent.png"
                                        alt="Supporters"
                                        fill
                                        className="object-contain animate-bounce-slow"
                                        style={{ imageRendering: 'pixelated' }}
                                    />
                                    {/* Speech Bubble on Hover */}
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg z-50">
                                        Produced by OssansRob
                                        <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45"></div>
                                    </div>
                                </div>
                            </button>
                        </div>

                        {/* Tagline */}
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
                            <span className="text-xs sm:text-sm font-medium text-slate-300">
                                Roblox ゲームレビューサイト
                            </span>
                        </div>

                        {/* Main Title */}
                        <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-white leading-tight">
                            面白いゲームを<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">みんなで見つけよう</span>
                        </h1>

                        <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed px-4 sm:px-0">
                            Place IDでゲームを登録、またはキーワードで検索できます。
                        </p>

                        {/* Unified Search Bar */}
                        <div className="max-w-xl mx-auto mt-6 sm:mt-10 px-4 sm:px-0 relative">

                            <form onSubmit={handleSearch} className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl sm:rounded-2xl opacity-30 group-hover:opacity-100 transition duration-500 blur"></div>
                                <div className="relative flex items-center bg-[#151921] rounded-xl sm:rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                                    <div className="pl-4 sm:pl-6 text-slate-500">
                                        <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                    <input
                                        type="text"
                                        value={placeId}
                                        onChange={(e) => setPlaceId(e.target.value)}
                                        placeholder="キーワード または Place ID を入力..."
                                        className="w-full bg-transparent text-white placeholder-slate-500 px-3 py-4 sm:px-4 sm:py-5 outline-none text-sm sm:text-lg"
                                    />
                                    <button
                                        type="submit"
                                        disabled={loading || !placeId}
                                        className="mr-2 px-4 py-2.5 sm:px-6 sm:py-3 bg-white text-black font-bold rounded-lg sm:rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm sm:text-base"
                                    >
                                        {loading ? (
                                            <div className="animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full"></div>
                                        ) : (
                                            <>
                                                <span>Go</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                            <p className="mt-4 text-xs text-slate-500">
                                例: <span className="text-slate-400">2753915549</span> (Blox Fruits) や <span className="text-slate-400">Tycoon</span> など
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Popular Section */}
            <section className="max-w-7xl mx-auto px-6 pt-12">
                <div className="flex items-end justify-between mb-8 pb-4 border-b border-white/5">
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                            <Trophy className="w-8 h-8 text-yellow-500" />
                            人気のゲーム
                        </h2>
                        <p className="text-slate-400 text-sm">コミュニティで注目されている話題の作品</p>
                    </div>
                    <Link
                        href="/ranking"
                        className="group flex items-center gap-2 text-slate-400 hover:text-white font-medium transition-colors text-sm"
                    >
                        すべて見る
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </Link>
                </div>
                <PlaceList />
            </section>

            <CreatorModal isOpen={isCreatorModalOpen} onClose={() => setIsCreatorModalOpen(false)} />
        </main>
    );
}
