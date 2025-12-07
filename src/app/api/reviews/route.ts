import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
    const supabase = await createClient();
    const placeIdParam = req.nextUrl.searchParams.get("placeId");
    const placeId = placeIdParam ? Number(placeIdParam) : null;

    if (placeId) {
        const { data, error } = await supabase
            .from("reviews")
            .select("*")
            .eq("place_id", placeId)
            .order("created_at", { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ data });
    }

    return NextResponse.json({ error: "placeId is required" }, { status: 400 });
}

export async function POST(req: NextRequest) {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json();
    const { placeId, rating, comment } = body as {
        placeId?: number;
        rating?: number;
        comment?: string;
    };

    if (!placeId || !rating) {
        return NextResponse.json({ error: "placeId and rating are required" }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
        return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    // コメントの長さ制限
    if (comment && comment.length > 2000) {
        return NextResponse.json({ error: "コメントは2000文字以内にしてください" }, { status: 400 });
    }

    // 既存のレビューをチェック
    const { data: existingReview } = await supabase
        .from("reviews")
        .select("id")
        .eq("user_id", user.id)
        .eq("place_id", placeId)
        .single();

    if (existingReview) {
        return NextResponse.json({
            error: "このゲームには既にレビューを投稿済みです。マイページから編集できます。"
        }, { status: 409 });
    }

    const { error } = await supabase.from("reviews").insert({
        place_id: placeId,
        user_id: user.id,
        rating,
        comment,
    });

    if (error) {
        // ユニーク制約違反の場合
        if (error.code === "23505") {
            return NextResponse.json({
                error: "このゲームには既にレビューを投稿済みです。"
            }, { status: 409 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
}
