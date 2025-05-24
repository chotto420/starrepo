// src/app/review/[id]/page.tsx
import ReviewPage from '@/components/ReviewPage';
import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function Page(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const placeId = Number(id);
  if (Number.isNaN(placeId)) notFound();

  // ▼ Supabase から詳細取得
  const { data: place } = await supabase
    .from('places')
    .select('*')
    .eq('place_id', placeId)
    .single();

  if (!place) notFound();

  return (
    <ReviewPage
      placeId={place.place_id}
      title={place.name}
      thumbnailUrl={place.thumbnail_url}
      likeCount={place.like_count}
      visitCount={place.visit_count}
    />
  );
}
