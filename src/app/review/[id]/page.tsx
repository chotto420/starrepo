import ReviewPage from "@/components/ReviewPage";

/** ルートコンポーネント。型はインラインで渡す */
export default async function Page({
  params,
}: {
  params: { id: string };
}) {
  return <ReviewPage placeId={params.id} />;
}
