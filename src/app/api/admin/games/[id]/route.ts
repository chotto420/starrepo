import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const placeId = parseInt(id, 10);

    const admin = await isAdmin();
    if (!admin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use admin client to bypass RLS
    const supabase = createAdminClient();

    // Delete related reviews first
    const { error: reviewsError, count: reviewsCount } = await supabase
        .from("reviews")
        .delete()
        .eq("place_id", placeId);

    if (reviewsError) {
        console.error("Failed to delete reviews:", reviewsError);
    } else {
        console.log(`Deleted ${reviewsCount ?? 0} reviews for game ${placeId}`);
    }

    // Delete from user_mylist
    const { error: mylistError } = await supabase
        .from("user_mylist")
        .delete()
        .eq("place_id", placeId);

    if (mylistError) {
        console.error("Failed to delete mylist items:", mylistError);
    }

    // Delete the game
    const { error, count } = await supabase
        .from("places")
        .delete()
        .eq("place_id", placeId);

    if (error) {
        console.error("Failed to delete game:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`Game ${placeId} deleted successfully (count: ${count ?? 'unknown'})`);
    return NextResponse.json({ success: true });
}
