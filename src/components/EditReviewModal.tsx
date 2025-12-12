"use client";

import { useState } from "react";

type EditReviewModalProps = {
    reviewId: number;
    initialRating: number;
    initialComment: string;
    onClose: () => void;
    onSuccess: () => void;
};

export default function EditReviewModal({
    reviewId,
    initialRating,
    initialComment,
    onClose,
    onSuccess,
}: EditReviewModalProps) {
    const [rating, setRating] = useState(initialRating);
    const [comment, setComment] = useState(initialComment);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await fetch(`/api/reviews/${reviewId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rating, comment }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "レビューの更新に失敗しました");
            }

            onSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : "予期せぬエラーが発生しました");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full border border-slate-700" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-4 text-white">レビューを編集</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* 評価 */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">評価</label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className={`text-3xl transition-colors ${star <= rating ? "text-yellow-400" : "text-slate-600"
                                        }`}
                                >
                                    ★
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* コメント */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">コメント</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none min-h-[120px]"
                            placeholder="どんなところが楽しかった？気軽に書いてね✨"
                        />
                    </div>

                    {/* エラーメッセージ */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* ボタン */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                        >
                            キャンセル
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "更新中..." : "更新"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
