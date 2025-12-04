"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type MylistItem = {
    place_id: number;
    created_at: string;
    place?: {
        place_id: number;
        name: string;
        thumbnail_url: string;
        visit_count: number;
        favorite_count: number;
    };
};

type MylistSectionProps = {
    initialMylist: MylistItem[];
};

export default function MylistSection({ initialMylist }: MylistSectionProps) {
    const [mylist, setMylist] = useState<MylistItem[]>(initialMylist);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const supabase = createClient();

    const handleDelete = async (placeId: number) => {
        if (!confirm("このゲームをマイリストから削除しますか？")) {
            return;
        }

        setDeletingId(placeId);

        try {
            const response = await fetch("/api/mylist", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ placeId }),
            });

            if (!response.ok) {
                throw new Error("削除に失敗しました");
            }

            // 楽観的UI更新
            setMylist(mylist.filter((item) => item.place_id !== placeId));
        } catch (error) {
            console.error("Failed to delete from mylist:", error);
            alert("マイリストからの削除に失敗しました");
        } finally {
            setDeletingId(null);
        }
    };

    if (mylist.length === 0) {
        return (
            <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
                <p className="text-slate-400 mb-4">まだマイリストに追加していません</p>
                <Link
                    href="/"
                    className="inline-block bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-6 py-3 rounded-lg transition-colors"
                >
                    ゲームを探す
                </Link>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {mylist.map((item) => (
                <div
                    key={item.place_id}
                    className="group bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-yellow-500/50 hover:shadow-lg transition-all relative"
                >
                    {/* 削除ボタン */}
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            handleDelete(item.place_id);
                        }}
                        disabled={deletingId === item.place_id}
                        className="absolute top-2 right-2 z-10 w-8 h-8 bg-red-500/90 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="マイリストから削除"
                    >
                        {deletingId === item.place_id ? (
                            <span className="text-xs">...</span>
                        ) : (
                            <span className="text-lg leading-none">×</span>
                        )}
                    </button>

                    <Link href={`/place/${item.place_id}`} className="block">
                        <div className="relative h-40 bg-slate-700">
                            {item.place?.thumbnail_url ? (
                                <img
                                    src={item.place.thumbnail_url}
                                    alt={item.place.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-500">
                                    画像なし
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent"></div>
                            <div className="absolute bottom-3 left-3 right-3">
                                <h3 className="text-sm font-bold text-white truncate group-hover:text-yellow-400 transition-colors">
                                    {item.place?.name || `Place #${item.place_id}`}
                                </h3>
                            </div>
                        </div>
                        <div className="p-3 flex items-center justify-between text-xs text-slate-400">
                            <span>
                                👁 {((item.place?.visit_count || 0) / 1000000).toFixed(1)}M+
                            </span>
                            <span>
                                ♥ {((item.place?.favorite_count || 0) / 1000).toFixed(1)}K+
                            </span>
                        </div>
                    </Link>
                </div>
            ))}
        </div>
    );
}
