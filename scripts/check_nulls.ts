
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkNulls() {
    console.log("Checking places table stats...");

    // Total count
    const { count: total, error: err1 } = await supabase
        .from("places")
        .select("*", { count: 'exact', head: true });

    // Universe ID is NULL
    const { count: nulls, error: err2 } = await supabase
        .from("places")
        .select("*", { count: 'exact', head: true })
        .is("universe_id", null);

    // Universe ID has value
    const { count: notNulls, error: err3 } = await supabase
        .from("places")
        .select("*", { count: 'exact', head: true })
        .not("universe_id", "is", null);

    if (err1 || err2 || err3) {
        console.error("Error fetching counts:", err1, err2, err3);
        return;
    }

    console.log(`Total Places: ${total}`);
    console.log(`With Universe ID: ${notNulls}`);
    console.log(`NULL Universe ID: ${nulls}`);
}

checkNulls();
