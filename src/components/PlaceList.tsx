"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

type Place = {
  place_id: number;
  name: string;
  creator_name: string;
  thumbnail_url: string | null;
};

interface PlaceWithRating extends Place {
  average_rating: number | null;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function PlaceList() {
  const [places, setPlaces] = useState<PlaceWithRating[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function fetchPlaces() {
      const { data, error } = await supabase
        .from("places")
        .select("place_id, name, creator_name, thumbnail_url")
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
          return { ...p, average_rating: avg };
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
          className="cursor-pointer border rounded-lg shadow hover:shadow-lg transition overflow-hidden bg-white"
        >
          {place.thumbnail_url ? (
            <img
              src={place.thumbnail_url}
              alt={place.name}
              className="w-full h-40 object-cover"
            />
          ) : (
            <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400">
              No image
            </div>
          )}
          <div className="p-4">
            <h2 className="text-lg font-semibold">{place.name}</h2>
            <p className="text-sm text-gray-500">{place.creator_name}</p>
            {place.average_rating !== null && (
              <p className="text-sm mt-1">
                平均評価: {place.average_rating.toFixed(1)}★
              </p>
            )}
            <a
              href={`https://www.roblox.com/games/${place.place_id}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-blue-600 underline text-sm mt-1 inline-block"
            >
              ゲームへ
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
