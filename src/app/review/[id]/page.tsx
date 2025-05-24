import ReviewPage from '@/components/ReviewPage';

/** ルートコンポーネント */
export default async function Page(
  { params }: { params: Promise<{ id: string }> }      // ★Promise 型にする
) {
  const { id } = await params;                         // ★await で展開
  return <ReviewPage placeId={id} />;
}
