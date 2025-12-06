import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const reviewId = parseInt(id, 10);

    const admin = await isAdmin();
    if (!admin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const method = formData.get("_method");

    if (method === "DELETE") {
        const supabase = await createClient();

        // First delete related likes and reports
        await supabase.from("review_likes").delete().eq("review_id", reviewId);
        await supabase.from("review_reports").delete().eq("review_id", reviewId);

        // Then delete the review
        const { error } = await supabase.from("reviews").delete().eq("id", reviewId);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
    }

    // Redirect back to reviews page
    return NextResponse.redirect(new URL("/admin/reviews", req.url));
}
