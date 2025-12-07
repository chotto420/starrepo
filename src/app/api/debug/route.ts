import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    // 本番環境では無効化
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Not available in production" }, { status: 404 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase.from("places").select("place_id, name, genre, description").limit(5);
    return NextResponse.json({ data, error });
}
