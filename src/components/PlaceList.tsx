"use client";

import { useEffect, useState } from "react";
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
}

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
          const avg =
            reviews && reviews.length
              ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
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
          };
        }),
      );

      setPlaces(withRatings);
    }

    fetchPlaces();
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {places.map((place) => (
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

            <div className="text-sm text-gray-500 dark:text-gray-400 flex gap-4 flex-wrap">
              <span>▶ 訪問 {formatCount(place.visit_count)}</span>
              <span>❤ お気に入り {formatCount(place.favorite_count)}</span>
            </div>
            {place.average_rating !== null ? (
              <div className="mt-2">
                <RatingStars rating={place.average_rating} />
              </div>
            ) : (
              <p className="text-sm mt-2 text-gray-500">評価なし</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
