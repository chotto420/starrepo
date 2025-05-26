// src/app/popular/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import RatingStars from "../../components/RatingStars";

function formatCount(count: number | null): string {
  if (count === null || count === undefined) return "-";
  if (count >= 10000) {
    const val = count / 10000;
    return `${val.toFixed(val >= 10 ? 0 : 1).replace(/\.0$/, "")}万`;
  }
  return count.toLocaleString();
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Game = {
  place_id: number;
  name: string;
  creator_name: string;
  thumbnail_url: string | null;
  price: number | null;
  visit_count: number | null;
  favorite_count: number | null;
  average_rating: number | null;
};

export default function PopularGames() {
  const [games, setGames] = useState<Game[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function fetchPopularGames() {
      const res = await fetch("/api/popular");
      const json = await res.json();
      const data: Omit<Game, "average_rating">[] = json?.data || [];

      const withRatings = await Promise.all(
        data.map(async (g) => {
          const { data: reviews } = await supabase
            .from("reviews")
            .select("rating")
            .eq("place_id", g.place_id);
          const avg =
            reviews && reviews.length
              ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
              : null;
          return { ...g, average_rating: avg } as Game;
        })
      );

      setGames(withRatings);
    }

    fetchPopularGames();
  }, []);

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-6">🔥 人気のRobloxプレイス</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {games.map((game) => (
          <div
            key={game.place_id}
            onClick={() => router.push(`/place/${game.place_id}`)}
            className="cursor-pointer border rounded-lg shadow hover:shadow-lg transition overflow-hidden"
          >
            {game.thumbnail_url ? (
              <img
                src={game.thumbnail_url}
                alt={game.name}
                className="w-full h-40 object-cover"
              />
            ) : (
              <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400">
                No image
              </div>
            )}
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-1">{game.name}</h2>
              <div className="text-sm text-gray-500 dark:text-gray-400 flex gap-4">
                <span>▶ 訪問 {formatCount(game.visit_count)}</span>
                <span>❤ お気に入り {formatCount(game.favorite_count)}</span>
              </div>
              {game.average_rating !== null ? (
                <div className="mt-2">
                  <RatingStars rating={game.average_rating} />
                </div>
              ) : (
                <p className="text-sm mt-2 text-gray-500">評価なし</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
