// src/app/page.tsx
"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import PlaceList from "@/components/PlaceList";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [placeId, setPlaceId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleRegister = async () => {
    const id = Number(placeId);
    if (!id || !Number.isInteger(id) || id <= 0) {
      setMessage("正しい Place ID を入力してください");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId: id }),
      });
      const json = await res.json();
      if (res.ok) {
        setMessage(json.alreadyExisted ? "すでに登録されています" : "登録しました");
        setPlaceId("");
        (await import("swr")).mutate(null); // refresh swr caches
      } else {
        setMessage(json.error || "登録に失敗しました");
      }
    } catch {
      setMessage("登録に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = async () => {
    const id = Number(placeId);
    if (!id || !Number.isInteger(id) || id <= 0) {
      setMessage("正しい Place ID を入力してください");
      return;
    }
    setMessage(null);
    const { data, error } = await supabase
      .from("places")
      .select("place_id")
      .eq("place_id", id)
      .maybeSingle();
    if (error) {
      setMessage("データベースエラーが発生しました");
      return;
    }
    if (!data) {
      setMessage("指定した Place ID は登録されていません");
      return;
    }
    router.push(`/place/${placeId}`);
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
          プレイスのレビューをみんなで共有しよう！
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
            onClick={handleOpen}
            className="bg-yellow-400 text-black font-semibold px-4 py-2 rounded-none hover:bg-yellow-500 transition-colors"
          >
            開く
          </button>
          <button
            onClick={handleRegister}
            disabled={loading}
            className="bg-green-500 text-white font-semibold px-4 py-2 rounded-none hover:bg-green-600 transition-colors disabled:opacity-50"
          >
            {loading ? "登録中..." : "登録"}
          </button>
        </div>
        {message && <p className="mt-2 text-sm text-red-600">{message}</p>}
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
