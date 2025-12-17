
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkNullOrigin() {
    console.log("Checking NULL records creation date...");

    const { data, error } = await supabase
        .from("places")
        .select("name, created_at, last_synced_at")
        .is("universe_id", null)
        .order("created_at", { ascending: true })
        .limit(5);

    if (error) {
        console.error("Error:", error);
        return;
    }

    if (!data || data.length === 0) {
        console.log("No NULL records.");
    } else {
        console.log("Oldest NULL records:");
        data.forEach(p => {
            console.log(`${p.name} | Created: ${p.created_at} | Synced: ${p.last_synced_at}`);
        });
    }
}

checkNullOrigin();
