import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";

export async function GET() {
    const admin = await isAdmin();
    if (!admin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Fetch all reports
    const { data: reports, error } = await supabase
        .from("review_reports")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!reports || reports.length === 0) {
        return NextResponse.json([]);
    }

    // Fetch reporter profiles
    const reporterIds = [...new Set(reports.map(r => r.reporter_id))];
    const { data: reporters } = await supabase
        .from("profiles")
        .select("user_id, username")
        .in("user_id", reporterIds);

    // Fetch reviews
    const reviewIds = [...new Set(reports.filter(r => r.review_id).map(r => r.review_id))];
    let reviews: any[] = [];
    if (reviewIds.length > 0) {
        const { data: reviewsData } = await supabase
            .from("reviews")
            .select("id, comment, rating, user_id, place_id")
            .in("id", reviewIds);
        reviews = reviewsData || [];
    }

    // Fetch reviewer profiles
    const reviewerIds = [...new Set(reviews.map(r => r.user_id).filter(Boolean))];
    let reviewers: any[] = [];
    if (reviewerIds.length > 0) {
        const { data: reviewersData } = await supabase
            .from("profiles")
            .select("user_id, username")
            .in("user_id", reviewerIds);
        reviewers = reviewersData || [];
    }

    // Merge data
    const enrichedReports = reports.map(report => ({
        ...report,
        reporter: reporters?.find(p => p.user_id === report.reporter_id) || null,
        review: report.review_id ? {
            ...reviews.find(r => r.id === report.review_id),
            reviewer: reviewers.find(p => p.user_id === reviews.find(r => r.id === report.review_id)?.user_id) || null
        } : null
    }));

    return NextResponse.json(enrichedReports);
}
