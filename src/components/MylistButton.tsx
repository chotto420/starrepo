"use client";

import { useEffect, useState } from "react";
import { showToast } from "./ToastContainer";

type MylistButtonProps = {
    placeId: number;
    placeName: string;
};

export default function MylistButton({ placeId, placeName }: MylistButtonProps) {
    const [isInMylist, setIsInMylist] = useState(false);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        checkMylistStatus();
    }, [placeId]);

    async function checkMylistStatus() {
        try {
            const res = await fetch(`/api/mylist/check?placeId=${placeId}`);
            const data = await res.json();
            setIsInMylist(data.isInMylist);
        } catch (error) {
            console.error("Failed to check mylist status:", error);
        } finally {
            setLoading(false);
        }
    }

    async function toggleMylist() {
        setProcessing(true);

        try {
            const method = isInMylist ? "DELETE" : "POST";
            const res = await fetch("/api/mylist", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ placeId }),
            });

            const data = await res.json();

            if (res.ok) {
                setIsInMylist(!isInMylist);
                showToast(
                    isInMylist
                        ? `「${placeName}」をマイリストから削除しました`
                        : `「${placeName}」をマイリストに追加しました`,
                    "success"
                );
            } else {
                showToast(data.error || "操作に失敗しました", "error");
            }
        } catch (error) {
            console.error("Mylist toggle error:", error);
            showToast("エラーが発生しました", "error");
        } finally {
            setProcessing(false);
        }
    }

    if (loading) {
        return (
            <button
                disabled
                className="px-6 py-3 bg-slate-700 text-slate-400 font-semibold rounded-lg cursor-not-allowed"
            >
                <span className="flex items-center gap-2">
                    <span className="text-xl">📚</span>
                    読み込み中...
                </span>
            </button>
        );
    }

    return (
        <button
            onClick={toggleMylist}
            disabled={processing}
            className={`px-6 py-3 font-semibold rounded-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${isInMylist
                ? "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black shadow-yellow-500/30 hover:shadow-yellow-500/50"
                : "bg-slate-700 hover:bg-slate-600 text-white border border-slate-600 hover:border-yellow-500/50"
                }`}
        >
            <span className="flex items-center gap-2">
                <span className="text-xl">{isInMylist ? "✓" : "📚"}</span>
                {processing ? "処理中..." : isInMylist ? "登録済み" : "マイリスト"}
            </span>
        </button>
    );
}
