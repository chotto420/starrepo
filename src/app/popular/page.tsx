// src/app/popular/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Game = {
  id: number;
  rootPlaceId: number;
  name: string;
  creatorName: string;
  thumbnailUrl: string;
};

export default function PopularGames() {
  const [games, setGames] = useState<Game[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function fetchPopularGames() {
      const res = await fetch("/api/popular");
      const json = await res.json();
      const data = json?.data || [];

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
            key={game.id}
            onClick={() => router.push(`/place/${game.rootPlaceId}`)}
            className="cursor-pointer border rounded-lg shadow hover:shadow-lg transition overflow-hidden"
          >
            <img
              src={game.thumbnailUrl}
              alt={game.name}
              className="w-full h-40 object-cover"
            />
            <div className="p-4">
              <h2 className="text-lg font-semibold">{game.name}</h2>
              <p className="text-sm text-gray-500">{game.creatorName}</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
