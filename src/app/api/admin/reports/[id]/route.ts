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

    const formData = await req.formData();
    const status = formData.get("status") as string;

    if (!["resolved", "dismissed"].includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const { error } = await supabase
        .from("review_reports")
        .update({
            status,
            resolved_at: new Date().toISOString(),
            resolved_by: user?.id,
        })
        .eq("id", reportId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Redirect back to reports page
    return NextResponse.redirect(new URL("/admin/reports", req.url));
}
