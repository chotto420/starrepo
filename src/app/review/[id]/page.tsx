// src/app/review/[id]/page.tsx
import ReviewPage from "@/components/ReviewPage";
import { getAverageRating } from "@/lib/reviews";

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

export default async function Page({ params }: { params: { id: string } }) {
  const placeId = Number(params.id);
  const info = await getPlaceInfo(placeId);
  const rating = await getAverageRating(placeId);

  return <ReviewPage {...info} rating={rating ?? undefined} />;
}
