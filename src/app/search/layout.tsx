import { Metadata } from "next";

const BASE_URL = "https://starrepo.net";

export const metadata: Metadata = {
    title: "ゲーム検索",
    description: "キーワードでRobloxゲームを検索！ゲーム名や作者名で検索して、評価順やプレイ数順で絞り込めます。お気に入りのRobloxゲームを見つけよう。",
    keywords: [
        "Roblox 検索", "ロブロックス ゲーム検索", "Roblox ゲーム 探す",
        "Roblox 作者 検索", "ロブロックス おすすめ 探す"
    ],
    openGraph: {
        title: "ゲーム検索 | StarRepo",
        description: "キーワードでRobloxゲームを検索！お気に入りのRobloxゲームを見つけよう。",
        url: `${BASE_URL}/search`,
        type: "website",
    },
    alternates: {
        canonical: `${BASE_URL}/search`,
    },
};

export default function SearchLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
