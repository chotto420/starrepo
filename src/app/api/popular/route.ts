import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// 人気スコア計算関数
function calcPopularity(p: any) {
  const updateFactor = Math.max(
    0,
    1 -
      (Date.now() - new Date(p.last_updated_at).getTime()) /
        (1000 * 60 * 60 * 24 * 180)
  );

  return (
    p.playing * 0.4 +
    Math.log(Math.max(p.visit_count, 1)) * 0.2 +
    p.favorite_count * 0.15 +
    p.like_ratio * 100 * 0.15 +
    updateFactor * 100 * 0.1
  );
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("places")
      .select("*")
      .eq("is_sponsored", false)
      .is("price", null);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error }, { status: 500 });
    }

    const ranked = (data || [])
      .map((p) => ({ ...p, popularity_score: calcPopularity(p) }))
      .sort((a, b) => b.popularity_score - a.popularity_score)
      .slice(0, 100)
      .map((p) => ({
        id: p.universe_id,
        rootPlaceId: p.place_id,
        name: p.name,
        creatorName: p.creator_name,
        thumbnailUrl: p.thumbnail_url,
      }));

    return NextResponse.json({ data: ranked });
  } catch (err) {
    console.error("Fetch error:", err);
    return NextResponse.json(
      { error: "Fetch failed", message: (err as Error).message },
      { status: 500 }
    );
  }
}
