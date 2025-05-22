// src/app/place/[id]/page.tsx
"use client";

import { useState } from "react";
import useSWR from "swr";
import { useParams } from "next/navigation";

type Review = {
  id: number;
  place_id: number;
  rating: number;
  comment: string;
  created_at: string;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

async function getPlaceInfo(placeId: number) {
  const uRes = await fetch(
    `https://apis.roblox.com/universes/v1/places/${placeId}/universe`
  );
  const { universeId } = await uRes.json();
  const gRes = await fetch(
    `https://games.roblox.com/v1/games?universeIds=${universeId}`
  );
  const { data } = await gRes.json();
  return data[0];
}

export default function PlacePage() {
  const { id } = useParams() as { id: string };
  const placeId = Number(id);

  const { data: game } = useSWR(["game", placeId], () =>
    getPlaceInfo(placeId)
  );
  const { data: reviews } = useSWR<{ data: Review[] }>(
    `/api/reviews?placeId=${placeId}`,
    fetcher
  );

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
    (await import("swr")).mutate(`/api/reviews?placeId=${placeId}`);
  };

  return (
    <main className="p-6 max-w-xl mx-auto space-y-8 bg-white/10 backdrop-blur rounded-xl shadow-lg">
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block mb-2">
          評価：
          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="ml-2 border border-gray-300 rounded bg-white/80 px-2 py-1 text-black"
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
          className="w-full border border-gray-300 p-2 rounded bg-white/80 text-black"
          placeholder="コメントを入力"
        />
        <button type="submit" className="rounded bg-yellow-400 text-black font-semibold px-4 py-2 hover:bg-yellow-500 transition">
          投稿する
        </button>
      </form>

      <section>
        <h3 className="text-lg font-semibold mb-2">レビュー一覧</h3>
        {reviews?.data?.length ? (
          reviews.data.map((r) => (
            <div key={r.id} className="mb-4 border-b pb-2">
              <div>{r.rating}★</div>
              <p>{r.comment}</p>
              <small className="text-gray-300">
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
