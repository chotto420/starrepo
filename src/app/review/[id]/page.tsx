// src/app/review/[id]/page.tsx
import ReviewPage from "@/components/ReviewPage";
import { supabase } from "@/lib/supabase";

async function getPlaceInfo(placeId: number) {
  const uRes = await fetch(
    `https://apis.roblox.com/universes/v1/places/${placeId}/universe`
  );
  const { universeId } = await uRes.json();
  const gRes = await fetch(
    `https://games.roblox.com/v1/games?universeIds=${universeId}`
  );
  const { data } = await gRes.json();
  const game = data[0];

  return {
    placeId,
    title: game.name,
    thumbnailUrl: game.thumbnailUrl,
    likeCount: game.totalUpVotes ?? 0,
    visitCount: game.placeVisits ?? 0,
  };
}

async function getAverageRating(placeId: number) {
  const { data, error } = await supabase
    .from("reviews")
    .select<{ rating: number }>("rating")
    .eq("place_id", placeId);

  if (error || !data?.length) return null;
  const sum = data.reduce((s, r) => s + r.rating, 0);
  return sum / data.length;
}

export default async function Page({ params }: { params: { id: string } }) {
  const placeId = Number(params.id);
  const info = await getPlaceInfo(placeId);
  const rating = await getAverageRating(placeId);

  return <ReviewPage {...info} rating={rating ?? undefined} />;
}
