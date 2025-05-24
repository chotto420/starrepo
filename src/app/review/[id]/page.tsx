import ReviewPage from "@/components/ReviewPage";

/** ページの props は params のみ */
export type ReviewPageProps = {
  params: { id: string };
};

/** デフォルトページコンポーネント */
export default async function Page({ params }: ReviewPageProps) {
  const { id } = params;
  return <ReviewPage placeId={id} />;
}

/** 追加の Next.js 関連関数が必要ならここで定義
export async function generateStaticParams() { ... }
*/
