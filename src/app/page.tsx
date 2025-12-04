"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PlaceList from "@/components/PlaceList";
import { showToast } from "@/components/ToastContainer";

export default function Home() {
    const [placeId, setPlaceId] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!placeId) return;
        setLoading(true);

        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ placeId }),
            });
            const json = await res.json();

            if (res.ok) {
                if (json.alreadyExists) {
                    showToast(json.message, "info");
                } else {
                    showToast(`${json.gameName || "ゲーム"}を登録しました！`, "success");
                }
                router.push(`/place/${json.placeId}`);
            } else {
                showToast(json.error || "登録に失敗しました", "error");
            }
        } catch (err) {
            console.error(err);
            showToast("エラーが発生しました。もう一度お試しください。", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen pb-20">
            {/* Hero Section */}
            <section className="relative py-20 sm:py-28 overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
                <div className="relative max-w-7xl mx-auto px-6 text-center">
                    <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 bg-clip-text text-transparent drop-shadow-sm animate-fade-in-up">
                        STAR REPO
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 animate-fade-in-up delay-100">
                        隠れたRobloxの名作を発見しよう。お気に入りを共有しよう。<br />
                        コミュニティ主導の究極のレビュープラットフォーム。
                    </p>

                    {/* Quick Links */}
                    <div className="flex flex-wrap justify-center gap-4 animate-fade-in-up delay-200">
                        <Link
                            href="/ranking"
                            className="group relative px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 hover:border-yellow-500/50 transition-all shadow-lg hover:shadow-yellow-500/20"
                        >
                            <span className="flex items-center gap-2 text-white font-semibold">
                                <span className="text-xl group-hover:scale-110 transition-transform">🏆</span>
                                ランキング
                            </span>
                        </Link>
                        <Link
                            href="/genre"
                            className="group relative px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 hover:border-yellow-500/50 transition-all shadow-lg hover:shadow-yellow-500/20"
                        >
                            <span className="flex items-center gap-2 text-white font-semibold">
                                <span className="text-xl group-hover:scale-110 transition-transform">🎮</span>
                                ジャンル
                            </span>
                        </Link>
                        <Link
                            href="/search"
                            className="group relative px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 hover:border-yellow-500/50 transition-all shadow-lg hover:shadow-yellow-500/20"
                        >
                            <span className="flex items-center gap-2 text-white font-semibold">
                                <span className="text-xl group-hover:scale-110 transition-transform">🔍</span>
                                検索
                            </span>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Game Registration Section */}
            <section className="max-w-4xl mx-auto px-6 mb-16">
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                    <div className="relative bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-2xl">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/30">
                                <span className="text-2xl">➕</span>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2">新しいゲームを登録</h2>
                                <p className="text-slate-400 text-sm">
                                    まだ登録されていないRobloxゲームをコミュニティに追加できます。<br />
                                    Place IDを入力して、レビューを始めましょう。
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleSearch} className="space-y-4">
                            <div className="relative">
                                <label htmlFor="placeId" className="block text-sm font-medium text-slate-300 mb-2">
                                    Roblox Place ID
                                </label>
                                <div className="relative flex items-center">
                                    <input
                                        id="placeId"
                                        type="text"
                                        value={placeId}
                                        onChange={(e) => setPlaceId(e.target.value)}
                                        placeholder="例: 2414851778"
                                        className="flex-1 bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-lg px-4 py-3 focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all"
                                    />
                                    <button
                                        type="submit"
                                        disabled={loading || !placeId}
                                        className="ml-3 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold rounded-lg transition-all shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 disabled:hover:scale-100"
                                    >
                                        {loading ? (
                                            <span className="flex items-center gap-2">
                                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                登録中...
                                            </span>
                                        ) : (
                                            "登録"
                                        )}
                                    </button>
                                </div>
                                <p className="mt-2 text-xs text-slate-500">
                                    💡 ヒント: ゲームのURLから「games/」の後の数字がPlace IDです
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </section>

            {/* Popular Games */}
            <section className="max-w-7xl mx-auto px-6">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-3xl font-bold text-white">人気のゲーム</h2>
                    <Link
                        href="/ranking"
                        className="text-yellow-400 hover:text-yellow-300 font-medium text-sm flex items-center gap-1 transition-colors"
                    >
                        すべて見る
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>
                <PlaceList />
            </section>
        </main>
    );
}
