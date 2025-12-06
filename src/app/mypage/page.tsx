import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import ProfileHeader from "@/components/ProfileHeader";
import MyPageTabs from "@/components/MyPageTabs";

export const dynamic = "force-dynamic";

async function getUserReviews(userId: string) {
    const supabase = await createClient();

    // 1. Fetch raw reviews
    const { data: reviews } = await supabase
        .from("reviews")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    if (!reviews || reviews.length === 0) return [];

    // 2. Fetch Profile
    const { data: profile } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("user_id", userId)
        .single();

    // 3. Fetch Places
    const placeIds = [...new Set(reviews.map(r => r.place_id))];
    const { data: places } = await supabase
        .from("places")
        .select("place_id, name, thumbnail_url")
        .in("place_id", placeIds);

    // 4. Fetch Like Counts
    const reviewIds = reviews.map(r => r.id);
    const { data: likes } = await supabase
        .from("review_likes")
        .select("review_id")
        .in("review_id", reviewIds);

    // Count likes in memory
    const likeCounts = (likes || []).reduce((acc, like) => {
        acc[like.review_id] = (acc[like.review_id] || 0) + 1;
        return acc;
    }, {} as Record<number, number>);


    // Merge Data
    return reviews.map(r => ({
        ...r,
        places: places?.find(p => p.place_id === r.place_id) || null,
        profiles: profile || { username: "Anonymous", avatar_url: null },
        like_count: likeCounts[r.id] || 0,
        is_liked: false // Own reviews
    }));
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

    // Check profile
    const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();

    const reviews = await getUserReviews(user.id);
    const mylist = await getUserMylist(user.id);

    return (
        <main className="min-h-screen bg-slate-900 text-white pb-20">
            {/* DEBUG INFO */}
            <div className="bg-red-900/50 p-4 text-xs font-mono text-white mb-4">
                <p>User ID: {user.id}</p>
                <p>Profile: {profile ? JSON.stringify(profile) : "MISSING"}</p>
                <p>Reviews Count: {reviews.length}</p>
                <p>First Review: {JSON.stringify(reviews[0])}</p>
            </div>

            {/* Header */}
            <Link href="/" className="max-w-7xl mx-auto px-6 pt-4 text-sm text-slate-400 hover:text-white inline-block">
                ← ホームに戻る
            </Link>
            <ProfileHeader userEmail={user.email || ""} />

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-10">
                    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                        <div className="text-3xl font-bold text-yellow-400">{reviews.length}</div>
                        <div className="text-sm text-slate-400 mt-1">投稿したレビュー</div>
                    </div>
                    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                        <div className="text-3xl font-bold text-yellow-400">
                            {reviews.length > 0
                                ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                                : "-"}
                        </div>
                        <div className="text-sm text-slate-400 mt-1">平均評価</div>
                    </div>
                    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                        <div className="text-3xl font-bold text-yellow-400">
                            {new Set(reviews.map((r) => r.place_id)).size}
                        </div>
                        <div className="text-sm text-slate-400 mt-1">レビューしたゲーム</div>
                    </div>
                    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                        <div className="text-3xl font-bold text-yellow-400">{mylist.length}</div>
                        <div className="text-sm text-slate-400 mt-1">📚 マイリスト</div>
                    </div>
                </div>

                {/* Tabs */}
                <MyPageTabs
                    initialMylist={mylist}
                    initialReviews={reviews}
                    currentUserId={user.id}
                />
            </div>
        </main>
    );
}
