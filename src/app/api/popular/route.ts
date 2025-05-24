import { NextResponse } from "next/server";

export async function GET() {
  const url =
    "https://games.roblox.com/v1/games/list?sortType=1&sortOrder=Desc&limit=30";

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json",
      },
      cache: "no-cache",
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Roblox API status:", res.status);
      console.error("Roblox API response:", text);
      return NextResponse.json(
        { error: "Roblox API failed", status: res.status },
        { status: 500 }
      );
    }

    const data = (await res.json()) as unknown; // ← 型を付けるならここ
    return NextResponse.json(data);
  } catch (err: unknown) {                      // ★ ここを unknown に
    console.error("Fetch error:", err);
    const message =
      err instanceof Error ? err.message : "unknown error";
    return NextResponse.json(
      { error: "Fetch failed", message },
      { status: 500 }
    );
  }
}
