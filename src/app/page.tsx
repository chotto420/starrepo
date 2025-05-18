// src/app/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const [placeId, setPlaceId] = useState("");
  const router = useRouter();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white p-4">
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
    </main>
  );
}
