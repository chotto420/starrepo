// src/app/review/[id]/page.tsx
import ReviewPage from "@/components/ReviewPage";

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

type ReviewPageProps = {
  params: { id: string };
};

export default async function Page({ params }: ReviewPageProps) {
  const { id } = params;
  const placeId = Number(id);
  const info = await getPlaceInfo(placeId);

  return <ReviewPage {...info} />;
}
