
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Place } from '@/app/ranking/page'; // 型定義を流用したいが、ファイル依存が面倒なので再定義

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
        const jsonPath = path.join(__dirname, 'place_data.json');
        if (!fs.existsSync(jsonPath)) {
            console.error('File not found: scripts/place_data.json');
            process.exit(1);
        }

        const rawData = fs.readFileSync(jsonPath, 'utf-8');
        const places = JSON.parse(rawData);

        console.log(`Loaded ${places.length} records from place_data.json.`);

        // SupabaseへUpsert (チャンク分け)
        const chunkSize = 100;
        for (let i = 0; i < places.length; i += chunkSize) {
            const chunk = places.slice(i, i + chunkSize);
            console.log(`Upserting chunk ${Math.floor(i / chunkSize) + 1}...`);

            const { error } = await supabase
                .from('places')
                .upsert(chunk, { onConflict: 'place_id' });

            if (error) {
                console.error(`Error upserting chunk ${Math.floor(i / chunkSize) + 1}:`, error);
            } else {
                console.log(`Upserted ${chunk.length} records.`);
            }
        }

        console.log('Done.');

    } catch (error) {
        console.error('Script failed:', error);
    }
}

main();
