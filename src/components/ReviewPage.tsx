"use client";

import { useState } from "react";
import RatingStars from "./RatingStars";

export type ReviewPageProps = {
  placeId: number;
  title: string;
  thumbnailUrl: string;
  likeCount: number;
  visitCount: number;
  rating?: number; // StarRepo独自評価
};

export default function ReviewPage({
  placeId,
  title,
  thumbnailUrl,
  likeCount,
  visitCount,
  rating,
}: ReviewPageProps) {
  const [comment, setComment] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 投稿処理はアプリ側で実装してください
    console.log("submit review", { placeId, comment });
    setComment("");
  };

  return (
    <main className="relative max-w-xl mx-auto p-4">
      <a
        href="/places"
        className="absolute top-4 left-4 bg-gray-200 hover:bg-gray-300 text-sm px-2 py-1 rounded"
      >
        一覧へ戻る
      </a>
      <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
        <h1 className="text-2xl font-bold mb-2">{title}</h1>
        <img
          src={thumbnailUrl}
          alt={title}
          className="w-full rounded-lg mb-2"
        />
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
          <span>👍 {likeCount}</span>
          <span>▶️ {visitCount}</span>
          {rating !== undefined && (
            <span className="flex items-center">
              <RatingStars rating={rating} />
            </span>
          )}
        </div>
        <a
          href={`https://www.roblox.com/games/${placeId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-md transition-colors"
        >
          プレイする
        </a>
      </div>

      <form onSubmit={handleSubmit} className="pt-4">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          className="w-full border p-2 rounded-md mb-20"
          placeholder="レビューを入力..."
        />
        <button
          type="submit"
          className="fixed bottom-4 right-4 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-6 py-2 rounded-md shadow-md"
        >
          投稿する
        </button>
      </form>
    </main>
  );
}
