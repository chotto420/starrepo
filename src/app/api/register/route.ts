import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

interface GameRes {
  data: {
    id: number;
    name: string;
    visits: number;
    playing: number;
    favoritedCount: number;
    maxPlayers: number;
    created: string;
    updated: string;
    genre: number;
    price: number;
    isSponsored: boolean;
    upVotes?: number;
    thumbnailUrl?: string;
    creator?: { name: string };
  }[];
}

interface VotesRes {
  data: { id: number; upVotes: number; downVotes: number }[];
}

interface ThumbRes {
  data: {
    universeId: number;
    thumbnails: { state: string; imageUrl: string }[];
  }[];
}

export async function POST(req: NextRequest) {
  const { placeId } = (await req.json()) as { placeId?: number };
  const id = Number(placeId);
  if (!id || !Number.isInteger(id) || id <= 0) {
    return NextResponse.json(
      { error: "placeId must be a positive integer" },
      { status: 400 }
    );
  }

  // Get universe ID
  const uRes = await fetch(
    `https://apis.roblox.com/universes/v1/places/${id}/universe`
  );
  if (uRes.status === 404) {
    return NextResponse.json(
      { error: "place not found" },
      { status: 404 }
    );
  }
  if (!uRes.ok) {
    return NextResponse.json(
      { error: `roblox api error: ${uRes.status}` },
      { status: 500 }
    );
  }
  const { universeId } = (await uRes.json()) as { universeId: number };

  // Get game info
  const gRes = await fetch(
    `https://games.roblox.com/v1/games?universeIds=${universeId}`
  );
  if (!gRes.ok) {
    return NextResponse.json(
      { error: `roblox api error: ${gRes.status}` },
      { status: 500 }
    );
  }
  const game = ((await gRes.json()) as GameRes).data[0];
  if (!game) {
    return NextResponse.json(
      { error: "game not found" },
      { status: 404 }
    );
  }

  if (game.visits < 10000) {
    return NextResponse.json(
      { error: "visits less than 10000" },
      { status: 400 }
    );
  }

  // Votes
  const vRes = await fetch(
    `https://games.roblox.com/v1/games/votes?universeIds=${universeId}`
  );
  const voteJson = vRes.ok ? ((await vRes.json()) as VotesRes) : undefined;
  const upVotes = voteJson?.data?.[0]?.upVotes ?? game.upVotes ?? 0;
  const downVotes = voteJson?.data?.[0]?.downVotes ?? 0;
  const likeRatio = upVotes + downVotes ? upVotes / (upVotes + downVotes) : 0;

  // Thumbnail
  let thumbnailUrl = game.thumbnailUrl ?? "";
  try {
    const tRes = await fetch(
      `https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds=${universeId}&countPerUniverse=1&size=768x432&format=Png`
    );
    if (tRes.ok) {
      const tJson = (await tRes.json()) as ThumbRes;
      const pic = tJson.data?.[0]?.thumbnails?.find((t) => t.state === "Completed");
      if (pic) {
        thumbnailUrl = pic.imageUrl;
      }
    }
  } catch {
    /* ignore */
  }

  // Check if the place is already registered
  const { data: existingData, error: selectError } = await supabase
    .from("places")
    .select("place_id")
    .eq("place_id", id);
  if (selectError) {
    return NextResponse.json({ error: selectError.message }, { status: 500 });
  }
  const alreadyExisted = existingData && existingData.length > 0;

  const { error } = await supabase.from("places").upsert(
    {
      place_id: id,
      universe_id: universeId,
      name: game.name,
      creator_name: game.creator?.name ?? "unknown",
      thumbnail_url: thumbnailUrl,
      like_count: upVotes,
      dislike_count: downVotes,
      like_ratio: likeRatio,
      visit_count: game.visits,
      favorite_count: game.favoritedCount,
      playing: game.playing,
      max_players: game.maxPlayers,
      genre: game.genre,
      price: game.price,
      is_sponsored: game.isSponsored,
      first_released_at: game.created,
      last_updated_at: game.updated,
      last_synced_at: new Date().toISOString(),
    },
    { onConflict: "place_id" }
  );

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, alreadyExisted });
}
