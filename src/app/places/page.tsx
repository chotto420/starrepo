// src/app/places/page.tsx
"use client";

import PlaceList from "@/components/PlaceList";

export default function PlacesPage() {
  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-6">🎮 プレイス一覧</h1>
      <PlaceList />
    </main>
  );
}
