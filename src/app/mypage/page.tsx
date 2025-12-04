import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import MylistSection from "@/components/MylistSection";
import ReviewsSection from "@/components/ReviewsSection";
import ProfileHeader from "@/components/ProfileHeader";

export const dynamic = "force-dynamic";

async function getUserReviews(userId: string) {
    const supabase = await createClient();

    const { data: reviews } = await supabase
        .from("reviews")
        .select(`
      *,
      places:place_id (
        place_id,
        name,
        thumbnail_url
      )
    `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    return reviews || [];
}

async function getUserMylist(userId: string) {
    const supabase = await createClient();

    const { data: mylist } = await supabase
        .from("user_mylist")
        .select("place_id, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    if (!mylist || mylist.length === 0) return [];

    // Fetch place details for mylist items
    const placeIds = mylist.map(m => m.place_id);
    const { data: places } = await supabase
        .from("places")
        .select("place_id, name, thumbnail_url, visit_count, favorite_count")
        .in("place_id", placeIds);

    // Merge mylist with place data
    return mylist.map(m => ({
        ...m,
        place: places?.find(p => p.place_id === m.place_id)
    }));
}

export default async function MyPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const reviews = await getUserReviews(user.id);
    const mylist = await getUserMylist(user.id);

    return (
        <main className="min-h-screen bg-slate-900 text-white pb-20">
            {/* Header */}
            <Link href="/" className="max-w-7xl mx-auto px-6 pt-4 text-sm text-slate-400 hover:text-white inline-block">
                ← ホームに戻る
            </Link>
            <ProfileHeader userEmail={user.email || ""} />

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                        <div className="text-3xl font-bold text-yellow-400">{reviews.length}</div>
                        <div className="text-sm text-slate-400 mt-1">投稿したレビュー</div>
                    </div>
                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                        <div className="text-3xl font-bold text-yellow-400">
                            {reviews.length > 0
                                ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                                : "-"}
                        </div>
                        <div className="text-sm text-slate-400 mt-1">平均評価</div>
                    </div>
                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                        <div className="text-3xl font-bold text-yellow-400">
                            {new Set(reviews.map((r) => r.place_id)).size}
                        </div>
                        <div className="text-sm text-slate-400 mt-1">レビューしたゲーム</div>
                    </div>
                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                        <div className="text-3xl font-bold text-yellow-400">{mylist.length}</div>
                        <div className="text-sm text-slate-400 mt-1">📚 マイリスト</div>
                    </div>
                </div>

                {/* Mylist */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <span>📚</span> マイリスト
                    </h2>
                    <MylistSection initialMylist={mylist} />
                </div>

                {/* Reviews */}
                <div>
                    <h2 className="text-2xl font-bold mb-6">投稿したレビュー</h2>
                    <ReviewsSection initialReviews={reviews} />
                </div>
            </div>
        </main>
    );
}
