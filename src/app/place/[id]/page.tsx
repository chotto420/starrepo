// src/app/place/[id]/page.tsx
"use client";

import { useState } from "react";
import useSWR from "swr";
import { useParams } from "next/navigation";
import Link from "next/link";

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
    <main className="relative p-4 max-w-xl mx-auto">
      <Link
        href="/"
        className="absolute top-4 left-4 bg-gray-200 hover:bg-gray-300 text-sm px-2 py-1 rounded"
      >
        トップへ戻る
      </Link>
      {game && (
        <div className="mt-12 mb-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
          <h2 className="text-2xl font-bold mb-2">{game.name}</h2>
          <img
            src={game.thumbnailUrl}
            alt={game.name}
            className="mt-2 w-full rounded-lg"
          />
          <a
            href={`https://www.roblox.com/games/${placeId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-md transition-colors"
          >
            プレイする
          </a>
        </div>
      )}
      <div className="mb-4">
        <Link
          href={`/review/${placeId}`}
          className="text-blue-600 hover:underline"
        >
          レビューを書く
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="mb-8">
        <label className="block mb-2">
          評価：
          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="ml-2 border px-2 py-1 rounded-md"
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
          className="w-full border p-2 mb-2 rounded-md"
          placeholder="コメントを入力"
        />
        <button
          type="submit"
          className="rounded-md bg-yellow-400 text-black font-semibold px-4 py-2 hover:bg-yellow-500 transition-colors"
        >
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
