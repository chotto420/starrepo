"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import RatingStars from "./RatingStars";

function formatCount(count: number | null): string {
  if (count === null || count === undefined) return "-";
  if (count >= 10000) {
    const val = count / 10000;
    return `${val.toFixed(val >= 10 ? 0 : 1).replace(/\.0$/, "")}万`;
  }
  return count.toLocaleString();
}

type Place = {
  place_id: number;
  name: string;
  creator_name: string;
  icon_url: string | null;
  thumbnail_url: string | null;
  visit_count: number | null;
  favorite_count: number | null;
};

interface PlaceWithRating extends Place {
  average_rating: number | null;
  review_count: number;
}

type SortOption = "recent" | "rating" | "visit" | "favorite";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

async function fetchIcon(placeId: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://thumbnails.roblox.com/v1/places/${placeId}/icons?size=256x256&format=Png&isCircular=false`,
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data?.[0]?.imageUrl ?? null;
  } catch {
    return null;
  }
}

export default function PlaceList() {
  const [places, setPlaces] = useState<PlaceWithRating[]>([]);
  const [sort, setSort] = useState<SortOption>("recent");
  const router = useRouter();

  useEffect(() => {
    async function fetchPlaces() {
      const { data, error } = await supabase
        .from("places")
        .select(
          "place_id, name, creator_name, icon_url, thumbnail_url, visit_count, favorite_count",
        )
        .order("last_synced_at", { ascending: false });

      if (error) {
        console.error("❌ Failed to fetch places:", error);
        return;
      }

      const placeData = data || [];
      const withRatings = await Promise.all(
        placeData.map(async (p) => {
          const { data: reviews } = await supabase
            .from("reviews")
            .select("rating")
            .eq("place_id", p.place_id);
          const reviewCount = reviews ? reviews.length : 0;
          const avg =
            reviewCount > 0
              ? reviews!.reduce((sum, r) => sum + r.rating, 0) / reviewCount
              : null;
          let icon = p.icon_url;
          if (!icon) {
            icon = await fetchIcon(p.place_id);
          }
          return {
            ...p,
            icon_url: icon,
            thumbnail_url: p.thumbnail_url,
            average_rating: avg,
            review_count: reviewCount,
          };
        }),
      );

      setPlaces(withRatings);
    }

    fetchPlaces();
  }, []);

  const sortedPlaces = useMemo(() => {
    const arr = [...places];
    switch (sort) {
      case "rating":
        arr.sort((a, b) => (b.average_rating ?? -1) - (a.average_rating ?? -1));
        break;
      case "visit":
        arr.sort((a, b) => (b.visit_count ?? 0) - (a.visit_count ?? 0));
        break;
      case "favorite":
        arr.sort((a, b) => (b.favorite_count ?? 0) - (a.favorite_count ?? 0));
        break;
      default:
        break;
    }
    return arr;
  }, [places, sort]);

  return (
    <>
      <div className="flex justify-end mb-4 text-sm">
        <label className="mr-2" htmlFor="sort-select">
          並び替え:
        </label>
        <select
          id="sort-select"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="border rounded px-2 py-1"
        >
          <option value="recent">更新順</option>
          <option value="rating">評価順</option>
          <option value="visit">訪問数順</option>
          <option value="favorite">お気に入り順</option>
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {sortedPlaces.map((place) => (
        <div
          key={place.place_id}
          onClick={() => router.push(`/place/${place.place_id}`)}
          className="cursor-pointer flex items-center gap-3 rounded-lg shadow hover:shadow-md hover:scale-[1.02] transition transform bg-white dark:bg-gray-800 p-3"
        >
          {place.icon_url ? (
            <img
              src={place.icon_url}
              alt={place.name}
              className="w-16 h-16 object-contain flex-shrink-0"
            />
          ) : (
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 flex-shrink-0">
              画像なし
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold truncate">{place.name}</h2>

            <div className="text-sm text-gray-500 dark:text-gray-400 flex flex-col sm:flex-row gap-1 sm:gap-4 sm:whitespace-nowrap">
              <span>▶ 訪問数 {formatCount(place.visit_count)}</span>
              <span>★ お気に入り {formatCount(place.favorite_count)}</span>
            </div>
            {place.average_rating !== null ? (
              <div className="mt-2 flex items-center gap-1">
                <RatingStars rating={place.average_rating} />
                <span className="text-xs text-gray-600 dark:text-gray-400">({place.review_count}件)</span>
              </div>
            ) : (
              <p className="text-sm mt-2 text-gray-500">評価なし</p>
            )}
          </div>
        </div>
      ))}
    </div>
    </>
  );
}
