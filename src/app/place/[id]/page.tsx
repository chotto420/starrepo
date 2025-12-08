import { notFound } from "next/navigation";
import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getRobloxGameData } from "@/lib/roblox";
import ReviewForm from "@/components/ReviewForm";
import CollapsibleDescription from "@/components/CollapsibleDescription";
import MylistButton from "@/components/MylistButton";
import ReviewsSection from "@/components/ReviewsSection"; // Import NEW component
import Link from "next/link";
import { ChevronLeft, Play, PenLine, Eye, Heart, Users, Gamepad2 } from "lucide-react";

// Force dynamic rendering to ensure fresh auth state
export const dynamic = "force-dynamic";

const BASE_URL = "https://starrepo.net";

// Generate dynamic metadata for SEO
export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const placeId = Number(id);

  if (isNaN(placeId)) {
    return { title: "ゲームが見つかりません" };
  }

  const supabase = await createClient();
  const { data: place } = await supabase
    .from("places")
    .select("name, description, thumbnail_url, creator_name")
    .eq("place_id", placeId)
    .single();

  if (!place) {
    return { title: "ゲームが見つかりません" };
  }

  const title = `${place.name} - Roblox ゲームレビュー`;
  const description = place.description
    ? place.description.slice(0, 155) + "..."
    : `${place.name}のレビューと評価をチェック。${place.creator_name}が制作したRobloxゲーム。`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/place/${placeId}`,
      images: place.thumbnail_url ? [{ url: place.thumbnail_url }] : [],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: place.thumbnail_url ? [place.thumbnail_url] : [],
    },
    alternates: {
      canonical: `${BASE_URL}/place/${placeId}`,
    },
  };
}

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

async function getReviews(placeId: number, currentUserId?: string) {
  const supabase = await createClient();

  // reviews を取得
  const { data: reviews, error: reviewsError } = await supabase
    .from("reviews")
    .select("*, review_likes(count)")
    .eq("place_id", placeId)
    .order("created_at", { ascending: false });

  if (reviewsError) {
    console.error("Error fetching reviews:", reviewsError);
    return [];
  }

  if (!reviews || reviews.length === 0) {
    return [];
  }

  // ユーザープロファイル取得
  const userIds = [...new Set(reviews.map(r => r.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, username, avatar_url")
    .in("user_id", userIds);

  // 現在のユーザーがいいねしているか確認
  let likedReviewIds = new Set<number>();
  if (currentUserId) {
    const { data: userLikes } = await supabase
      .from("review_likes")
      .select("review_id")
      .eq("user_id", currentUserId)
      .in("review_id", reviews.map(r => r.id));

    if (userLikes) {
      userLikes.forEach(l => likedReviewIds.add(l.review_id));
    }
  }

  // データ結合
  return reviews.map(review => ({
    ...review,
    profiles: profiles?.find(p => p.user_id === review.user_id) || null,
    like_count: review.review_likes?.[0]?.count || 0,
    is_liked: likedReviewIds.has(review.id)
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

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // getReviewsにcurrentUserIdを渡す
  const reviews = await getReviews(placeId, user?.id);

  // ユーザーの既存レビューを取得
  const userReview = user ? await getUserReview(placeId, user.id) : null;

  return (
    <main className="min-h-screen bg-[#0B0E14] text-slate-200 p-4 sm:p-8 pb-20">
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="inline-flex items-center text-sm text-slate-400 hover:text-white mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" />
          ホームに戻る
        </Link>

        {/* Game Header */}
        <div className="bg-[#151921] rounded-2xl p-4 sm:p-6 border border-slate-800 mb-6 sm:mb-8 flex flex-col md:flex-row gap-4 sm:gap-8 shadow-xl shadow-black/20">
          <div className="w-full md:w-2/5 shrink-0">
            <div className="aspect-video bg-slate-800 rounded-xl overflow-hidden border border-slate-700/50 shadow-inner relative group">
              {place.thumbnail_url ? (
                <img src={place.thumbnail_url} alt={place.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600">
                  <Gamepad2 className="w-12 h-12 opacity-50" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1 sm:mb-2 leading-tight">{place.name}</h1>
            <p className="text-slate-400 font-medium mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
              <span className="text-slate-500">by</span>
              <span className="text-slate-300 hover:text-white transition-colors cursor-pointer">{place.creator_name}</span>
            </p>

            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6 bg-[#0B0E14] p-2 sm:p-4 rounded-lg border border-slate-800/50">
              <div className="text-center">
                <div className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider mb-0.5 sm:mb-1 flex items-center justify-center gap-0.5 sm:gap-1">
                  <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> 訪問
                </div>
                <div className="text-sm sm:text-lg font-bold text-slate-200">{(place.visit_count / 1000000).toFixed(1)}M+</div>
              </div>
              <div className="text-center border-l border-slate-800">
                <div className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider mb-0.5 sm:mb-1 flex items-center justify-center gap-0.5 sm:gap-1">
                  <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> いいね
                </div>
                <div className="text-sm sm:text-lg font-bold text-slate-200">{(place.favorite_count / 1000).toFixed(1)}K+</div>
              </div>
              <div className="text-center border-l border-slate-800">
                <div className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider mb-0.5 sm:mb-1 flex items-center justify-center gap-0.5 sm:gap-1">
                  <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> プレイ中
                </div>
                <div className="text-sm sm:text-lg font-bold text-green-400">{place.playing?.toLocaleString() || "-"}</div>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:gap-3">
              <div className="flex gap-2 sm:gap-3">
                <a
                  href={`https://www.roblox.com/games/${place.place_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center bg-green-600 hover:bg-green-500 text-white font-bold py-2.5 px-4 sm:py-3 sm:px-8 rounded-xl transition-all shadow-lg shadow-green-900/20 transform hover:-translate-y-0.5 flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base"
                >
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                  Robloxでプレイ
                </a>
                <MylistButton placeId={place.place_id} placeName={place.name} />
              </div>

              {/* Review Shortcut Button */}
              <a
                href="#review-form"
                className="w-full text-center py-2 px-3 sm:py-2.5 sm:px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors text-xs sm:text-sm font-medium border border-slate-700 flex items-center justify-center gap-1.5 sm:gap-2"
              >
                <PenLine className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                レビューを書く / 編集する
              </a>
            </div>
          </div>
        </div>

        {/* Collapsible Description */}
        <CollapsibleDescription description={place.description} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Left Column: Reviews List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white border-l-4 border-yellow-500 pl-4">レビュー</h2>
              {/* Count is now handled inside ReviewsSection or we can show total here */}
            </div>

            {/* Replace manual mapping with ReviewsSection */}
            <ReviewsSection initialReviews={reviews} currentUserId={user?.id} />
          </div>

          {/* Right Column: Review Form */}
          <div className="lg:col-span-1" id="review-form">
            <div className="sticky top-6">
              <ReviewForm placeId={placeId} user={user} existingReview={userReview} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
