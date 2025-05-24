// scripts/fetch-places.ts (updated)
// --------------------------------------------------
// Roblox → Supabase 同期スクリプト
//   - Place → Universe マッピング
//   - Universe → サムネイル取得
//   - Universe → いいね数 upVotes 取得
//   - Game 詳細取得（訪問数 visits も含む）
//   - Supabase `places` テーブルへ upsert
// --------------------------------------------------

import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/* 対象 PlaceId 一覧 */
const placeIds = [
  2788229376, 4924922222, 8737602449, 6516141723, 155615604, 920587237,
  142823291, 6678877691, 2414851778, 734159876, 2753915549, 3956818381,
  537413528, 9872472334, 112420803, 5130598377, 606849621, 189707,
  893973440, 292439477, 9224601490, 13127800756, 3260590327, 4669040,
  3233893879, 10449761463, 9049840490, 1240123653, 6341670803, 2619187362,
  23578803, 1226089195, 4169490976,
] as const;

/* 型 */
export type PlaceToUniverse = Record<number, number>;
interface ThumbRes {
  data: {
    universeId: number;
    thumbnails: { state: string; imageUrl: string }[];
  }[];
}
interface VotesRes {
  data: {
    universeId: number;
    upVotes: number;
    downVotes: number;
  }[];
}
interface GameRes {
  data: {
    name: string;
    visits: number;
    creator?: { name: string };
    thumbnailUrl?: string;
  }[];
}

/* 汎用 */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function fetchRetry(url: string, retry = 3) {
  for (let i = 0; i <= retry; i++) {
    const res = await fetch(url);
    if (res.status !== 429 || i === retry) return res;
    await sleep(1_000 * (i + 1));
  }
  throw new Error("unreachable");
}

/* Step‑1  Place → Universe */
async function toUniverseMap(ids: readonly number[]) {
  const map: PlaceToUniverse = {};
  for (const id of ids) {
    const u = `https://apis.roblox.com/universes/v1/places/${id}/universe`;
    const r = await fetchRetry(u);
    if (!r.ok) {
      console.warn(`❌ place ${id}: ${r.status}`);
      continue;
    }
    const { universeId } = (await r.json()) as { universeId: number };
    map[id] = universeId;
    console.log(`🔄 ${id} → ${universeId}`);
    await sleep(100);
  }
  return map;
}

/* Step‑2a  Universe → サムネイル */
async function fetchThumbs(uIds: number[]) {
  const out: Record<number, string> = {};
  const CHUNK = 100;
  for (let i = 0; i < uIds.length; i += CHUNK) {
    const chunk = uIds.slice(i, i + CHUNK);
    const tUrl =
      "https://thumbnails.roblox.com/v1/games/multiget/thumbnails" +
      `?universeIds=${chunk.join(",")}` +
      `&countPerUniverse=10&size=768x432&format=Png&isCircular=false`;

    const r = await fetchRetry(tUrl);
    if (!r.ok) {
      console.warn(`⚠️ thumb: ${r.status}`);
      continue;
    }

    const { data } = (await r.json()) as ThumbRes;
    for (const g of data) {
      const pick = g.thumbnails.find((t) => t.state === "Completed");
      if (pick) {
        out[g.universeId] = pick.imageUrl;
        console.log(`📸 ${g.universeId} → ${pick.imageUrl}`);
      }
    }
    await sleep(100);
  }
  return out;
}

/* Step‑2b  Universe → いいね数 (upVotes) */
async function fetchVotes(uIds: number[]) {
  const out: Record<number, number> = {};
  const CHUNK = 100;
  for (let i = 0; i < uIds.length; i += CHUNK) {
    const chunk = uIds.slice(i, i + CHUNK);
    const vUrl =
      `https://games.roblox.com/v1/games/votes?universeIds=${chunk.join(",")}`;
    const r = await fetchRetry(vUrl);
    if (!r.ok) {
      console.warn(`⚠️ votes: ${r.status}`);
      continue;
    }
    const { data } = (await r.json()) as VotesRes;
    for (const v of data) {
      out[v.universeId] = v.upVotes;
      console.log(`👍 ${v.universeId} → ${v.upVotes}`);
    }
    await sleep(100);
  }
  return out;
}

/* Step‑3  upsert */
async function run() {
  const place2Uni = await toUniverseMap(placeIds);
  const uniIds = [...new Set(Object.values(place2Uni))];
  const [thumbMap, votesMap] = await Promise.all([
    fetchThumbs(uniIds),
    fetchVotes(uniIds),
  ]);

  for (const pId of placeIds) {
    const uId = place2Uni[pId];
    if (!uId) continue;

    const gUrl = `https://games.roblox.com/v1/games?universeIds=${uId}`;
    const gRes = await fetchRetry(gUrl);
    if (!gRes.ok) {
      console.warn(`❌ games ${uId}: ${gRes.status}`);
      continue;
    }
    const game = ((await gRes.json()) as GameRes).data[0];
    if (!game) {
      console.warn(`⚠️ no game ${uId}`);
      continue;
    }

    const thumbnail_url = thumbMap[uId] ?? game.thumbnailUrl ?? "";
    const like_count = votesMap[uId] ?? 0;
    const visit_count = game.visits ?? 0;

    const { error } = await supabase.from("places").upsert(
      {
        place_id: pId,
        universe_id: uId,
        name: game.name,
        creator_name: game.creator?.name ?? "unknown",
        thumbnail_url,
        like_count,
        visit_count,
        last_synced_at: new Date().toISOString(),
      },
      { onConflict: "place_id" }
    );

    error ? console.error("🔥", error) : console.log(`✅ ${game.name}`);
    await sleep(100);
  }
}

run().catch(console.error);

