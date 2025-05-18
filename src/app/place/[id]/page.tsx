// src/app/place/[id]/page.tsx
"use client";

import { useState } from "react";
import useSWR from "swr";
import { useParams } from "next/navigation";

// API 呼び出しヘルパ
const fetcher = (url: string) => fetch(url).then((res) => res.json());

async function getPlaceInfo(placeId: number) {
  // Place ID から Universe ID を取得
  const uRes = await fetch(
    `https://apis.roblox.com/universes/v1/places/${placeId}/universe`
  );
  const { universeId } = await uRes.json();
  // Universe ID からゲーム情報を取得
  const gRes = await fetch(
    `https://games.roblox.com/v1/games?universeIds=${universeId}`
  );
  const { data } = await gRes.json();
  return data[0];
}

export default function PlacePage() {
  // params を useParams フックで取得
  const { id } = useParams() as { id: string };
  const placeId = Number(id);

  // ゲーム情報とレビュー一覧を取得
  const { data: game } = useSWR(["game", placeId], () =>
    getPlaceInfo(placeId)
  );
  const { data: reviews } = useSWR(
    `/api/reviews?placeId=${placeId}`,
    fetcher
  );

  // 投稿フォーム用ステート
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeId, rating, comment }),
    });
    setComment("");
    // キャッシュをクリアして再取得
    (await import("swr")).mutate(`/api/reviews?placeId=${placeId}`);
  };

  return (
    <main className="p-4 max-w-xl mx-auto">
      {/* ゲーム情報 */}
      {game && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold">{game.name}</h2>
          <img
            src={game.thumbnailUrl}
            alt={game.name}
            className="mt-2 w-full rounded"
          />
        </div>
      )}

      {/* 投稿フォーム */}
      <form onSubmit={handleSubmit} className="mb-8">
        <label className="block mb-2">
          評価：
          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="ml-2 border px-2 py-1"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}★
              </option>
            ))}
          </select>
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="w-full border p-2 mb-2"
          placeholder="コメントを入力"
        />
        <button type="submit" className="rounded bg-yellow-400 px-4 py-2">
          投稿する
        </button>
      </form>

      {/* レビュー一覧 */}
      <section>
        <h3 className="text-lg font-semibold mb-2">レビュー一覧</h3>
        {reviews?.data?.length ? (
          reviews.data.map((r: any) => (
            <div key={r.id} className="mb-4 border-b pb-2">
              <div>{r.rating}★</div>
              <p>{r.comment}</p>
              <small className="text-gray-500">
                {new Date(r.created_at).toLocaleString()}
              </small>
            </div>
          ))
        ) : (
          <p>まだレビューがありません。</p>
        )}
      </section>
    </main>
  );
}
