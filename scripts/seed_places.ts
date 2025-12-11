
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import dns from 'node:dns';

// IPv4を優先する設定 (ENOTFOUND対策)
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing Supabase environment variables.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 共通のヘッダー
const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json'
};

type RobloxUniverseDetails = {
    id: number;
    rootPlaceId: number;
    name: string;
    description: string;
    creator: {
        id: number;
        name: string;
        type: string;
        isRNVAccount: boolean;
        hasVerifiedBadge: boolean;
    };
    price: number | null;
    allowedGearGenres: string[];
    allowedGearCategories: string[];
    isGenreEnforced: boolean;
    copyingAllowed: boolean;
    playing: number;
    visits: number;
    maxPlayers: number;
    created: string;
    updated: string;
    studioAccessToApisAllowed: boolean;
    createVipServersAllowed: boolean;
    universeAvatarType: string;
    genre: string;
    isAllGenre: boolean;
    isFavoritedByUser: boolean;
    favoritedCount: number;
};

type RobloxThumbnail = {
    targetId: number;
    state: string;
    imageUrl: string;
};

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// リトライ機能付きfetch
async function fetchWithRetry(url: string, options: any = {}, retries = 3, backoff = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            // @ts-ignore
            const response = await fetch(url, options);
            if (!response.ok) {
                // 404はリトライしない
                if (response.status === 404) return response;
                // 429 (Too Many Requests) や 5xx系はリトライ
                throw new Error(`Request failed: ${response.status} ${response.statusText}`);
            }
            return response;
        } catch (err: any) {
            if (i === retries - 1) throw err;
            console.warn(`Retrying ${url} (${i + 1}/${retries})... Error: ${err.message}`);
            await sleep(backoff * (i + 1));
        }
    }
    throw new Error(`Failed to fetch ${url} after ${retries} retries`);
}

// PlaceID -> UniverseID の変換 (1件ずつ)
async function fetchUniverseId(placeId: number): Promise<number | null> {
    try {
        const url = `https://universes.roblox.com/v1/places/${placeId}/universe`;
        const response = await fetchWithRetry(url, { headers });

        if (!response.ok) {
            if (response.status === 404) {
                console.log(`Place ${placeId} not found (404)`);
                return null;
            }
            throw new Error(`Failed to fetch universe ID: ${response.status}`);
        }

        const data = await response.json() as { universeId: number };
        return data.universeId;
    } catch (error) {
        console.error(`Error resolving universeId for place ${placeId}:`, error);
        return null;
    }
}

async function fetchUniverseDetails(universeIds: number[]) {
    if (universeIds.length === 0) return [];
    const url = `https://games.roblox.com/v1/games?universeIds=${universeIds.join(',')}`;
    const response = await fetchWithRetry(url, { headers });
    const data = await response.json() as { data: RobloxUniverseDetails[] };
    return data.data;
}

async function fetchThumbnails(universeIds: number[]) {
    if (universeIds.length === 0) return [];
    const url = `https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeIds.join(',')}&returnPolicy=PlaceHolder&size=512x512&format=Png&isCircular=false`;
    const response = await fetchWithRetry(url, { headers });
    const data = await response.json() as { data: RobloxThumbnail[] };
    return data.data;
}

async function main() {
    try {
        const jsonPath = path.join(__dirname, 'place_ids.json');
        const rawData = fs.readFileSync(jsonPath, 'utf-8');
        const allPlaceIds: number[] = JSON.parse(rawData);

        console.log(`Loaded ${allPlaceIds.length} place IDs.`);

        // 50件ずつ処理
        const chunkSize = 50;
        for (let i = 0; i < allPlaceIds.length; i += chunkSize) {
            const chunkPlaceIds = allPlaceIds.slice(i, i + chunkSize);
            console.log(`Processing chunk ${Math.floor(i / chunkSize) + 1} (${chunkPlaceIds.length} items)...`);

            try {
                // 1. PlaceID -> UniverseID 変換 (直列で実行)
                const universeIdMap = new Map<number, number>(); // placeId -> universeId
                const validUniverseIds: number[] = [];

                for (const pid of chunkPlaceIds) {
                    const uid = await fetchUniverseId(pid);
                    if (uid) {
                        universeIdMap.set(pid, uid);
                        validUniverseIds.push(uid);
                        console.log(`Found UniverseID ${uid} for PlaceID ${pid}`);
                    }
                    // 少し待機 (API制限回避)
                    await sleep(300);
                }

                if (validUniverseIds.length === 0) {
                    console.log("No valid universe IDs found in this chunk.");
                    continue;
                }

                // 2. Universe Details取得
                const universes = await fetchUniverseDetails(validUniverseIds);
                const universeMap = new Map(universes.map(u => [u.id, u]));

                // 3. Thumbnails取得 (Universe IDを使用)
                const thumbnails = await fetchThumbnails(validUniverseIds);
                const thumbnailMap = new Map(thumbnails.map(t => [t.targetId, t.imageUrl]));

                // 4. データ整形
                const upsertData = [];
                for (const placeId of chunkPlaceIds) {
                    const universeId = universeIdMap.get(placeId);
                    if (!universeId) continue;

                    const universe = universeMap.get(universeId);
                    if (!universe) continue;

                    const thumbnail = thumbnailMap.get(universeId);

                    upsertData.push({
                        place_id: placeId,
                        name: universe.name,
                        description: universe.description || "",
                        url: `https://www.roblox.com/games/${placeId}`,
                        creator_name: universe.creator.name,
                        visit_count: universe.visits || 0,
                        favorite_count: universe.favoritedCount || 0,
                        playing: universe.playing || 0,
                        genre: universe.genre || "All",
                        thumbnail_url: thumbnail || null,
                        created_at: universe.created, // ISO String
                        updated_at: universe.updated, // ISO String
                    });
                }

                // 5. SupabaseへUpsert
                if (upsertData.length > 0) {
                    const { error } = await supabase
                        .from('places')
                        .upsert(upsertData, { onConflict: 'place_id' });

                    if (error) {
                        console.error(`Supabase Error:`, error);
                    } else {
                        console.log(`Upserted ${upsertData.length} records.`);
                    }
                } else {
                    console.log(`No valid data to upsert in this chunk.`);
                }

                // Rate Limit対策のスリープ (チャンク間)
                await sleep(2000);

            } catch (err: any) {
                console.error(`Error processing chunk at index ${i}:`, err.message);
            }
        }

        console.log('Done.');

    } catch (error) {
        console.error('Script failed:', error);
    }
}

main();
