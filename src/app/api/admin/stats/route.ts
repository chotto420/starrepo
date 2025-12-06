import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";

export async function GET() {
    const admin = await isAdmin();
    if (!admin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    const [usersResult, reviewsResult, reportsResult, gamesResult] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("reviews").select("*", { count: "exact", head: true }),
        supabase.from("review_reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("places").select("*", { count: "exact", head: true }),
    ]);

    return NextResponse.json({
        totalUsers: usersResult.count || 0,
        totalReviews: reviewsResult.count || 0,
        pendingReports: reportsResult.count || 0,
        totalGames: gamesResult.count || 0,
    });
}
