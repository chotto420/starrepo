import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ISR: 5分間キャッシュ
export const revalidate = 300;

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "overall";
    const genre = searchParams.get("genre") || "all";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    try {
        const supabase = await createClient();
        const offset = (page - 1) * limit;

        // レビュー統計を取得
        const { data: reviewData } = await supabase
            .from("reviews")
            .select("place_id, rating");

        // 評価とレビュー数を計算
        const counts = new Map<number, number>();
        const ratings = new Map<number, { sum: number; count: number }>();
        reviewData?.forEach((r: { place_id: number; rating: number }) => {
            counts.set(r.place_id, (counts.get(r.place_id) || 0) + 1);
            const curr = ratings.get(r.place_id) || { sum: 0, count: 0 };
            ratings.set(r.place_id, { sum: curr.sum + r.rating, count: curr.count + 1 });
        });

        // メインクエリ
        let query = supabase
            .from("places")
            .select("place_id, name, creator_name, thumbnail_url, visit_count, favorite_count, playing, genre, first_released_at, last_updated_at");

        // ジャンルフィルタ
        if (genre !== "all") {
            query = query.eq("genre", genre);
        }

        // ソートと取得
        switch (type) {
            case "playing":
                query = query.order("playing", { ascending: false });
                break;
            case "favorites":
                query = query.order("favorite_count", { ascending: false });
                break;
            case "newest":
                query = query.gte("favorite_count", 50).order("first_released_at", { ascending: false });
                break;
            case "updated":
                query = query.gte("favorite_count", 50).order("last_updated_at", { ascending: false });
                break;
            case "likeRatio":
                query = query
                    .not("like_count", "is", null)
                    .not("dislike_count", "is", null)
                    .gte("like_count", 5)
                    .order("like_ratio", { ascending: false });
                break;
            case "favoriteRatio":
                query = query.gte("visit_count", 1000).order("visit_count", { ascending: false });
                break;
            case "rating":
            case "reviews":
            case "mylist":
                // これらは後でJSでソート
                query = query.gte("favorite_count", 50);
                break;
            default:
                query = query.order("visit_count", { ascending: false });
        }

        query = query.range(offset, offset + limit - 1);

        const { data: places, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // 評価とレビュー数を付加
        const placesWithStats = places?.map((place) => ({
            ...place,
            average_rating: ratings.get(place.place_id)
                ? ratings.get(place.place_id)!.sum / ratings.get(place.place_id)!.count
                : null,
            review_count: counts.get(place.place_id) || 0,
        }));

        // rating/reviewsの場合はソート
        if (type === "rating") {
            placesWithStats?.sort((a, b) => {
                if ((a.review_count || 0) < 3) return 1;
                if ((b.review_count || 0) < 3) return -1;
                return (b.average_rating || 0) - (a.average_rating || 0);
            });
        } else if (type === "reviews") {
            placesWithStats?.sort((a, b) => (b.review_count || 0) - (a.review_count || 0));
        }

        return NextResponse.json({
            data: placesWithStats,
            page,
            hasMore: places?.length === limit,
        });
    } catch (error) {
        console.error("Ranking API error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
