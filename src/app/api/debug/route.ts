import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    const supabase = await createClient();
    const { data, error } = await supabase.from("places").select("place_id, name, genre, description").limit(5);
    return NextResponse.json({ data, error });
}
