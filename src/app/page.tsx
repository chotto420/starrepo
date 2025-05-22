// src/app/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import PlaceList from "@/components/PlaceList";

export default function Home() {
  const [placeId, setPlaceId] = useState("");
  const router = useRouter();

  return (
    <main className="min-h-screen p-4">
      <div className="flex flex-col items-center mb-8">
        <h1 className="text-4xl font-bold mb-4">
          <span className="text-yellow-400">★</span> STAR REPO
        </h1>
        <p className="text-gray-600 mb-6">
          Roblox プレイスのレビューをみんなで共有しよう！
        </p>
        <div className="flex items-center">
          <input
            type="text"
            value={placeId}
            onChange={(e) => setPlaceId(e.target.value)}
            placeholder="Place ID を入力"
            className="border px-3 py-2 rounded-l-md focus:outline-none"
          />
          <button
            onClick={() => router.push(`/place/${placeId}`)}
            className="bg-yellow-400 px-4 py-2 rounded-r-md hover:bg-yellow-500 transition"
          >
            開く
          </button>
        </div>
      </div>

      <section>
        <h2 className="text-3xl font-bold mb-6">🎮 プレイス一覧</h2>
        <PlaceList />
      </section>
    </main>
  );
}
