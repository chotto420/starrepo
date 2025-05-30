import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/* ---------------------------------------------------------------------------
   型定義
--------------------------------------------------------------------------- */

type PlaceToUniverse = Record<number, number>;

interface ThumbRes {
  data: { universeId: number; thumbnails: { state: string; imageUrl: string }[] }[];
}

interface VotesRes {
  data: { id: number; upVotes: number; downVotes: number }[];
}

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
    isPaidAccess: boolean;
    universeAvatarType: string;
    upVotes?: number;
    thumbnailUrl?: string;
    creator?: { name: string };
  }[];
}

type PlaceRow = { place_id: number; universe_id: number | null };

/* ---------------------------------------------------------------------------
   汎用ユーティリティ
--------------------------------------------------------------------------- */

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function fetchRetry(url: string, retry = 3): Promise<Response> {
  for (let i = 0; i <= retry; i++) {
    const res = await fetch(url);
    if (res.status !== 429 || i === retry) return res;
    await sleep(1_000 * (i + 1)); // エクスポネンシャルバックオフ
  }
  throw new Error("unreachable");
}

/* ---------------------------------------------------------------------------
   Step‑0 : Supabase から Place / Universe 一覧を取得（ページネーション対応）
--------------------------------------------------------------------------- */

async function loadPlaceRows(limit = 1000): Promise<PlaceRow[]> {
  let from = 0;
  const out: PlaceRow[] = [];

  while (true) {
    const { data, error } = await supabase
      .from<PlaceRow>("places")
      .select("place_id, universe_id")
      .range(from, from + limit - 1);

    if (error) throw error;
    if (!data?.length) break;

    out.push(...data);
    if (data.length < limit) break; // 最終ページ
    from += limit;
  }
  return out;
}

/* ---------------------------------------------------------------------------
   Step‑1 : Place → Universe 変換（未解決 ID だけ API を叩く）
--------------------------------------------------------------------------- */

async function toUniverseMap(ids: readonly number[]): Promise<PlaceToUniverse> {
  const out: PlaceToUniverse = {};
  for (const id of ids) {
    const r = await fetchRetry(`https://apis.roblox.com/universes/v1/places/${id}/universe`);
    if (!r.ok) {
      console.warn(`❌ place ${id}: ${r.status}`);
      continue;
    }
    const { universeId } = (await r.json()) as { universeId: number };
    out[id] = universeId;
    console.log(`🔄 ${id} → ${universeId}`);
    await sleep(100);
  }
  return out;
}

/* ---------------------------------------------------------------------------
   Step‑2a : サムネ取得
--------------------------------------------------------------------------- */

async function fetchThumbs(uIds: number[]): Promise<Record<number, string>> {
  const out: Record<number, string> = {};
  const CHUNK = 100;
  for (let i = 0; i < uIds.length; i += CHUNK) {
    const chunk = uIds.slice(i, i + CHUNK);
    const r = await fetchRetry(
      "https://thumbnails.roblox.com/v1/games/multiget/thumbnails" +
        `?universeIds=${chunk.join(",")}&countPerUniverse=1&size=768x432&format=Png`
    );
    if (!r.ok) {
      console.warn(`⚠️ thumb: ${r.status}`);
      continue;
    }
    const { data } = (await r.json()) as ThumbRes;
    for (const g of data) {
      const pic = g.thumbnails.find(t => t.state === "Completed");
      if (pic) out[g.universeId] = pic.imageUrl;
    }
    await sleep(100);
  }
  return out;
}

/* ---------------------------------------------------------------------------
   Step‑2b : いいね／バッド取得
--------------------------------------------------------------------------- */

async function fetchVotes(uIds: number[]): Promise<{ up: Record<number, number>; down: Record<number, number> }> {
  const up: Record<number, number> = {};
  const down: Record<number, number> = {};
  const CHUNK = 100;

  for (let i = 0; i < uIds.length; i += CHUNK) {
    const chunk = uIds.slice(i, i + CHUNK);
    const r = await fetchRetry(`https://games.roblox.com/v1/games/votes?universeIds=${chunk.join(",")}`);
    if (!r.ok) {
      console.warn(`⚠️ votes: ${r.status}`);
      continue;
    }
    const { data } = (await r.json()) as VotesRes;
    for (const v of data) {
      up[v.id] = v.upVotes;
      down[v.id] = v.downVotes;
    }
    await sleep(100);
  }
  return { up, down };
}

/* ---------------------------------------------------------------------------
   Step‑3 : ゲーム詳細取得 & upsert
--------------------------------------------------------------------------- */

async function run() {
  const rows = await loadPlaceRows();
  if (!rows.length) {
    console.log("⚠️ places テーブルが空です");
    return;
  }

  /* 事前にわかっている Universe ID は再計算しない */
  const placeIds = rows.map(r => r.place_id);
  const place2UniInit: PlaceToUniverse = Object.fromEntries(
    rows.filter(r => r.universe_id).map(r => [r.place_id, r.universe_id!])
  );

  const unknownIds = placeIds.filter(id => !(id in place2UniInit));
  const place2UniNew = await toUniverseMap(unknownIds);
  const place2Uni = { ...place2UniInit, ...place2UniNew };
  const uniIds = [...new Set(Object.values(place2Uni))];

  const [thumbMap, { up: upMap, down: downMap }] = await Promise.all([
    fetchThumbs(uniIds),
    fetchVotes(uniIds),
  ]);

  for (const pId of placeIds) {
    const uId = place2Uni[pId];
    if (!uId) continue; // Universe 取れなかった

    const gRes = await fetchRetry(`https://games.roblox.com/v1/games?universeIds=${uId}`);
    if (!gRes.ok) {
      console.warn(`❌ games ${uId}: ${gRes.status}`);
      continue;
    }
    const game = ((await gRes.json()) as GameRes).data[0];
    if (!game) {
      console.warn(`⚠️ no game ${uId}`);
      continue;
    }

    const up = upMap[uId] ?? game.upVotes ?? 0;
    const down = downMap[uId] ?? 0;
    const ratio = up + down ? up / (up + down) : 0;

    const { error } = await supabase.from("places").upsert(
      {
        place_id: pId,
        universe_id: uId,
        name: game.name,
        creator_name: game.creator?.name ?? "unknown",
        thumbnail_url: thumbMap[uId] ?? game.thumbnailUrl ?? "",
        like_count: up,
        dislike_count: down,
        like_ratio: ratio,
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

    error ? console.error("🔥", error) : console.log(`✅ ${game.name}`);
    await sleep(100);
  }
}

/* ---------------------------------------------------------------------------
   エントリポイント
--------------------------------------------------------------------------- */

run().catch(console.error);
