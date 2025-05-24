"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import RatingStars from "./RatingStars";

type Place = {
  place_id: number;
  name: string;
  creator_name: string;
  thumbnail_url: string | null;
  visit_count: number | null;
  favorite_count: number | null;
};

interface PlaceWithRating extends Place {
  average_rating: number | null;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function fetchThumbnail(placeId: number): Promise<string | null> {
  try {
    const res = await fetch(`https://thumbnails.roblox.com/v1/places/${placeId}/icons?size=256x256&format=Png&isCircular=false`);
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
          "place_id, name, creator_name, thumbnail_url, visit_count, favorite_count"
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
          let thumb = p.thumbnail_url;
          if (!thumb) {
            thumb = await fetchThumbnail(p.place_id);
          }
          return { ...p, thumbnail_url: thumb, average_rating: avg };
        })
      );

      setPlaces(withRatings);
    }

    fetchPlaces();
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {places.map((place) => (
        <div
          key={place.place_id}
          onClick={() => router.push(`/place/${place.place_id}`)}
          className="cursor-pointer rounded-xl overflow-hidden shadow-lg hover:shadow-xl hover:scale-[1.02] transition transform bg-white dark:bg-gray-800"
        >
          {place.thumbnail_url ? (
            <img
              src={place.thumbnail_url}
              alt={place.name}
              className="w-full h-48 object-cover"
            />
          ) : (
            <div className="w-full h-48 bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400">
              No image
            </div>
          )}
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-1">{place.name}</h2>
            <div className="text-sm text-gray-500 dark:text-gray-400 flex gap-2">
              <span>▶️ {place.visit_count}</span>
              <span>❤ {place.favorite_count}</span>
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
