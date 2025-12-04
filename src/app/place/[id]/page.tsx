import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRobloxGameData } from "@/lib/roblox";
import ReviewForm from "@/components/ReviewForm";
import CollapsibleDescription from "@/components/CollapsibleDescription";
import MylistButton from "@/components/MylistButton";
import Link from "next/link";

// Force dynamic rendering to ensure fresh auth state
export const dynamic = "force-dynamic";

async function getPlace(id: number) {
  const supabase = await createClient();

  // 1. Try to get from DB
  const { data: place } = await supabase
    .from("places")
    .select("*")
    .eq("place_id", id)
    .single();

  if (place) return place;

  // 2. If not in DB, try to fetch from Roblox and register
  const gameData = await getRobloxGameData(id);
  if (!gameData) return null;

  const { error } = await supabase.from("places").insert({
    place_id: gameData.placeId,
    universe_id: gameData.universeId,
    name: gameData.name,
    description: gameData.description,
    creator_name: gameData.creatorName,
    visit_count: gameData.visits,
    playing: gameData.playing,
    favorite_count: gameData.favorites,
    like_count: gameData.upVotes,
    dislike_count: gameData.downVotes,
    icon_url: gameData.iconUrl,
    thumbnail_url: gameData.thumbnailUrl,
    price: gameData.price,
    genre: gameData.genre,
    first_released_at: gameData.created,
    last_updated_at: gameData.updated,
    last_synced_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Auto-register error:", error);
    return null;
  }

  return {
    place_id: gameData.placeId,
    ...gameData,
    visit_count: gameData.visits,
    favorite_count: gameData.favorites,
    thumbnail_url: gameData.thumbnailUrl,
    creator_name: gameData.creatorName,
  };
}

async function getReviews(placeId: number) {
  const supabase = await createClient();

  // まず reviews だけを取得
  const { data: reviews, error: reviewsError } = await supabase
    .from("reviews")
    .select("*")
    .eq("place_id", placeId)
    .order("created_at", { ascending: false });

  if (reviewsError) {
    console.error("Error fetching reviews:", reviewsError);
    return [];
  }

  if (!reviews || reviews.length === 0) {
    return [];
  }

  // ユーザーIDからプロフィール情報を取得（別クエリで安全に）
  const userIds = [...new Set(reviews.map(r => r.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, username, avatar_url")
    .in("user_id", userIds);

  // レビューとプロフィールをマージ
  return reviews.map(review => ({
    ...review,
    profiles: profiles?.find(p => p.user_id === review.user_id) || null
  }));
}

async function getUserReview(placeId: number, userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("*")
    .eq("place_id", placeId)
    .eq("user_id", userId)
    .single();
  return data;
}

export default async function PlacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const placeId = Number(id);

  if (isNaN(placeId)) return notFound();

  const place = await getPlace(placeId);
  if (!place) return notFound();

  const reviews = await getReviews(placeId);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // ユーザーの既存レビューを取得
  const userReview = user ? await getUserReview(placeId, user.id) : null;

  return (
    <main className="min-h-screen bg-slate-900 text-slate-200 p-4 sm:p-8 pb-20">
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="inline-flex items-center text-sm text-slate-400 hover:text-white mb-6 transition-colors">
          &larr; ホームに戻る
        </Link>

        {/* Game Header */}
        <div className="bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-700 mb-8 flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-2/5 shrink-0">
            <div className="aspect-video bg-slate-700 rounded-xl overflow-hidden shadow-lg relative group">
              {place.thumbnail_url ? (
                <img src={place.thumbnail_url} alt={place.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500">画像なし</div>
              )}
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{place.name}</h1>
            <p className="text-yellow-400 font-medium mb-4">by {place.creator_name}</p>

            <div className="grid grid-cols-3 gap-4 mb-6 bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
              <div className="text-center">
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">訪問数</div>
                <div className="text-lg font-bold text-white">{(place.visit_count / 1000000).toFixed(1)}M+</div>
              </div>
              <div className="text-center border-l border-slate-700">
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">お気に入り</div>
                <div className="text-lg font-bold text-white">{(place.favorite_count / 1000).toFixed(1)}K+</div>
              </div>
              <div className="text-center border-l border-slate-700">
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">プレイ中</div>
                <div className="text-lg font-bold text-green-400">{place.playing?.toLocaleString() || "-"}</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={`https://www.roblox.com/games/${place.place_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-lg transition-all shadow-lg hover:shadow-green-500/20 transform hover:-translate-y-0.5"
              >
                ▶ Robloxでプレイ
              </a>
              <MylistButton placeId={place.place_id} placeName={place.name} />
            </div>
          </div>
        </div>

        {/* Collapsible Description */}
        <CollapsibleDescription description={place.description} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Reviews List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">レビュー</h2>
              <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-sm font-medium">
                {reviews.length} 件のコメント
              </span>
            </div>

            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((r: any) => (
                  <div key={r.id} className="bg-slate-800 p-5 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-colors">
                    {/* User Info */}
                    <div className="flex items-start gap-3 mb-3">
                      {/* Avatar */}
                      {r.profiles?.avatar_url ? (
                        <img
                          src={r.profiles.avatar_url}
                          alt={r.profiles.username || "User"}
                          className="w-10 h-10 rounded-full object-cover border-2 border-slate-600"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-black font-bold text-sm">
                          {r.profiles?.username?.[0]?.toUpperCase() || "?"}
                        </div>
                      )}

                      {/* Name, Rating, and Date */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-white">
                            {r.profiles?.username || "匿名ユーザー"}
                          </span>
                          <small className="text-slate-500 text-xs">
                            {new Date(r.created_at).toLocaleDateString()}
                          </small>
                        </div>
                        <div className="flex text-yellow-400 text-sm gap-1">
                          {"★".repeat(r.rating)}
                          <span className="text-slate-600">{"★".repeat(5 - r.rating)}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{r.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
                <p className="text-slate-500">まだレビューがありません。最初のレビューを投稿しましょう！</p>
              </div>
            )}
          </div>

          {/* Right Column: Review Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <ReviewForm placeId={placeId} user={user} existingReview={userReview} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
