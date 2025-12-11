
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing Supabase environment variables.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    try {
        const jsonPath = path.join(__dirname, 'place_ids.json');
        if (!fs.existsSync(jsonPath)) {
            console.error('scripts/place_ids.json not found!');
            process.exit(1);
        }

        const rawData = fs.readFileSync(jsonPath, 'utf-8');
        const allPlaceIds: number[] = JSON.parse(rawData);

        console.log(`Loaded ${allPlaceIds.length} place IDs.`);

        // ダミーデータで登録
        // 更新API (sync-roblox) が走れば正しいデータになる
        const upsertData = allPlaceIds.map(pid => ({
            place_id: pid,
            name: `Place ${pid} (Pending Update)`,
            creator_name: "Loading...",
            last_synced_at: null, // これをnullにすることで優先更新対象にする
            last_updated_at: new Date().toISOString(),
        }));

        // 100件ずつチャンク処理
        const chunkSize = 100;
        for (let i = 0; i < upsertData.length; i += chunkSize) {
            const chunk = upsertData.slice(i, i + chunkSize);
            console.log(`Upserting chunk ${Math.floor(i / chunkSize) + 1}...`);

            const { error } = await supabase
                .from('places')
                .upsert(chunk, { onConflict: 'place_id' });

            if (error) {
                console.error(`Error upserting chunk:`, error);
            } else {
                console.log(`Upserted ${chunk.length} records.`);
            }
        }

        console.log('Done. Records inserted with dummy data.');
        console.log('Please deploy the changes and run "Sync Roblox Data" from the admin dashboard.');

    } catch (error) {
        console.error('Script failed:', error);
    }
}

main();
