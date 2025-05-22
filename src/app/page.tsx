// src/app/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const [placeId, setPlaceId] = useState("");
  const router = useRouter();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 text-center space-y-6">
      <h1 className="text-5xl font-bold">
        <span className="text-yellow-300">★</span> STAR REPO
      </h1>
      <p className="text-gray-200">Roblox プレイスのレビューをみんなで共有しよう！</p>
      <div className="flex overflow-hidden rounded-lg shadow-lg bg-white text-black">
        <input
          type="text"
          value={placeId}
          onChange={(e) => setPlaceId(e.target.value)}
          placeholder="Place ID を入力"
          className="px-3 py-2 focus:outline-none"
        />
        <button
          onClick={() => router.push(`/place/${placeId}`)}
          className="bg-yellow-400 px-4 py-2 font-semibold hover:bg-yellow-500 transition"
        >
          開く
        </button>
      </div>
    </main>
  );
}
