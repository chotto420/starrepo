import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }

    const { reviewId, reason, detail } = await req.json();

    if (!reviewId || !reason) {
        return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
    }

    const validReasons = ["harassment", "spam", "inappropriate", "impersonation", "other"];
    if (!validReasons.includes(reason)) {
        return NextResponse.json({ error: "無効な通報理由です" }, { status: 400 });
    }

    // Check if user already has a pending report for this review
    const { data: existing } = await supabase
        .from("review_reports")
        .select("id")
        .eq("review_id", reviewId)
        .eq("reporter_id", user.id)
        .eq("status", "pending")
        .single();

    if (existing) {
        return NextResponse.json({ error: "このレビューは既に通報済み（対応待ち）です" }, { status: 400 });
    }

    // Create report
    const { error } = await supabase
        .from("review_reports")
        .insert({
            review_id: reviewId,
            reporter_id: user.id,
            reason,
            detail: detail || null,
            status: "pending"
        });

    if (error) {
        console.error("Report creation error:", error);
        return NextResponse.json({ error: "通報の送信に失敗しました" }, { status: 500 });
    }

    return NextResponse.json({ message: "通報を受け付けました" });
}
