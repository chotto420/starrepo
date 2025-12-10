import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ToastContainer from "@/components/ToastContainer";

const inter = Inter({ subsets: ["latin"] });

const BASE_URL = "https://starrepo.net";

export const metadata: Metadata = {
    metadataBase: new URL(BASE_URL),
    title: {
        default: "StarRepo - Roblox ゲームレビューサイト",
        template: "%s | StarRepo",
    },
    description: "面白いRobloxゲームをみんなで見つけよう。Place IDでゲームを登録してレビューを投稿できます。",
    keywords: ["Roblox", "ロブロックス", "ゲームレビュー", "おすすめゲーム", "Roblox レビュー", "Roblox ランキング"],
    authors: [{ name: "StarRepo" }],
    openGraph: {
        type: "website",
        locale: "ja_JP",
        url: BASE_URL,
        siteName: "StarRepo",
        title: "StarRepo - Roblox ゲームレビューサイト",
        description: "面白いRobloxゲームをみんなで見つけよう。",
        images: [
            {
                url: "/og-image.png",
                width: 1200,
                height: 630,
                alt: "StarRepo",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "StarRepo - Roblox ゲームレビューサイト",
        description: "面白いRobloxゲームをみんなで見つけよう。",
        images: ["/og-image.png"],
    },
    robots: {
        index: true,
        follow: true,
    },
    icons: {
        icon: "/images/logo/logo_icon_transparent.png",
        apple: "/images/logo/logo_icon_transparent.png",
    },
    alternates: {
        canonical: BASE_URL,
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ja" suppressHydrationWarning>
            <body className={inter.className} suppressHydrationWarning={true}>
                <Header />
                <ToastContainer />
                {children}
                <Footer />
            </body>
        </html>
    );
}
