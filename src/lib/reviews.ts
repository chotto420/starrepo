import { supabase } from './supabase';

export async function getAverageRating(placeId: number): Promise<number | null> {
  const { data, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('place_id', placeId);

  if (error) {
    console.error('Failed to fetch ratings', error);
    return null;
  }

  if (!data || data.length === 0) return null;
  const sum = data.reduce((acc, cur) => acc + cur.rating, 0);
  return sum / data.length;
}
