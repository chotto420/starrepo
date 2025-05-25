// src/app/popular/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Game = {
  place_id: number;
  name: string;
  creator_name: string;
  thumbnail_url: string | null;
  price: number | null;
};

export default function PopularGames() {
  const [games, setGames] = useState<Game[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function fetchPopularGames() {
      const res = await fetch("/api/popular");
      const json = await res.json();
      const data: Game[] = json?.data || [];

      setGames(data);
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
              <h2 className="text-lg font-semibold">{game.name}</h2>
              <p className="text-sm text-gray-500">{game.creator_name}</p>
              <p className="text-sm mt-1">
                {game.price ? `${game.price} Robux` : "無料"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
