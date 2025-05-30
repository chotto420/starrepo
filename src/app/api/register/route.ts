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

export async function POST(req: NextRequest) {
  const { placeId } = (await req.json()) as { placeId?: number };
  const id = Number(placeId);
  if (!id || !Number.isInteger(id) || id <= 0) {
    return NextResponse.json(
      { error: "placeId は正の整数である必要があります" },
      { status: 400 }
    );
  }

  // Get universe ID
  const uRes = await fetch(
    `https://apis.roblox.com/universes/v1/places/${id}/universe`
  );
  if (uRes.status === 404) {
    return NextResponse.json(
      { error: "プレイスが見つかりません" },
      { status: 404 }
    );
  }
  if (!uRes.ok) {
    return NextResponse.json(
      { error: `Roblox API エラー: ${uRes.status}` },
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
      { error: `Roblox API エラー: ${gRes.status}` },
      { status: 500 }
    );
  }
  const game = ((await gRes.json()) as GameRes).data[0];
  if (!game) {
    return NextResponse.json(
      { error: "ゲームが見つかりません" },
      { status: 404 }
    );
  }

  if (game.visits < 10000) {
    return NextResponse.json(
      { error: "訪問数が 10000 未満のため登録できません" },
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

  // Check if the place is already registered
  const { data: existingData, error: selectError } = await supabase
    .from("places")
    .select("place_id")
    .eq("place_id", id);
  if (selectError) {
    return NextResponse.json({ error: selectError.message }, { status: 500 });
  }
  const alreadyExisted = existingData && existingData.length > 0;

  const thumbRes = await fetch(
    "https://thumbnails.roblox.com/v1/games/multiget/thumbnails" +
      `?universeIds=${universeId}&countPerUniverse=1&size=768x432&format=Png`
  );
  const thumbJson = thumbRes.ok ? ((await thumbRes.json()) as any) : undefined;
  const thumbUrl = thumbJson?.data?.[0]?.thumbnails?.find((t: any) => t.state === "Completed")?.imageUrl ?? game.thumbnailUrl ?? "";

  const { error } = await supabase.from("places").upsert(
    {
      place_id: id,
      universe_id: universeId,
      name: game.name,
      creator_name: game.creator?.name ?? "unknown",
      thumbnail_url: thumbUrl,
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
