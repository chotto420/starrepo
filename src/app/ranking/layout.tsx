import { Metadata } from "next";

const BASE_URL = "https://starrepo.net";

export const metadata: Metadata = {
    title: "Roblox ゲームランキング",
    description: "Robloxの人気ゲームランキングをチェック！総訪問数、プレイ中人数、お気に入り数、急上昇、高評価などのランキングで今話題のRobloxゲームを発見しよう。",
    keywords: [
        "Roblox ランキング", "ロブロックス 人気ゲーム", "Roblox 人気",
        "Roblox おすすめ", "Roblox トレンド", "ロブロックス ランキング"
    ],
    openGraph: {
        title: "Roblox ゲームランキング | StarRepo",
        description: "Robloxの人気ゲームランキングをチェック！今話題のRobloxゲームを発見しよう。",
        url: `${BASE_URL}/ranking`,
        type: "website",
    },
    alternates: {
        canonical: `${BASE_URL}/ranking`,
    },
};

export default function RankingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
