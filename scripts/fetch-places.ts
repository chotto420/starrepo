// scripts/fetch-places.ts ── 拡張版（人気指標・メタ情報も保存）
// -----------------------------------------------------------------------------
// 追加取得カラム
//   • dislike_count  (downVotes)
//   • favorite_count (favoritedCount)
//   • playing        (現在の同接数)
//   • max_players
//   • genre
//   • price
//   • is_sponsored
//   • first_released_at / last_updated_at
//   • like_ratio     (= up / (up+down))
// 必要に応じて Supabase 側に列を追加してください（SQL 例は README 参照）
// -----------------------------------------------------------------------------

import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/* 対象 PlaceId ⬇ */
const placeIds = [
  2788229376, 4924922222, 8737602449, 6516141723, 155615604, 920587237,
  142823291, 6678877691, 2414851778, 734159876, 2753915549, 3956818381,
  537413528, 9872472334, 112420803, 5130598377, 606849621, 189707,
  893973440, 292439477, 9224601490, 13127800756, 3260590327, 4669040,
  3233893879, 10449761463, 9049840490, 1240123653, 6341670803, 2619187362,
  23578803, 1226089195, 4169490976,
] as const;

/* 型 */
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

/* 汎用 */
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
async function fetchRetry(url: string, retry = 3) {
  for (let i = 0; i <= retry; i++) {
    const res = await fetch(url);
    if (res.status !== 429 || i === retry) return res;
    await sleep(1_000 * (i + 1));
  }
  throw new Error("unreachable");
}

/* Step-1  Place → Universe */
async function toUniverseMap(ids: readonly number[]) {
  const out: PlaceToUniverse = {};
  for (const id of ids) {
    const r = await fetchRetry(`https://apis.roblox.com/universes/v1/places/${id}/universe`);
    if (!r.ok) { console.warn(`❌ place ${id}: ${r.status}`); continue; }
    const { universeId } = await r.json() as { universeId: number };
    out[id] = universeId;
    console.log(`🔄 ${id} → ${universeId}`);
    await sleep(100);
  }
  return out;
}

/* Step-2a  サムネ */
async function fetchThumbs(uIds: number[]) {
  const out: Record<number, string> = {};
  const CHUNK = 100;
  for (let i = 0; i < uIds.length; i += CHUNK) {
    const chunk = uIds.slice(i, i + CHUNK);
    const r = await fetchRetry(
      "https://thumbnails.roblox.com/v1/games/multiget/thumbnails" +
      `?universeIds=${chunk.join(",")}&countPerUniverse=1&size=768x432&format=Png`
    );
    if (!r.ok) { console.warn(`⚠️ thumb: ${r.status}`); continue; }
    const { data } = await r.json() as ThumbRes;
    for (const g of data) {
      const pic = g.thumbnails.find(t => t.state === "Completed");
      if (pic) { out[g.universeId] = pic.imageUrl; }
    }
    await sleep(100);
  }
  return out;
}

/* Step-2b  Votes */
async function fetchVotes(uIds: number[]) {
  const up: Record<number, number> = {};
  const down: Record<number, number> = {};
  const CHUNK = 100;
  for (let i = 0; i < uIds.length; i += CHUNK) {
    const chunk = uIds.slice(i, i + CHUNK);
    const r = await fetchRetry(`https://games.roblox.com/v1/games/votes?universeIds=${chunk.join(",")}`);
    if (!r.ok) { console.warn(`⚠️ votes: ${r.status}`); continue; }
    const { data } = await r.json() as VotesRes;
    for (const v of data) {
      up[v.id] = v.upVotes;
      down[v.id] = v.downVotes;
    }
    await sleep(100);
  }
  return { up, down };
}

/* Step-3  upsert */
async function run() {
  const place2Uni = await toUniverseMap(placeIds);
  const uniIds    = [...new Set(Object.values(place2Uni))];

  const [thumbMap, { up: upMap, down: downMap }] = await Promise.all([
    fetchThumbs(uniIds),
    fetchVotes(uniIds),
  ]);

  for (const pId of placeIds) {
    const uId = place2Uni[pId];
    if (!uId) continue;

    const gRes = await fetchRetry(`https://games.roblox.com/v1/games?universeIds=${uId}`);
    if (!gRes.ok) { console.warn(`❌ games ${uId}: ${gRes.status}`); continue; }
    const game = (await gRes.json() as GameRes).data[0];
    if (!game) { console.warn(`⚠️ no game ${uId}`); continue; }

    /* 指標計算 */
    const up    = upMap[uId]    ?? game.upVotes    ?? 0;
    const down  = downMap[uId]  ?? 0;
    const ratio = up + down ? up / (up + down) : 0;

    /* upsert */
    const { error } = await supabase.from("places").upsert({
      place_id:          pId,
      universe_id:       uId,
      name:              game.name,
      creator_name:      game.creator?.name ?? "unknown",
      thumbnail_url:     thumbMap[uId] ?? game.thumbnailUrl ?? "",
      like_count:        up,
      dislike_count:     down,
      like_ratio:        ratio,
      visit_count:       game.visits,
      favorite_count:    game.favoritedCount,
      playing:           game.playing,
      max_players:       game.maxPlayers,
      genre:             game.genre,
      price:             game.price,
      is_sponsored:      game.isSponsored,
      first_released_at: game.created,
      last_updated_at:   game.updated,
      last_synced_at:    new Date().toISOString(),
    }, { onConflict: "place_id" });

    error ? console.error("🔥", error) : console.log(`✅ ${game.name}`);
    await sleep(100);
  }
}

run().catch(console.error);
