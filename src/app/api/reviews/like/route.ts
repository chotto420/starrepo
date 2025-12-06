import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reviewId } = await req.json();

    if (!reviewId) {
        return NextResponse.json({ error: "Review ID is required" }, { status: 400 });
    }

    // Check if like already exists
    const { data: existingLike } = await supabase
        .from("review_likes")
        .select("id")
        .eq("review_id", reviewId)
        .eq("user_id", user.id)
        .single();

    if (existingLike) {
        // Unlike
        const { error } = await supabase
            .from("review_likes")
            .delete()
            .eq("id", existingLike.id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ liked: false });
    } else {
        // Like
        const { error } = await supabase
            .from("review_likes")
            .insert({
                review_id: reviewId,
                user_id: user.id
            });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ liked: true });
    }
}
