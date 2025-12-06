import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { isAdmin } from "@/lib/admin";
import { getRobloxGameData } from "@/lib/roblox";

export async function POST(req: NextRequest) {
    const admin = await isAdmin();
    if (!admin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all places
    const { data: places, error: fetchError } = await supabase
        .from("places")
        .select("place_id")
        .order("last_synced_at", { ascending: true, nullsFirst: true }); // Oldest synced first

    if (fetchError) {
        console.error("Fetch places error:", fetchError);
        return NextResponse.json({ error: "Failed to fetch places", details: fetchError.message }, { status: 500 });
    }

    if (!places || places.length === 0) {
        return NextResponse.json({ error: "No places found" }, { status: 404 });
    }

    let updated = 0;
    let failed = 0;
    const errors: { placeId: number; error: string }[] = [];

    for (const place of places) {
        try {
            const gameData = await getRobloxGameData(place.place_id);

            if (!gameData) {
                failed++;
                errors.push({ placeId: place.place_id, error: "Roblox API returned null" });
                continue;
            }

            const { error: updateError } = await supabase
                .from("places")
                .update({
                    name: gameData.name,
                    description: gameData.description,
                    creator_name: gameData.creatorName,
                    visit_count: gameData.visits,
                    playing: gameData.playing,
                    favorite_count: gameData.favorites,
                    like_count: gameData.upVotes,
                    dislike_count: gameData.downVotes,
                    icon_url: gameData.iconUrl,
                    thumbnail_url: gameData.thumbnailUrl,
                    price: gameData.price,
                    genre: gameData.genre,
                    last_updated_at: gameData.updated,
                    last_synced_at: new Date().toISOString(),
                })
                .eq("place_id", place.place_id);

            if (updateError) {
                failed++;
                errors.push({ placeId: place.place_id, error: updateError.message });
            } else {
                updated++;
            }

            // Rate limit: wait 100ms between requests to avoid Roblox API throttling
            await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
            failed++;
            errors.push({ placeId: place.place_id, error: String(error) });
        }
    }

    return NextResponse.json({
        success: true,
        total: places.length,
        updated,
        failed,
        errors: errors.slice(0, 10), // Only return first 10 errors
    });
}
