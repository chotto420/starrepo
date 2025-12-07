"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import EditReviewModal from "./EditReviewModal";
import ConfirmModal from "./ConfirmModal";
import { ThumbsUp, Star, Filter, Heart, Flag, X } from "lucide-react";

type Review = {
    id: number;
    place_id: number;
    user_id: string; // Added user_id
    rating: number;
    comment: string;
    created_at: string;
    like_count: number;
    is_liked: boolean; // Current user like status
    places?: {
        place_id: number;
        name: string;
        thumbnail_url: string;
    };
    profiles?: {
        username: string | null;
        avatar_url: string | null;
    } | null;
};

type ReviewsSectionProps = {
    initialReviews: Review[];
    currentUserId?: string;
};

type SortOption = "newest" | "helpful" | "rating_desc" | "rating_asc";

export default function ReviewsSection({ initialReviews, currentUserId }: ReviewsSectionProps) {
    const [reviews, setReviews] = useState<Review[]>(initialReviews);
    const [editingReview, setEditingReview] = useState<Review | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [deletingReviewId, setDeletingReviewId] = useState<number | null>(null);
    const [sortOption, setSortOption] = useState<SortOption>("newest");
    const [likingId, setLikingId] = useState<number | null>(null);
    const [reportingReview, setReportingReview] = useState<Review | null>(null);
    const [reportReason, setReportReason] = useState<string>("");
    const [reportDetail, setReportDetail] = useState<string>("");
    const [submittingReport, setSubmittingReport] = useState(false);

    const sortedReviews = useMemo(() => {
        const sorted = [...reviews];
        switch (sortOption) {
            case "newest":
                return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            case "helpful":
                return sorted.sort((a, b) => b.like_count - a.like_count);
            case "rating_desc":
                return sorted.sort((a, b) => b.rating - a.rating);
            case "rating_asc":
                return sorted.sort((a, b) => a.rating - b.rating);
            default:
                return sorted;
        }
    }, [reviews, sortOption]);

    const handleLike = async (reviewId: number) => {
        if (!currentUserId) {
            alert("いいねするにはログインが必要です");
            return;
        }
        if (likingId) return;

        setLikingId(reviewId);

        // Optimistic UI update
        const previousReviews = [...reviews];
        setReviews(reviews.map(r => {
            if (r.id === reviewId) {
                return {
                    ...r,
                    is_liked: !r.is_liked,
                    like_count: r.is_liked ? Math.max(0, r.like_count - 1) : r.like_count + 1
                };
            }
            return r;
        }));

        try {
            const response = await fetch("/api/reviews/like", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reviewId }),
            });

            if (!response.ok) throw new Error("Failed to like");
        } catch (error) {
            console.error("Like error:", error);
            // Revert state
            setReviews(previousReviews);
            alert("エラーが発生しました");
        } finally {
            setLikingId(null);
        }
    };

    const handleDeleteClick = (reviewId: number) => {
        setDeletingReviewId(reviewId);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingReviewId) return;

        setDeletingId(deletingReviewId);

        try {
            const response = await fetch(`/api/reviews/${deletingReviewId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "削除に失敗しました");
            }

            setReviews(reviews.filter((review) => review.id !== deletingReviewId));
        } catch (error) {
            console.error("Failed to delete review:", error);
            alert("レビューの削除に失敗しました");
        } finally {
            setDeletingId(null);
            setDeletingReviewId(null);
        }
    };

    const handleEditSuccess = () => {
        setEditingReview(null);
        window.location.reload();
    };

    const handleReport = async () => {
        if (!reportingReview || !reportReason) return;
        setSubmittingReport(true);

        try {
            const response = await fetch("/api/reviews/report", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    reviewId: reportingReview.id,
                    reason: reportReason,
                    detail: reportDetail
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            alert("通報を受け付けました。ご協力ありがとうございます。");
            setReportingReview(null);
            setReportReason("");
            setReportDetail("");
        } catch (error: unknown) {
            alert(error instanceof Error ? error.message : "通報の送信に失敗しました");
        } finally {
            setSubmittingReport(false);
        }
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
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex bg-[#151921] p-1 rounded-lg border border-slate-700">
                    {[
                        { id: "newest", label: "新着順" },
                        { id: "helpful", label: "参考になった順" },
                        { id: "rating_desc", label: "評価が高い順" },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setSortOption(tab.id as SortOption)}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${sortOption === tab.id
                                ? "bg-slate-700 text-white shadow"
                                : "text-slate-400 hover:text-slate-200"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="text-slate-400 text-sm">
                    {sortedReviews.length}件のレビュー
                </div>
            </div>

            <div className="space-y-4">
                {sortedReviews.map((review) => (
                    <div
                        key={review.id}
                        className="bg-[#151921] rounded-xl p-5 border border-slate-800 hover:border-slate-700 transition-colors relative"
                    >
                        {/* Edit/Delete Buttons for Author */}
                        {currentUserId && review.places?.places?.length === undefined && ( // Assuming this check logic from context, actually checking against external ID is better but here we rely on server side deletion protection or simplified UI check if we had user_id
                            // Simplified: We don't have user_id check here explicitly unless passed. 
                            // Assuming backend handles auth for delete. But for UI, let's keep existing logic if any. 
                            // The previous file didn't explicitly check currentUserId vs review.user_id for button visibility properly in the snippet provided 
                            // but usually we want to show it only to owner. 
                            // Let's assume passed 'currentUserId' is usable if we had review.user_id. The type has it?
                            // Checked type: Review type didn't have user_id in previous snippet but inferred from context.
                            // I will add user_id to Review type.
                            true
                        ) && (
                                <div className="absolute top-4 right-4 flex gap-2">
                                    {/* We need review.user_id to compare */}
                                </div>
                            )}


                        <div className="flex items-start gap-3 md:gap-4">
                            {/* Avatar */}
                            {review.profiles?.avatar_url ? (
                                <img
                                    src={review.profiles.avatar_url}
                                    alt={review.profiles.username || "User"}
                                    className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border border-slate-700 shrink-0"
                                />
                            ) : (
                                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-slate-700 to-slate-600 rounded-full flex items-center justify-center text-white font-bold text-sm border border-slate-500/30 shrink-0">
                                    {review.profiles?.username?.[0]?.toUpperCase() || "?"}
                                </div>
                            )}

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-semibold text-slate-200">
                                        {review.profiles?.username || "匿名ユーザー"}
                                    </span>
                                    {/* Edit/Delete visible if owned (logic needing review.user_id) */}
                                    {/* For now keeping original layout style but adding standard date */}
                                    <span className="text-slate-500 text-xs">
                                        {new Date(review.created_at).toLocaleDateString()}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 mb-3">
                                    <div className="flex text-yellow-500/90 text-sm gap-0.5">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`w-4 h-4 ${i < review.rating ? "fill-yellow-500 text-yellow-500" : "text-slate-700"}`}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-slate-600 text-xs">|</span>
                                    {/* Like Button - Disabled for own reviews */}
                                    <button
                                        onClick={() => handleLike(review.id)}
                                        disabled={currentUserId === review.user_id}
                                        className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${review.is_liked
                                            ? "bg-pink-500/20 text-pink-400 border border-pink-500/30"
                                            : currentUserId === review.user_id
                                                ? "bg-slate-800/50 text-slate-600 border border-slate-800 cursor-not-allowed"
                                                : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-slate-300"
                                            }`}
                                    >
                                        <Heart className={`w-3.5 h-3.5 ${review.is_liked ? "fill-pink-400" : ""}`} />
                                        {review.like_count > 0 ? review.like_count : "いいね"}
                                    </button>
                                </div>

                                <p className="text-slate-300 leading-relaxed text-sm md:text-base whitespace-pre-wrap">
                                    {review.comment}
                                </p>

                                {/* Action Buttons */}
                                <div className="flex justify-end gap-3 mt-3">
                                    {/* Edit/Delete - only for own reviews */}
                                    {currentUserId && currentUserId === review.user_id && (
                                        <>
                                            <button
                                                onClick={() => setEditingReview(review)}
                                                className="text-xs text-slate-500 hover:text-white transition-colors"
                                            >
                                                編集
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(review.id)}
                                                className="text-xs text-red-900/50 hover:text-red-400 transition-colors"
                                            >
                                                削除
                                            </button>
                                        </>
                                    )}
                                    {/* Report button - visible for others' reviews */}
                                    {currentUserId && currentUserId !== review.user_id && (
                                        <button
                                            onClick={() => setReportingReview(review)}
                                            className="text-xs text-slate-500 hover:text-orange-400 transition-colors flex items-center gap-1"
                                        >
                                            <Flag className="w-3 h-3" />
                                            通報
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {editingReview && (
                <EditReviewModal
                    reviewId={editingReview.id}
                    initialRating={editingReview.rating}
                    initialComment={editingReview.comment}
                    onClose={() => setEditingReview(null)}
                    onSuccess={handleEditSuccess}
                />
            )}

            {/* Report Modal */}
            {reportingReview && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1c222c] rounded-xl p-6 max-w-md w-full border border-slate-700">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white">レビューを通報</h3>
                            <button
                                onClick={() => {
                                    setReportingReview(null);
                                    setReportReason("");
                                    setReportDetail("");
                                }}
                                className="text-slate-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                通報理由 <span className="text-red-400">*</span>
                            </label>
                            <select
                                value={reportReason}
                                onChange={(e) => setReportReason(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                            >
                                <option value="">選択してください</option>
                                <option value="harassment">ハラスメント・嫌がらせ</option>
                                <option value="spam">スパム</option>
                                <option value="inappropriate">不適切なコンテンツ</option>
                                <option value="impersonation">なりすまし</option>
                                <option value="other">その他</option>
                            </select>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                詳細（任意）
                            </label>
                            <textarea
                                value={reportDetail}
                                onChange={(e) => setReportDetail(e.target.value)}
                                placeholder="問題の詳細を教えてください..."
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 h-24 resize-none"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setReportingReview(null);
                                    setReportReason("");
                                    setReportDetail("");
                                }}
                                className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={handleReport}
                                disabled={!reportReason || submittingReport}
                                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submittingReport ? "送信中..." : "通報する"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deletingReviewId !== null}
                title="レビューを削除"
                message="このレビューを削除しますか？"
                onConfirm={handleDeleteConfirm}
                onCancel={() => setDeletingReviewId(null)}
                confirmText="削除する"
                cancelText="キャンセル"
                danger={true}
            />
        </>
    );
}
