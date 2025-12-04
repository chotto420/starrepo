"use client";

import { useState } from "react";
import Link from "next/link";
import EditReviewModal from "./EditReviewModal";

type Review = {
    id: number;
    place_id: number;
    rating: number;
    comment: string;
    created_at: string;
    places?: {
        place_id: number;
        name: string;
        thumbnail_url: string;
    };
};

type ReviewsSectionProps = {
    initialReviews: Review[];
};

export default function ReviewsSection({ initialReviews }: ReviewsSectionProps) {
    const [reviews, setReviews] = useState<Review[]>(initialReviews);
    const [editingReview, setEditingReview] = useState<Review | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const handleDelete = async (reviewId: number) => {
        if (!confirm("このレビューを削除しますか？")) {
            return;
        }

        setDeletingId(reviewId);

        try {
            const response = await fetch(`/api/reviews/${reviewId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "削除に失敗しました");
            }

            // 楽観的UI更新
            setReviews(reviews.filter((review) => review.id !== reviewId));
        } catch (error) {
            console.error("Failed to delete review:", error);
            alert("レビューの削除に失敗しました");
        } finally {
            setDeletingId(null);
        }
    };

    const handleEditSuccess = () => {
        setEditingReview(null);
        // ページをリロードして最新のレビューを取得
        window.location.reload();
    };

    if (reviews.length === 0) {
        return (
            <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
                <p className="text-slate-400 mb-4">まだレビューを投稿していません</p>
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
        <>
            <div className="space-y-4">
                {reviews.map((review) => (
                    <div
                        key={review.id}
                        className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-slate-600 transition-colors relative"
                    >
                        {/* 編集・削除ボタン */}
                        <div className="absolute top-4 right-4 flex gap-2">
                            <button
                                onClick={() => setEditingReview(review)}
                                className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-sm rounded-lg transition-colors"
                            >
                                編集
                            </button>
                            <button
                                onClick={() => handleDelete(review.id)}
                                disabled={deletingId === review.id}
                                className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {deletingId === review.id ? "削除中..." : "削除"}
                            </button>
                        </div>

                        <div className="flex items-start gap-4">
                            {/* Thumbnail */}
                            {review.places?.thumbnail_url && (
                                <Link href={`/place/${review.place_id}`} className="shrink-0">
                                    <img
                                        src={review.places.thumbnail_url}
                                        alt={review.places.name}
                                        className="w-32 h-20 object-cover rounded-lg hover:opacity-80 transition-opacity"
                                    />
                                </Link>
                            )}

                            {/* Content */}
                            <div className="flex-1 min-w-0 pr-24">
                                <Link
                                    href={`/place/${review.place_id}`}
                                    className="text-lg font-bold text-white hover:text-yellow-400 transition-colors"
                                >
                                    {review.places?.name || `Place #${review.place_id}`}
                                </Link>
                                <div className="flex items-center gap-2 mt-2 mb-3">
                                    <div className="flex text-yellow-400 text-sm">
                                        {"★".repeat(review.rating)}
                                        <span className="text-slate-600">{"★".repeat(5 - review.rating)}</span>
                                    </div>
                                    <span className="text-slate-500 text-sm">
                                        {new Date(review.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-slate-300 leading-relaxed">{review.comment}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 編集モーダル */}
            {editingReview && (
                <EditReviewModal
                    reviewId={editingReview.id}
                    initialRating={editingReview.rating}
                    initialComment={editingReview.comment}
                    onClose={() => setEditingReview(null)}
                    onSuccess={handleEditSuccess}
                />
            )}
        </>
    );
}
