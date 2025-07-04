import { supabase } from "./supabase";

export async function fetchReviewStats(placeId: number): Promise<{
  average: number | null;
  count: number;
}> {
  const { data: reviews } = await supabase
    .from("reviews")
    .select("rating")
    .eq("place_id", placeId);

  const reviewCount = reviews ? reviews.length : 0;
  const avg =
    reviewCount > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : null;

  return { average: avg, count: reviewCount };
}
