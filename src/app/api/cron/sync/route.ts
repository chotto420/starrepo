import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getRobloxGameData } from "@/lib/roblox";

export async function GET() {
    try {
        // Select 10 places that haven't been synced recently (oldest last_synced_at)
        const { data: places, error } = await supabase
            .from("places")
            .select("place_id")
            .order("last_synced_at", { ascending: true })
            .limit(10);

        if (error) throw error;
        if (!places || places.length === 0) return NextResponse.json({ message: "No places to sync" });

        const results = [];
        for (const place of places) {
            const gameData = await getRobloxGameData(place.place_id);
            if (gameData) {
                await supabase.from("places").update({
                    name: gameData.name,
                    description: gameData.description,
                    visit_count: gameData.visits,
                    playing: gameData.playing,
                    favorite_count: gameData.favorites,
                    like_count: gameData.upVotes,
                    dislike_count: gameData.downVotes,
                    icon_url: gameData.iconUrl,
                    thumbnail_url: gameData.thumbnailUrl,
                    last_updated_at: gameData.updated,
                    last_synced_at: new Date().toISOString(),
                }).eq("place_id", place.place_id);
                results.push({ id: place.place_id, status: "updated" });
            } else {
                results.push({ id: place.place_id, status: "failed" });
            }
        }

        return NextResponse.json({ results });
    } catch (error) {
        console.error("Sync Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
