import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { RankingProcessor, validateRankingRequest } from "@/lib/ranking";
import type { RankingType } from "@/lib/ranking";

// ISR: 5分間キャッシュ
export const revalidate = 300;

/**
 * ランキングAPIエンドポイント
 * RankingProcessorを使用してランキングデータを取得
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);

    // クエリパラメータの取得
    const type = searchParams.get("type") || "overall";
    const genre = searchParams.get("genre") || "all";
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");

    // 数値変換（デフォルト値あり）
    const page = pageParam ? parseInt(pageParam, 10) : 1;
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    // リクエストオブジェクトの構築
    const rankingRequest = {
        type: type as RankingType,
        genre,
        page,
        limit
    };

    try {
        // 入力検証
        const validation = validateRankingRequest(rankingRequest);
        if (!validation.valid) {
            return NextResponse.json(
                { error: validation.error },
                { status: 400 }
            );
        }

        // Supabaseクライアントの作成
        const supabase = await createClient();

        // RankingProcessorを使用してランキングデータを取得
        const processor = new RankingProcessor(supabase);
        const result = await processor.getRanking(rankingRequest);

        // レスポンスを返却
        return NextResponse.json({
            data: result.data,
            page: result.page,
            hasMore: result.hasMore,
            totalCount: result.totalCount
        });

    } catch (error) {
        console.error("Ranking API error:", error);

        // エラーメッセージの判定
        const errorMessage = error instanceof Error
            ? error.message
            : "Server error";

        // バリデーションエラーとDBエラーを区別
        const statusCode = errorMessage.includes("Invalid")
            ? 400
            : 500;

        return NextResponse.json(
            { error: errorMessage },
            { status: statusCode }
        );
    }
}
