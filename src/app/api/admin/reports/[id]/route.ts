import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const reportId = parseInt(id, 10);

    const admin = await isAdmin();
    if (!admin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await req.json();
    const action = body.action as string;

    if (!["resolve", "dismiss", "delete_review"].includes(action)) {
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Get the report first
    const { data: report } = await supabase
        .from("review_reports")
        .select("review_id")
        .eq("id", reportId)
        .single();

    if (!report) {
        return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // If action is delete_review, delete the review first
    if (action === "delete_review" && report.review_id) {
        // Delete related likes
        await supabase.from("review_likes").delete().eq("review_id", report.review_id);

        // Delete the review
        const { error: deleteError } = await supabase
            .from("reviews")
            .delete()
            .eq("id", report.review_id);

        if (deleteError) {
            return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
        }
    }

    // Update report status
    const newStatus = action === "dismiss" ? "dismissed" : "resolved";
    const { error: updateError } = await supabase
        .from("review_reports")
        .update({
            status: newStatus,
            resolved_at: new Date().toISOString(),
            resolved_by: user?.id,
        })
        .eq("id", reportId);

    if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Also resolve any other pending reports for the same review (if deleted)
    if (action === "delete_review" && report.review_id) {
        await supabase
            .from("review_reports")
            .update({
                status: "resolved",
                resolved_at: new Date().toISOString(),
                resolved_by: user?.id,
            })
            .eq("review_id", report.review_id)
            .eq("status", "pending");
    }

    return NextResponse.json({ success: true });
}
