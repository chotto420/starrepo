"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// -----------------------------------------------------------------------------
//  fetch-places.ts ── DB に登録済みの Place を日次同期（アイコン＋サムネ対応）
// -----------------------------------------------------------------------------
const dotenv_1 = __importDefault(require("dotenv"));
const supabase_js_1 = require("@supabase/supabase-js");
dotenv_1.default.config({ path: ".env.local" });
// Service Role Key を優先使用（RLS バイパス）、なければ Anon Key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log("✅ Using Service Role Key (RLS bypassed)");
}
else {
    console.warn("⚠️ Service Role Key not found, using Anon Key (RLS applies)");
}
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});
// -----------------------------------------------------------------------------
// 汎用ユーティリティ
// -----------------------------------------------------------------------------
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function fetchRetry(url, retry = 1) {
    for (let i = 0; i <= retry; i++) {
        const res = await fetch(url);
        if (res.status !== 429 || i === retry)
            return res;
        console.log(`⏳ 429 detected. Waiting 6 seconds before retry...`);
        await sleep(6000);
    }
    throw new Error("unreachable");
}
// -----------------------------------------------------------------------------
// Step-0a  日次スナップショット作成（place_stats_history テーブルへ一括コピー）
// -----------------------------------------------------------------------------
async function takeDailySnapshot() {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    try {
        // RPC関数を使用してスナップショットを取得
        const { error } = await supabase.rpc('take_daily_snapshot', { snapshot_date: today });
        if (error) {
            console.warn(`⚠️ Snapshot RPC error: ${error.message}`);
            return false;
        }
        console.log(`📸 Daily snapshot taken for ${today}`);
        return true;
    }
    catch (err) {
        console.warn(`⚠️ Snapshot failed: ${err}`);
        return false;
    }
}
// -----------------------------------------------------------------------------
// Step-0b  DB から対象 Place 一覧をロード（既存画像 URL も取得）
// -----------------------------------------------------------------------------
async function loadPlaceRows() {
    const { data, error } = await supabase
        .from("places")
        .select("place_id, universe_id, thumbnail_url, icon_url");
    if (error)
        throw error;
    return (data !== null && data !== void 0 ? data : []);
}
// -----------------------------------------------------------------------------
// Step-1  Place → Universe 変換（欠損のみ API 呼び出し）
// -----------------------------------------------------------------------------
async function toUniverseMap(ids) {
    const out = {};
    for (const id of ids) {
        const r = await fetchRetry(`https://apis.roblox.com/universes/v1/places/${id}/universe`);
        if (!r.ok) {
            console.warn(`❌ place ${id}: ${r.status}`);
            continue;
        }
        const { universeId } = (await r.json());
        out[id] = universeId;
        console.log(`🔄 ${id} → ${universeId}`);
        await sleep(50);
    }
    return out;
}
// -----------------------------------------------------------------------------
// Step-2a  正方形アイコン取得
// -----------------------------------------------------------------------------
async function fetchIcons(uIds) {
    const out = {};
    const CHUNK = 100;
    for (let i = 0; i < uIds.length; i += CHUNK) {
        const chunk = uIds.slice(i, i + CHUNK);
        const r = await fetchRetry("https://thumbnails.roblox.com/v1/games/icons" +
            `?universeIds=${chunk.join(",")}` +
            "&size=512x512&format=Png&isCircular=false");
        if (!r.ok) {
            console.warn(`⚠️ icon: ${r.status}`);
            continue;
        }
        const { data } = (await r.json());
        for (const ico of data) {
            if (ico.state === "Completed")
                out[ico.targetId] = ico.imageUrl;
        }
        await sleep(100);
    }
    return out;
}
// -----------------------------------------------------------------------------
// Step-2b  横長サムネイル取得
// -----------------------------------------------------------------------------
async function fetchThumbs(uIds) {
    const out = {};
    const CHUNK = 100;
    for (let i = 0; i < uIds.length; i += CHUNK) {
        const chunk = uIds.slice(i, i + CHUNK);
        const r = await fetchRetry("https://thumbnails.roblox.com/v1/games/multiget/thumbnails" +
            `?universeIds=${chunk.join(",")}` +
            "&countPerUniverse=1&size=768x432&format=Png");
        if (!r.ok) {
            console.warn(`⚠️ thumb: ${r.status}`);
            continue;
        }
        const { data } = (await r.json());
        for (const g of data) {
            const pic = g.thumbnails.find(t => t.state === "Completed");
            if (pic)
                out[g.universeId] = pic.imageUrl;
        }
        await sleep(100);
    }
    return out;
}
// -----------------------------------------------------------------------------
// Step-2c  Votes まとめて取得
// -----------------------------------------------------------------------------
async function fetchVotes(uIds) {
    const up = {};
    const down = {};
    const CHUNK = 100;
    for (let i = 0; i < uIds.length; i += CHUNK) {
        const chunk = uIds.slice(i, i + CHUNK);
        const r = await fetchRetry(`https://games.roblox.com/v1/games/votes?universeIds=${chunk.join(",")}`);
        if (!r.ok) {
            console.warn(`⚠️ votes: ${r.status}`);
            continue;
        }
        const { data } = (await r.json());
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
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
    const startTime = Date.now();
    let successCount = 0;
    let failCount = 0;
    console.log("🚀 Starting Roblox data sync...\n");
    /* Step A: 日次スナップショット取得（統計履歴用） */
    const snapshotOk = await takeDailySnapshot();
    console.log(snapshotOk ? "📸 Snapshot completed" : "⚠️ Snapshot skipped (may already exist for today)");
    /* DB から Place 一覧 */
    const rows = await loadPlaceRows();
    if (!rows.length) {
        console.log("⚠️ places テーブルが空です");
        return;
    }
    console.log(`📋 Found ${rows.length} places to sync\n`);
    /* Universe ID マップ作成（NULLは除外） */
    const place2Uni = Object.fromEntries(rows.filter(r => r.universe_id).map(r => [r.place_id, r.universe_id]));
    /* Universe ID 一覧 */
    const uniIds = [...new Set(Object.values(place2Uni))];
    /* アイコン・サムネ・Votes を並列取得 */
    const [iconMap, thumbMap, { up: upMap, down: downMap }] = await Promise.all([
        fetchIcons(uniIds),
        fetchThumbs(uniIds),
        fetchVotes(uniIds),
    ]);
    // 既存画像 URL を参照しやすいようにマップ化
    const oldImgMap = {};
    for (const r of rows) {
        oldImgMap[r.place_id] = {
            icon: (_a = r.icon_url) !== null && _a !== void 0 ? _a : undefined,
            thumb: (_b = r.thumbnail_url) !== null && _b !== void 0 ? _b : undefined,
        };
    }
    // -------------------------------------------------------------------------
    // Upsert ループ
    // -------------------------------------------------------------------------
    for (const { place_id: pId } of rows) {
        const uId = place2Uni[pId];
        if (!uId) {
            console.warn(`⚠️ Skipped Place ${pId}: No Universe ID`);
            failCount++;
            continue;
        }
        const gRes = await fetchRetry(`https://games.roblox.com/v1/games?universeIds=${uId}`);
        if (!gRes.ok) {
            console.warn(`❌ Failed: Place ${pId} (API ${gRes.status})`);
            failCount++;
            continue;
        }
        const game = (await gRes.json()).data[0];
        if (!game) {
            console.warn(`❌ Failed: Place ${pId} (No game data)`);
            failCount++;
            continue;
        }
        /* 指標計算 */
        const up = (_d = (_c = upMap[uId]) !== null && _c !== void 0 ? _c : game.upVotes) !== null && _d !== void 0 ? _d : 0;
        const down = (_e = downMap[uId]) !== null && _e !== void 0 ? _e : 0;
        const ratio = up + down ? up / (up + down) : 0;
        /* 画像 URL 選定（新規 > 既存 > ""）*/
        const newIcon = (_h = (_f = iconMap[uId]) !== null && _f !== void 0 ? _f : (_g = oldImgMap[pId]) === null || _g === void 0 ? void 0 : _g.icon) !== null && _h !== void 0 ? _h : "";
        const newThumb = (_m = (_k = (_j = thumbMap[uId]) !== null && _j !== void 0 ? _j : game.thumbnailUrl) !== null && _k !== void 0 ? _k : (_l = oldImgMap[pId]) === null || _l === void 0 ? void 0 : _l.thumb) !== null && _m !== void 0 ? _m : "";
        /* Upsert */
        const { error } = await supabase.from("places").upsert({
            place_id: pId,
            universe_id: uId,
            name: game.name,
            creator_name: (_p = (_o = game.creator) === null || _o === void 0 ? void 0 : _o.name) !== null && _p !== void 0 ? _p : "unknown",
            icon_url: newIcon,
            thumbnail_url: newThumb,
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
        }, { onConflict: "place_id" });
        if (error) {
            console.error(`❌ Failed: ${game.name} (DB Error):`, JSON.stringify(error));
            failCount++;
        }
        else {
            console.log(`✅ ${game.name}`);
            successCount++;
        }
        await sleep(100);
    }
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const total = rows.length;
    const successRate = ((successCount / total) * 100).toFixed(1);
    console.log("\n🎉 Sync finished\n");
    console.log("📊 SUMMARY");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Total:      ${total}`);
    console.log(`✅ Success: ${successCount} (${successRate}%)`);
    console.log(`❌ Failed:  ${failCount} (${((failCount / total) * 100).toFixed(1)}%)`);
    console.log(`⏱️ Duration: ${duration}s`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");
}
run().catch(console.error);
