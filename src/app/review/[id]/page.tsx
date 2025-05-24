import ReviewPage from "@/components/ReviewPage";

/** グローバル型名と同じ PageProps をローカル宣言 */
export interface PageProps {
  params: { id: string };
}

/** デフォルト Page コンポーネント */
export default async function Page({ params }: PageProps) {
  const { id } = params;
  return <ReviewPage placeId={id} />;
}
