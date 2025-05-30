// src/app/api/reviews/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const placeIdParam = req.nextUrl.searchParams.get("placeId");
  const placeId = placeIdParam ? Number(placeIdParam) : null;
  if (!placeId) {
    return NextResponse.json({ error: "placeId は必須です" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("place_id", placeId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { placeId, rating, comment } = body as {
    placeId?: number;
    rating?: number;
    comment?: string;
  };

  if (!placeId || !rating) {
    return NextResponse.json({ error: "placeId と評価は必須です" }, { status: 400 });
  }

  const { error } = await supabase.from("reviews").insert({
    place_id: placeId,
    rating,
    comment,
  });

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
