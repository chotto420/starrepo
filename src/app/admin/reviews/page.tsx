import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import Link from "next/link";
import { ChevronLeft, MessageSquare, Trash2, Star, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

async function getReviews() {
    const supabase = await createClient();

    const { data: reviews } = await supabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false });

    if (!reviews) return [];

    // Fetch profiles
    const userIds = [...new Set(reviews.map(r => r.user_id))];
    const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url")
        .in("user_id", userIds);

    // Fetch places
    const placeIds = [...new Set(reviews.map(r => r.place_id))];
    const { data: places } = await supabase
        .from("places")
        .select("place_id, name")
        .in("place_id", placeIds);

    return reviews.map(r => ({
        ...r,
        profile: profiles?.find(p => p.user_id === r.user_id),
        place: places?.find(p => p.place_id === r.place_id),
    }));
}

export default async function AdminReviewsPage() {
    const admin = await isAdmin();
    if (!admin) redirect("/");

    const reviews = await getReviews();

    return (
        <main className="min-h-screen bg-slate-900 text-white">
            {/* Header */}
            <div className="bg-slate-800/50 border-b border-slate-700">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center gap-4">
                        <Link href="/admin" className="text-slate-400 hover:text-white transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <div className="flex items-center gap-2">
                            <MessageSquare className="w-6 h-6 text-green-400" />
                            <h1 className="text-xl font-bold">レビュー管理</h1>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="space-y-4">
                    {reviews.map((review) => (
                        <div key={review.id} className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    {/* Header */}
                                    <div className="flex items-center gap-4 mb-3">
                                        <div className="flex items-center gap-2">
                                            {review.profile?.avatar_url ? (
                                                <img src={review.profile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-slate-600" />
                                            )}
                                            <span className="font-medium">{review.profile?.username || "不明"}</span>
                                        </div>
                                        <span className="text-slate-500">→</span>
                                        <Link
                                            href={`/place/${review.place_id}`}
                                            className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                        >
                                            {review.place?.name || `Place ${review.place_id}`}
                                            <ExternalLink className="w-3 h-3" />
                                        </Link>
                                    </div>

                                    {/* Rating */}
                                    <div className="flex items-center gap-1 mb-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                className={`w-4 h-4 ${star <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-slate-600"}`}
                                            />
                                        ))}
                                        <span className="text-sm text-slate-400 ml-2">
                                            {new Date(review.created_at).toLocaleDateString("ja-JP")}
                                        </span>
                                    </div>

                                    {/* Comment */}
                                    <p className="text-slate-300">{review.comment || "(コメントなし)"}</p>
                                </div>

                                {/* Actions */}
                                <form action={`/api/admin/reviews/${review.id}`} method="POST">
                                    <input type="hidden" name="_method" value="DELETE" />
                                    <button
                                        type="submit"
                                        className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                                        title="レビューを削除"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </form>
                            </div>
                        </div>
                    ))}

                    {reviews.length === 0 && (
                        <div className="text-center py-12 text-slate-400">
                            レビューがありません
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
