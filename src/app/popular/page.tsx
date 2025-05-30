// src/app/popular/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
async function fetchIcon(placeId: number): Promise<string | null> {
  try {
    const res = await fetch(`https://thumbnails.roblox.com/v1/places/${placeId}/icons?size=256x256&format=Png&isCircular=false`);
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data?.[0]?.imageUrl ?? null;
  } catch {
    return null;
  }
}


type Game = {
  place_id: number;
  name: string;
  creator_name: string;
  icon_url: string | null;
  thumbnail_url: string | null;
  price: number | null;
  visit_count: number | null;
  favorite_count: number | null;
};

interface GameWithRating extends Game {
  average_rating: number | null;
  review_count: number;
}

export default function PopularGames() {
  const [games, setGames] = useState<GameWithRating[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function fetchPopularGames() {
      const res = await fetch("/api/popular");
      const json = await res.json();
      const data: Game[] = json?.data || [];

      const withRatings = await Promise.all(
        data.map(async (g) => {
          const { data: reviews } = await supabase
            .from("reviews")
            .select("rating")
            .eq("place_id", g.place_id);
          const reviewCount = reviews ? reviews.length : 0;
          const avg =
            reviewCount > 0
              ? reviews!.reduce((sum, r) => sum + r.rating, 0) / reviewCount
              : null;
          let icon = g.icon_url;
          if (!icon) {
            icon = await fetchIcon(g.place_id);
          }
          return {
            ...g,
            icon_url: icon,
            average_rating: avg,
            review_count: reviewCount,
          } as GameWithRating;
        })
      );

      setGames(withRatings);
    }

    fetchPopularGames();
  }, []);

  return (
    <main className="min-h-screen p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">🔥 人気のRobloxプレイス</h1>
        <Link
          href="/"
          className="text-blue-600 hover:underline text-sm"
        >
          トップへ戻る
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {games.map((game) => (
          <div
            key={game.place_id}
            onClick={() => router.push(`/place/${game.place_id}`)}
            className="cursor-pointer flex items-center gap-3 rounded-lg shadow hover:shadow-md hover:scale-[1.02] transition transform bg-white dark:bg-gray-800 p-3"
          >
            {game.icon_url ? (
              <img
                src={game.icon_url}
                alt={game.name}
                className="w-16 h-16 object-contain flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 flex-shrink-0">
                画像なし
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold truncate">{game.name}</h2>

              <div className="text-sm text-gray-500 dark:text-gray-400 flex flex-col sm:flex-row gap-1 sm:gap-4 sm:whitespace-nowrap">
                <span>▶ 訪問数 {formatCount(game.visit_count)}</span>
                <span>★ お気に入り {formatCount(game.favorite_count)}</span>
              </div>
              {game.average_rating !== null ? (
                <div className="mt-2 flex items-center gap-1">
                  <RatingStars rating={game.average_rating} />
                  <span className="text-xs text-gray-600 dark:text-gray-400">({game.review_count}件)</span>
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
