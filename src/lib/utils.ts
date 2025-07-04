export function formatCount(count: number | null | undefined): string {
  if (count == null) return "-";
  if (count >= 10000) {
    const val = count / 10000;
    return `${val.toFixed(val >= 10 ? 0 : 1).replace(/\.0$/, "")}万`;
  }
  return count.toLocaleString();
}

export async function fetchIcon(placeId: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://thumbnails.roblox.com/v1/places/${placeId}/icons?size=256x256&format=Png&isCircular=false`
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data?.[0]?.imageUrl ?? null;
  } catch {
    return null;
  }
}
