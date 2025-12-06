import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { isAdmin } from "@/lib/admin";

export async function GET(req: NextRequest) {
    const admin = await isAdmin();
    if (!admin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sortBy = searchParams.get("sortBy") || "visit_count";
    const order = searchParams.get("order") || "asc";

    const validSortFields = ["visit_count", "favorite_count", "name", "last_synced_at"];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "visit_count";

    const { data: games, error } = await supabase
        .from("places")
        .select("place_id, name, visit_count, favorite_count, thumbnail_url, last_synced_at, creator_name")
        .order(sortField, { ascending: order === "asc", nullsFirst: order === "asc" });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ games });
}
