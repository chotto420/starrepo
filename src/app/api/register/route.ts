import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getRobloxGameData } from "@/lib/roblox";

// Simple in-memory rate limiting (for production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const limit = rateLimitMap.get(ip);

    if (!limit || now > limit.resetTime) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + 60000 }); // 1 minute window
        return true;
    }

    if (limit.count >= 50) { // Increased from 5 to 50
        return false;
    }

    limit.count++;
    return true;
}

export async function POST(req: NextRequest) {
    try {
        // Rate limiting
        const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
        if (!checkRateLimit(ip)) {
            return NextResponse.json(
                { error: "レート制限に達しました。しばらく待ってから再度お試しください。" },
                { status: 429 }
            );
        }

        const { placeId } = await req.json();

        // Input validation
        if (!placeId || typeof placeId !== "string") {
            return NextResponse.json({ error: "Place IDを入力してください" }, { status: 400 });
        }

        // Length check
        if (placeId.length > 20) {
            return NextResponse.json({ error: "Place IDが長すぎます" }, { status: 400 });
        }

        // Regex check - only digits
        if (!/^\d+$/.test(placeId)) {
            return NextResponse.json({ error: "Place IDは数字のみで入力してください" }, { status: 400 });
        }

        const id = Number(placeId);

        // Range check
        if (id <= 0 || id > Number.MAX_SAFE_INTEGER) {
            return NextResponse.json({ error: "無効なPlace IDです" }, { status: 400 });
        }

        // Check if already exists
        const { data: existing } = await supabase
            .from("places")
            .select("place_id")
            .eq("place_id", id)
            .single();

        if (existing) {
            return NextResponse.json({
                message: "このゲームは既に登録されています",
                placeId: id,
                alreadyExists: true
            });
        }

        // Fetch from Roblox
        const gameData = await getRobloxGameData(id);
        if (!gameData) {
            return NextResponse.json({
                error: "Robloxでゲームが見つかりませんでした。Place IDを確認してください。"
            }, { status: 404 });
        }

        // Insert into DB
        const { error } = await supabase.from("places").insert({
            place_id: gameData.placeId,
            universe_id: gameData.universeId,
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
            first_released_at: gameData.created,
            last_updated_at: gameData.updated,
            last_synced_at: new Date().toISOString(),
            created_at: new Date().toISOString(), // 登録日時（更新時には変更されない）
        });

        if (error) {
            console.error("DB Insert Error:", error);
            return NextResponse.json({ error: "データベースエラーが発生しました" }, { status: 500 });
        }

        return NextResponse.json({
            message: "ゲームを登録しました！",
            placeId: id,
            gameName: gameData.name
        });
    } catch (error) {
        console.error("Register Error:", error);
        return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
    }
}
