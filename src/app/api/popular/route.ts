import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
export async function GET() {
  const { data, error } = await supabase
    .from("places")
    .select(
      "place_id, name, creator_name, thumbnail_url, price, playing"
    )
    .order("playing", { ascending: false })
    .limit(30);

  if (error) {
    console.error("Supabase error:", error);
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ data });
}
