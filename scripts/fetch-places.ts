// -----------------------------------------------------------------------------
//  fetch-places.ts ── DB に登録済みの Place を週次同期（アイコン対応版）
// -----------------------------------------------------------------------------
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// -----------------------------------------------------------------------------
// 型定義
// -----------------------------------------------------------------------------
type PlaceToUniverse = Record<number, number>;

interface IconRes {
  data: { targetId: number; state: string; imageUrl: string }[];
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

interface PlaceRow {
  place_id: number;
  universe_id: number | null;
}

// -----------------------------------------------------------------------------
// 汎用ユーティリティ
// -----------------------------------------------------------------------------
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function fetchRetry(url: string, retry = 3) {
  for (let i = 0; i <= retry; i++) {
    const res = await fetch(url);
    if (res.status !== 429 || i === retry) return res;
    await sleep(1_000 * (i + 1));
  }
  throw new Error("unreachable");
}

// -----------------------------------------------------------------------------
// Step-0  DB から対象 Place 一覧をロード
// -----------------------------------------------------------------------------
async function loadPlaceRows(): Promise<PlaceRow[]> {
  const { data, error } = await supabase
    .from("places")
    .select("place_id, universe_id");

  if (error) throw error;
  return (data ?? []) as PlaceRow[];
}

// -----------------------------------------------------------------------------
// Step-1  Place → Universe 変換（欠損のみ API 呼び出し）
// -----------------------------------------------------------------------------
async function toUniverseMap(ids: readonly number[]): Promise<PlaceToUniverse> {
  const out: PlaceToUniverse = {};
  for (const id of ids) {
    const r = await fetchRetry(
      `https://apis.roblox.com/universes/v1/places/${id}/universe`
    );
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

// -----------------------------------------------------------------------------
// Step-2a  正方形アイコン取得
// -----------------------------------------------------------------------------
async function fetchIcons(uIds: number[]) {
  const out: Record<number, string> = {};
  const CHUNK = 100;
  for (let i = 0; i < uIds.length; i += CHUNK) {
    const chunk = uIds.slice(i, i + CHUNK);
    const r = await fetchRetry(
      "https://thumbnails.roblox.com/v1/games/icons" +
        `?universeIds=${chunk.join(",")}` +
        "&size=512x512&format=Png&isCircular=false"
    );
    if (!r.ok) {
      console.warn(`⚠️ icon: ${r.status}`);
      continue;
    }
    const { data } = (await r.json()) as IconRes;
    for (const ico of data) {
      if (ico.state === "Completed") out[ico.targetId] = ico.imageUrl;
    }
    await sleep(100);
  }
  return out;
}

// -----------------------------------------------------------------------------
// Step-2b  Votes まとめて取得
// -----------------------------------------------------------------------------
async function fetchVotes(uIds: number[]) {
  const up: Record<number, number> = {};
  const down: Record<number, number> = {};
  const CHUNK = 100;
  for (let i = 0; i < uIds.length; i += CHUNK) {
    const chunk = uIds.slice(i, i + CHUNK);
    const r = await fetchRetry(
      `https://games.roblox.com/v1/games/votes?universeIds=${chunk.join(",")}`
    );
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

// -----------------------------------------------------------------------------
// Step-3  Main 処理
// -----------------------------------------------------------------------------
async function run() {
  /* DB から Place 一覧 */
  const rows = await loadPlaceRows();
  if (!rows.length) {
    console.log("⚠️ places テーブルが空です");
    return;
  }

  /* 初期マップ（universe_id が入っているものはキャッシュ扱い）*/
  const place2UniInit: PlaceToUniverse = Object.fromEntries(
    rows.filter(r => r.universe_id).map(r => [r.place_id, r.universe_id!])
  );

  const unknownIds = rows
    .filter(r => r.universe_id == null)
    .map(r => r.place_id);

  const place2UniNew = await toUniverseMap(unknownIds);

  const place2Uni: PlaceToUniverse = {
    ...place2UniInit,
    ...place2UniNew,
  };

  /* Universe ID 一覧 */
  const uniIds = [...new Set(Object.values(place2Uni))];

  /* アイコン & Votes を並列取得 */
  const [iconMap, { up: upMap, down: downMap }] = await Promise.all([
    fetchIcons(uniIds),
    fetchVotes(uniIds),
  ]);

  // -------------------------------------------------------------------------
  // Upsert ループ
  // -------------------------------------------------------------------------
  for (const { place_id: pId } of rows) {
    const uId = place2Uni[pId];
    if (!uId) continue; // 取得失敗している場合はスキップ

    const gRes = await fetchRetry(
      `https://games.roblox.com/v1/games?universeIds=${uId}`
    );
    if (!gRes.ok) {
      console.warn(`❌ games ${uId}: ${gRes.status}`);
      continue;
    }
    const game = ((await gRes.json()) as GameRes).data[0];
    if (!game) {
      console.warn(`⚠️ no game ${uId}`);
      continue;
    }

    /* 指標計算 */
    const up = upMap[uId] ?? game.upVotes ?? 0;
    const down = downMap[uId] ?? 0;
    const ratio = up + down ? up / (up + down) : 0;

    /* Upsert */
    const { error } = await supabase.from("places").upsert(
      {
        place_id: pId,
        universe_id: uId,
        name: game.name,
        creator_name: game.creator?.name ?? "unknown",
        icon_url: iconMap[uId] ?? "",         // ★ 新アイコン列
        thumbnail_url: game.thumbnailUrl ?? "",// （既存サムネが欲しければ残す）
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

    error
      ? console.error("🔥", error)
      : console.log(`✅ ${game.name}`);

    await sleep(100);
  }

  console.log("🎉 Sync finished");
}

run().catch(console.error);

// ユーティリティとしてスクリプト全体を module として扱う
export {};
