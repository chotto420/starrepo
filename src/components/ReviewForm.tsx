"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ReviewForm({
    placeId,
    user,
    existingReview
}: {
    placeId: number;
    user: any;
    existingReview?: any;
}) {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    if (!user) {
        return (
            <div className="bg-slate-800/50 border border-dashed border-slate-700 p-6 rounded-xl text-center">
                <p className="text-slate-400 mb-4">Login to write a review.</p>
                <button
                    onClick={() => router.push("/login")}
                    className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg transition-colors"
                >
                    ログイン
                </button>
            </div>
        );
    }

    // 既存のレビューがある場合
    if (existingReview) {
        return (
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                <h3 className="text-xl font-bold text-white mb-4">あなたのレビュー</h3>
                <div className="mb-4">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="flex text-yellow-400 text-lg">
                            {"★".repeat(existingReview.rating)}
                            <span className="text-slate-600">{"★".repeat(5 - existingReview.rating)}</span>
                        </div>
                        <small className="text-slate-500">
                            {new Date(existingReview.created_at).toLocaleDateString()}
                        </small>
                    </div>
                    <p className="text-slate-300 leading-relaxed mb-4">{existingReview.comment}</p>
                </div>
                <Link
                    href="/mypage"
                    className="block w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition-colors text-center"
                >
                    マイページで編集
                </Link>
                <p className="text-xs text-slate-500 mt-3 text-center">
                    ※1つのゲームに対して1つのレビューのみ投稿できます
                </p>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");

        try {
            const response = await fetch("/api/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ placeId, rating, comment }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "レビューの投稿に失敗しました");
                return;
            }

            setComment("");
            window.location.reload(); // Force reload to show new review
        } catch (err) {
            setError("レビューの投稿に失敗しました");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <h3 className="text-xl font-bold text-white mb-4">レビューを書く</h3>
            <div className="mb-4">
                <label className="block text-sm text-slate-400 mb-2">評価</label>
                <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                        <button
                            key={n}
                            type="button"
                            onClick={() => setRating(n)}
                            className={`text-2xl transition-transform hover:scale-110 ${rating >= n ? "text-yellow-400" : "text-slate-600"}`}
                        >
                            ★
                        </button>
                    ))}
                </div>
            </div>
            <div className="mb-4">
                <label className="block text-sm text-slate-400 mb-2">コメント</label>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none"
                    placeholder="どんなところが楽しかった？気軽に書いてね✨"
                    required
                />
            </div>

            {error && (
                <div className="mb-4 bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg text-sm">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={submitting}
                className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
            >
                {submitting ? "投稿中..." : "レビューを投稿"}
            </button>
        </form>
    );
}
