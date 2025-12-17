
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkNullDates() {
    console.log("Checking last_synced_at for NULL universe_id records...");

    const { data, error } = await supabase
        .from("places")
        .select("name, visit_count, last_synced_at")
        .is("universe_id", null)
        .order("visit_count", { ascending: false })
        .limit(5);

    if (error) {
        console.error("Error:", error);
        return;
    }

    if (!data || data.length === 0) {
        console.log("No NULL records found.");
    } else {
        console.log("Sample NULL records:");
        data.forEach(p => {
            console.log(`${p.name.slice(0, 15)} | ${p.last_synced_at}`);
        });
    }
}

checkNullDates();
