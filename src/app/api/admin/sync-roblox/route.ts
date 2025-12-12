import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";
import { getRobloxGameData, RobloxGameData } from "@/lib/roblox";

// Retry wrapper for Roblox API with exponential backoff
async function fetchWithRetry(placeId: number, maxRetries: number = 2): Promise<RobloxGameData | null> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const data = await getRobloxGameData(placeId);
        if (data) {
            return data;
        }

        // If first attempts fail, wait before retrying
        if (attempt < maxRetries) {
            const delay = 1000 * (attempt + 1); // 1s, 2s
            console.log(`Retry ${attempt + 1} for placeId ${placeId} after ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    return null;
}

export async function POST(req: NextRequest) {
    const supabase = createAdminClient();
    const admin = await isAdmin();
    if (!admin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all places
    const { data: places, error: fetchError } = await supabase
        .from("places")
        .select("place_id")
        .select("place_id")
        .order("last_synced_at", { ascending: true, nullsFirst: true }) // Oldest synced first
        .limit(20); // Process 20 items per request

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

    for (let i = 0; i < places.length; i++) {
        const place = places[i];
        try {
            // Use retry wrapper
            const gameData = await fetchWithRetry(place.place_id);

            if (!gameData) {
                failed++;
                errors.push({ placeId: place.place_id, error: "Roblox API returned null (after retries)" });
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

            // Rate limit: wait 1000ms between requests to avoid Roblox API throttling
            await new Promise(resolve => setTimeout(resolve, 1000));
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
        errors: errors.slice(0, 20), // Return up to 20 errors
    });
}
