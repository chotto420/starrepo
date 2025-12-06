import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
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

    // Delete related reviews first
    const { error: reviewsError } = await supabase
        .from("reviews")
        .delete()
        .eq("place_id", placeId);

    if (reviewsError) {
        console.error("Failed to delete reviews:", reviewsError);
    }

    // Delete from mylists
    const { error: mylistError } = await supabase
        .from("mylist_items")
        .delete()
        .eq("place_id", placeId);

    if (mylistError) {
        console.error("Failed to delete mylist items:", mylistError);
    }

    // Delete the game
    const { error } = await supabase
        .from("places")
        .delete()
        .eq("place_id", placeId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
