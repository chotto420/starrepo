import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const supabase = await createClient();

        // まず総件数を取得
        const { count, error: countError } = await supabase
            .from("places")
            .select("*", { count: "exact", head: true });

        if (countError || !count || count === 0) {
            return NextResponse.json(
                { error: "ゲームが見つかりません" },
                { status: 404 }
            );
        }

        // ランダムなオフセットを生成
        const randomOffset = Math.floor(Math.random() * count);

        // ランダムに1件取得
        const { data: places, error } = await supabase
            .from("places")
            .select("place_id")
            .range(randomOffset, randomOffset);

        if (error || !places || places.length === 0) {
            return NextResponse.json(
                { error: "ゲームが見つかりません" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            placeId: places[0].place_id
        });

    } catch (error) {
        console.error("Random game error:", error);
        return NextResponse.json(
            { error: "サーバーエラーが発生しました" },
            { status: 500 }
        );
    }
}
