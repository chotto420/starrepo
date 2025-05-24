// src/app/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import PlaceList from "@/components/PlaceList";

export default function Home() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = async () => {
    if (!query.trim()) return;
    try {
      const res = await fetch(
        `/api/search?name=${encodeURIComponent(query.trim())}`
      );
      const json = await res.json();
      const first = json?.data?.[0];
      if (first) {
        router.push(`/place/${first.place_id}`);
      } else {
        window.alert("見つかりませんでした");
      }
    } catch (err) {
      console.error("Search failed", err);
      window.alert("検索に失敗しました");
    }
  };

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
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ゲーム名で検索"
            className="border px-3 py-2 focus:outline-none flex-1 rounded-none focus:ring-2 focus:ring-yellow-400"
          />
          <button
            onClick={handleSearch}
            className="bg-yellow-400 text-black font-semibold px-4 py-2 rounded-none hover:bg-yellow-500 transition-colors"
          >
            検索
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
