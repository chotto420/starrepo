import { NextResponse } from "next/server";

export async function GET() {
  const url = "https://games.roblox.com/v1/games/list?sortType=1&sortOrder=Desc&limit=30";

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json",
      },
      cache: "no-cache",
    });

    if (!res.ok) {
      const text = await res.text(); // ← レスポンス中身をログ出力
      console.error("Roblox API status:", res.status);
      console.error("Roblox API response:", text);
      return NextResponse.json({ error: "Roblox API failed", status: res.status }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Fetch error:", err); // ← ここも重要
    return NextResponse.json({ error: "Fetch failed", message: (err as Error).message }, { status: 500 });
  }
}
