import { Metadata } from "next";

const BASE_URL = "https://starrepo.net";

export const metadata: Metadata = {
    title: "ジャンルから探す",
    description: "ジャンル別でRobloxゲームを探そう！アドベンチャー、RPG、FPS、ホラー、シミュレーションなど様々なジャンルのRobloxゲームを見つけよう。",
    keywords: [
        "Roblox ジャンル", "ロブロックス ゲーム 種類", "Roblox カテゴリ",
        "Roblox アドベンチャー", "Roblox ホラー", "Roblox RPG"
    ],
    openGraph: {
        title: "ジャンルから探す | StarRepo",
        description: "ジャンル別でRobloxゲームを探そう！様々なジャンルのRobloxゲームを見つけよう。",
        url: `${BASE_URL}/genre`,
        type: "website",
    },
    alternates: {
        canonical: `${BASE_URL}/genre`,
    },
};

export default function GenreLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
