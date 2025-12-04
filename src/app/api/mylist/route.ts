import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET: ユーザーのマイリストを取得
export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { data, error } = await supabase
        .from("user_mylist")
        .select("place_id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        return NextResponse.json({ error: "マイリストの取得に失敗しました" }, { status: 500 });
    }

    return NextResponse.json({ mylist: data });
}

// POST: マイリストに追加
export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { placeId } = await req.json();

    if (!placeId || typeof placeId !== "number") {
        return NextResponse.json({ error: "Place IDが無効です" }, { status: 400 });
    }

    const { error } = await supabase
        .from("user_mylist")
        .insert({
            user_id: user.id,
            place_id: placeId,
        });

    if (error) {
        if (error.code === "23505") { // Unique constraint violation
            return NextResponse.json({ error: "既にマイリストに追加されています" }, { status: 409 });
        }
        return NextResponse.json({ error: "マイリストへの追加に失敗しました" }, { status: 500 });
    }

    return NextResponse.json({ message: "マイリストに追加しました" });
}

// DELETE: マイリストから削除
export async function DELETE(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { placeId } = await req.json();

    if (!placeId || typeof placeId !== "number") {
        return NextResponse.json({ error: "Place IDが無効です" }, { status: 400 });
    }

    const { error } = await supabase
        .from("user_mylist")
        .delete()
        .eq("user_id", user.id)
        .eq("place_id", placeId);

    if (error) {
        return NextResponse.json({ error: "マイリストからの削除に失敗しました" }, { status: 500 });
    }

    return NextResponse.json({ message: "マイリストから削除しました" });
}
