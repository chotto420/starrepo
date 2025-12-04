import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 特定のゲームがマイリストに登録されているか確認
export async function GET(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ isInMylist: false });
    }

    const { searchParams } = new URL(req.url);
    const placeId = searchParams.get("placeId");

    if (!placeId) {
        return NextResponse.json({ error: "Place IDが必要です" }, { status: 400 });
    }

    const { data, error } = await supabase
        .from("user_mylist")
        .select("id")
        .eq("user_id", user.id)
        .eq("place_id", Number(placeId))
        .single();

    if (error && error.code !== "PGRST116") { // PGRST116 = not found (expected)
        return NextResponse.json({ error: "確認に失敗しました" }, { status: 500 });
    }

    return NextResponse.json({ isInMylist: !!data });
}
