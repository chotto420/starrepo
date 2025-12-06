"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Shield, ChevronLeft, Trash2, RefreshCw, ExternalLink, ArrowUpDown, Eye, Heart, Gamepad2, X, AlertTriangle } from "lucide-react";

type Game = {
    place_id: number;
    name: string;
    visit_count: number;
    favorite_count: number;
    thumbnail_url: string | null;
    last_synced_at: string | null;
    creator_name: string;
};

type SortField = "visit_count" | "favorite_count" | "name";

type DeleteConfirm = {
    placeId: number;
    name: string;
} | null;

export default function AdminGamesPage() {
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [sortBy, setSortBy] = useState<SortField>("visit_count");
    const [order, setOrder] = useState<"asc" | "desc">("asc");
    const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirm>(null);

    useEffect(() => {
        fetchGames();
    }, [sortBy, order]);

    const fetchGames = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/games?sortBy=${sortBy}&order=${order}`);
            if (res.ok) {
                const data = await res.json();
                setGames(data.games || []);
            }
        } catch (error) {
            console.error("Failed to fetch games:", error);
        }
        setLoading(false);
    };

    // 削除確認モーダルを表示
    const handleDeleteClick = (placeId: number, name: string) => {
        setDeleteConfirm({ placeId, name });
    };

    // 削除実行
    const confirmDelete = async () => {
        if (!deleteConfirm) return;

        const { placeId } = deleteConfirm;
        setDeleteConfirm(null);
        setDeletingId(placeId);

        try {
            const res = await fetch(`/api/admin/games/${placeId}`, { method: "DELETE" });
            if (res.ok) {
                setGames(games.filter(g => g.place_id !== placeId));
            } else {
                const data = await res.json();
                alert(`削除に失敗しました: ${data.error}`);
            }
        } catch (error) {
            console.error("Delete error:", error);
            alert("削除中にエラーが発生しました");
        }
        setDeletingId(null);
    };

    const toggleSort = (field: SortField) => {
        if (sortBy === field) {
            setOrder(order === "asc" ? "desc" : "asc");
        } else {
            setSortBy(field);
            setOrder("asc");
        }
    };

    const formatNumber = (num: number) => {
        if (num >= 1000000000) {
            return (num / 1000000000).toFixed(1) + "B";
        }
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + "M";
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + "K";
        }
        return num.toString();
    };

    return (
        <main className="min-h-screen bg-slate-900 text-white">
            {/* Header */}
            <div className="bg-slate-800/50 border-b border-slate-700">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/admin" className="text-slate-400 hover:text-white transition-colors">
                                <ChevronLeft className="w-5 h-5" />
                            </Link>
                            <div className="flex items-center gap-2">
                                <Shield className="w-6 h-6 text-yellow-500" />
                                <h1 className="text-xl font-bold">ゲーム管理</h1>
                            </div>
                        </div>
                        <div className="text-sm text-slate-400">
                            {games.length} ゲーム
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Sort Controls */}
                <div className="flex items-center gap-4 mb-6">
                    <span className="text-sm text-slate-400">並べ替え:</span>
                    <button
                        onClick={() => toggleSort("visit_count")}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${sortBy === "visit_count"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-slate-800 text-slate-400 hover:text-white"
                            }`}
                    >
                        <Eye className="w-4 h-4" />
                        訪問数
                        {sortBy === "visit_count" && (
                            <ArrowUpDown className="w-3 h-3 ml-1" />
                        )}
                    </button>
                    <button
                        onClick={() => toggleSort("favorite_count")}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${sortBy === "favorite_count"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-slate-800 text-slate-400 hover:text-white"
                            }`}
                    >
                        <Heart className="w-4 h-4" />
                        お気に入り
                        {sortBy === "favorite_count" && (
                            <ArrowUpDown className="w-3 h-3 ml-1" />
                        )}
                    </button>
                    <button
                        onClick={() => toggleSort("name")}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${sortBy === "name"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-slate-800 text-slate-400 hover:text-white"
                            }`}
                    >
                        名前
                        {sortBy === "name" && (
                            <ArrowUpDown className="w-3 h-3 ml-1" />
                        )}
                    </button>
                    <span className="text-xs text-slate-500 ml-4">
                        現在: {order === "asc" ? "昇順（少ない順）" : "降順（多い順）"}
                    </span>
                </div>

                {/* Games List */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <RefreshCw className="w-8 h-8 animate-spin text-slate-500" />
                    </div>
                ) : (
                    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 divide-y divide-slate-700/50">
                        {games.map((game) => (
                            <div key={game.place_id} className="p-4 flex items-center gap-4 hover:bg-slate-800/30 transition-colors">
                                {/* Thumbnail */}
                                <div className="w-16 h-16 bg-slate-700 rounded-lg overflow-hidden shrink-0">
                                    {game.thumbnail_url ? (
                                        <Image
                                            src={game.thumbnail_url}
                                            alt={game.name}
                                            width={64}
                                            height={64}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Gamepad2 className="w-8 h-8 text-slate-500" />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-medium truncate">{game.name}</h3>
                                        <Link
                                            href={`/place/${game.place_id}`}
                                            target="_blank"
                                            className="text-blue-400 hover:text-blue-300 shrink-0"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </Link>
                                    </div>
                                    <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                                        <span className="flex items-center gap-1">
                                            <Eye className="w-3 h-3" />
                                            {formatNumber(game.visit_count || 0)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Heart className="w-3 h-3" />
                                            {formatNumber(game.favorite_count || 0)}
                                        </span>
                                        <span className="text-slate-500">
                                            by {game.creator_name || "Unknown"}
                                        </span>
                                    </div>
                                </div>

                                {/* Delete Button */}
                                <button
                                    onClick={() => handleDeleteClick(game.place_id, game.name)}
                                    disabled={deletingId === game.place_id}
                                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
                                >
                                    {deletingId === game.place_id ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-4 h-4" />
                                    )}
                                    削除
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4 border border-slate-700">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-500/20 rounded-lg">
                                <AlertTriangle className="w-6 h-6 text-red-400" />
                            </div>
                            <h3 className="text-lg font-bold">削除確認</h3>
                        </div>
                        <p className="text-slate-300 mb-2">
                            以下のゲームを削除しますか？
                        </p>
                        <p className="font-medium text-white mb-4 truncate">
                            「{deleteConfirm.name}」
                        </p>
                        <p className="text-sm text-slate-400 mb-6">
                            ⚠️ 関連するレビューとマイリストアイテムも削除されます。この操作は元に戻せません。
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-4 py-2 text-sm bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                削除する
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
