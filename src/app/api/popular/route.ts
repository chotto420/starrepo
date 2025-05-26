import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * 計算式に基づきスコアを算出し、上位30プレイスを返す
 */
export async function GET() {
  // 全レコードからスコア算出に必要な列を取得
  const { data: rows, error } = await supabase
    .from("places")
    .select(
      "place_id, name, creator_name, thumbnail_url, price, playing, like_ratio, visit_count, favorite_count, last_updated_at"
    );

  if (error || !rows) {
    console.error("Supabase error:", error);
    return NextResponse.json({ error }, { status: 500 });
  }

  // 正規化用の最大値を求める
  const pmax = Math.max(...rows.map((r) => r.playing ?? 0), 1);
  const vmax = Math.max(...rows.map((r) => r.visit_count ?? 0), 1);
  const fmax = Math.max(...rows.map((r) => r.favorite_count ?? 0), 1);

  const now = Date.now();

  // スコア計算
  const scored = rows.map((r) => {
    const days = r.last_updated_at
      ? (now - new Date(r.last_updated_at).getTime()) / (1000 * 60 * 60 * 24)
      : Number.MAX_VALUE;

    const freshness = Math.exp(-days / 30); // 30日で減衰する単純な関数

    const score =
      0.35 * Math.log1p(r.playing ?? 0) / Math.log1p(pmax) +
      0.2 * (r.like_ratio ?? 0) +
      0.15 * Math.log1p(r.visit_count ?? 0) / Math.log1p(vmax) +
      0.15 * Math.log1p(r.favorite_count ?? 0) / Math.log1p(fmax) +
      0.15 * freshness;

    return { ...r, score };
  });

  // スコア順に並べ替え、上位30件だけを返す
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 30);

  // フロントで利用していた列のみ返却
  const data = top.map(
    ({
      place_id,
      name,
      creator_name,
      thumbnail_url,
      price,
      visit_count,
      favorite_count,
    }) => ({
      place_id,
      name,
      creator_name,
      thumbnail_url,
      price,
      visit_count,
      favorite_count,
    })
  );

  return NextResponse.json({ data });
}
