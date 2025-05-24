import ReviewPage from '@/components/ReviewPage';
import { notFound } from 'next/navigation';   // 無効 ID 対策 (任意)

/** ルートコンポーネント */
export default async function Page(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;          // URL からは string
  const placeId = Number(id);           // 数値へ変換

  if (Number.isNaN(placeId)) {          // 文字列などが来た場合
    notFound();                         // 404 を返す / リダイレクト etc.
  }

  return <ReviewPage placeId={placeId} />;
}
