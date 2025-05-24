// src/app/page.tsx
"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import PlaceList from "@/components/PlaceList";

export default function Home() {
  const [placeId, setPlaceId] = useState("");
  const router = useRouter();

  return (
    <main className="min-h-screen p-4">
      <div className="flex flex-col items-center mb-8">
        <h1 className="text-5xl font-extrabold mb-4 flex items-center gap-2">
          <span className="text-yellow-400 text-5xl">★</span>
          <span className="bg-gradient-to-r from-yellow-300 via-red-400 to-purple-500 bg-clip-text text-transparent">
            STAR REPO
          </span>
        </h1>
        <p className="text-gray-600 mb-6">
          Roblox プレイスのレビューをみんなで共有しよう！
        </p>
        <div className="flex items-center shadow-md rounded-lg overflow-hidden">
          <input
            type="text"
            value={placeId}
            onChange={(e) => setPlaceId(e.target.value)}
            placeholder="Place ID を入力"
            className="border px-3 py-2 focus:outline-none flex-1 rounded-none focus:ring-2 focus:ring-yellow-400"
          />
          <button
            onClick={() => router.push(`/place/${placeId}`)}
            className="bg-yellow-400 text-black font-semibold px-4 py-2 rounded-none hover:bg-yellow-500 transition-colors"
          >
            開く
          </button>
        </div>
        <Link
          href="/popular"
          className="mt-4 text-blue-600 hover:underline"
        >
          人気プレイスを見る
        </Link>
      </div>

      <section>
        <h2 className="text-3xl font-bold mb-6">🎮 プレイス一覧</h2>
        <PlaceList />
      </section>
    </main>
  );
}
