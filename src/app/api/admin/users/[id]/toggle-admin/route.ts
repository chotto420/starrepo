import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: userId } = await params;

    const admin = await isAdmin();
    if (!admin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Get current admin status
    const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("user_id", userId)
        .single();

    if (!profile) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Toggle admin status
    const { error } = await supabase
        .from("profiles")
        .update({ is_admin: !profile.is_admin })
        .eq("user_id", userId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Redirect back to users page
    return NextResponse.redirect(new URL("/admin/users", req.url));
}
