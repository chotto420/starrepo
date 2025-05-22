// src/app/places/page.tsx
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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function PlacesPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function fetchPlaces() {
      const { data, error } = await supabase
        .from("places")
        .select("place_id, name, creator_name, thumbnail_url")
        .order("last_synced_at", { ascending: false });

      if (error) {
        console.error("❌ Failed to fetch places:", error);
      } else {
        setPlaces(data || []);
      }
    }

    fetchPlaces();
  }, []);

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">🎮 プレイス一覧</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {places.map((place) => (
          <div
            key={place.place_id}
            onClick={() => router.push(`/place/${place.place_id}`)}
            className="cursor-pointer border border-white/20 rounded-lg shadow-lg hover:shadow-xl transition overflow-hidden bg-white/10 backdrop-blur"
          >
            {place.thumbnail_url ? (
              <img
                src={place.thumbnail_url}
                alt={place.name}
                className="w-full h-40 object-cover"
              />
            ) : (
              <div className="w-full h-40 bg-white/10 flex items-center justify-center text-gray-300">
                No image
              </div>
            )}
            <div className="p-4">
              <h2 className="text-lg font-semibold">{place.name}</h2>
              <p className="text-sm text-gray-300">{place.creator_name}</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
