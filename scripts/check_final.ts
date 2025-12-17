
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFinal() {
    const { count: total } = await supabase.from("places").select("*", { count: 'exact', head: true });
    const { count: withUniverse } = await supabase.from("places").select("*", { count: 'exact', head: true }).not("universe_id", "is", null);
    const { count: nulls } = await supabase.from("places").select("*", { count: 'exact', head: true }).is("universe_id", null);

    console.log("Final Stats:");
    console.log(`Total Places: ${total}`);
    console.log(`With Universe ID: ${withUniverse} (${((withUniverse! / total!) * 100).toFixed(1)}%)`);
    console.log(`NULL Universe ID: ${nulls} (${((nulls! / total!) * 100).toFixed(1)}%)`);
}

checkFinal();
