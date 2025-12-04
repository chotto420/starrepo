import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET: 現在のユーザーのプロフィールを取得
export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

    // プロフィールが存在しない場合はデフォルト値を返す
    if (error && error.code === "PGRST116") {
        return NextResponse.json({
            user_id: user.id,
            username: null,
            avatar_url: null,
            bio: null,
        });
    }

    if (error) {
        return NextResponse.json({ error: "プロフィールの取得に失敗しました" }, { status: 500 });
    }

    return NextResponse.json(profile);
}

// PUT: プロフィールを更新（upsert）
export async function PUT(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const body = await req.json();
    const { username, avatar_url, bio } = body as {
        username?: string;
        avatar_url?: string;
        bio?: string;
    };

    // バリデーション
    if (username && username.length > 50) {
        return NextResponse.json({ error: "ユーザー名は50文字以内にしてください" }, { status: 400 });
    }

    if (bio && bio.length > 500) {
        return NextResponse.json({ error: "自己紹介は500文字以内にしてください" }, { status: 400 });
    }

    // プロフィールを更新または挿入（upsert）
    const { error } = await supabase
        .from("profiles")
        .upsert({
            user_id: user.id,
            username,
            avatar_url,
            bio,
        }, {
            onConflict: "user_id",
        });

    if (error) {
        return NextResponse.json({ error: "プロフィールの更新に失敗しました" }, { status: 500 });
    }

    return NextResponse.json({ message: "プロフィールを更新しました" });
}
