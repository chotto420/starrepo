import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PUT: レビューを更新
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const reviewId = parseInt(params.id);
    if (isNaN(reviewId)) {
        return NextResponse.json({ error: "無効なレビューIDです" }, { status: 400 });
    }

    // レビューの所有者確認
    const { data: existingReview, error: fetchError } = await supabase
        .from("reviews")
        .select("user_id")
        .eq("id", reviewId)
        .single();

    if (fetchError || !existingReview) {
        return NextResponse.json({ error: "レビューが見つかりません" }, { status: 404 });
    }

    if (existingReview.user_id !== user.id) {
        return NextResponse.json({ error: "他のユーザーのレビューは編集できません" }, { status: 403 });
    }

    // リクエストボディを取得
    const body = await req.json();
    const { rating, comment } = body as {
        rating?: number;
        comment?: string;
    };

    if (rating !== undefined && (rating < 1 || rating > 5)) {
        return NextResponse.json({ error: "評価は1から5の間である必要があります" }, { status: 400 });
    }

    // 更新データを構築
    const updateData: { rating?: number; comment?: string } = {};
    if (rating !== undefined) updateData.rating = rating;
    if (comment !== undefined) updateData.comment = comment;

    if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ error: "更新するデータがありません" }, { status: 400 });
    }

    // レビューを更新
    const { error: updateError } = await supabase
        .from("reviews")
        .update(updateData)
        .eq("id", reviewId);

    if (updateError) {
        return NextResponse.json({ error: "レビューの更新に失敗しました" }, { status: 500 });
    }

    return NextResponse.json({ message: "レビューを更新しました" });
}

// DELETE: レビューを削除
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const reviewId = parseInt(params.id);
    if (isNaN(reviewId)) {
        return NextResponse.json({ error: "無効なレビューIDです" }, { status: 400 });
    }

    // レビューの所有者確認
    const { data: existingReview, error: fetchError } = await supabase
        .from("reviews")
        .select("user_id")
        .eq("id", reviewId)
        .single();

    if (fetchError || !existingReview) {
        return NextResponse.json({ error: "レビューが見つかりません" }, { status: 404 });
    }

    if (existingReview.user_id !== user.id) {
        return NextResponse.json({ error: "他のユーザーのレビューは削除できません" }, { status: 403 });
    }

    // レビューを削除
    const { error: deleteError } = await supabase
        .from("reviews")
        .delete()
        .eq("id", reviewId);

    if (deleteError) {
        return NextResponse.json({ error: "レビューの削除に失敗しました" }, { status: 500 });
    }

    return NextResponse.json({ message: "レビューを削除しました" });
}
