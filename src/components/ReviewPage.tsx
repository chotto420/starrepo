"use client";

import { useState } from "react";
import Link from "next/link";

export type ReviewPageProps = {
  placeId: number;
  title: string;
  thumbnailUrl: string;
  likeCount: number;
  visitCount: number;
  rating?: number;
};

export default function ReviewPage({ placeId }: ReviewPageProps) {
  const [comment, setComment] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("submit review", { placeId, comment });
    setComment("");
  };

  return (
    <main className="relative max-w-xl mx-auto p-4 pt-16">
      <Link
        href="/"
        className="absolute top-4 left-4 bg-gray-200 hover:bg-gray-300 text-sm px-2 py-1 rounded"
      >
        一覧へ戻る
      </Link>

      <a
        href={`https://www.roblox.com/games/${placeId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mb-6 block bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-md transition-colors text-center"
      >
        プレイする
      </a>

      {/* レビュー投稿 */}
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
