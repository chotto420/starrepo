import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ToastContainer from "@/components/ToastContainer";
import PWARegister from "@/components/PWARegister";

const inter = Inter({ subsets: ["latin"] });

const BASE_URL = "https://starrepo.net";

export const metadata: Metadata = {
    metadataBase: new URL(BASE_URL),
    title: {
        default: "StarRepo - Roblox ゲームレビューサイト",
        template: "%s | StarRepo",
    },
    description: "面白いRobloxゲームをみんなで見つけよう。Place IDでゲームを登録してレビューを投稿できます。人気ランキング、ジャンル別検索、ユーザーレビューで最高のRobloxゲームを発見。",
    keywords: [
        "Roblox", "ロブロックス", "ゲームレビュー", "おすすめゲーム",
        "Roblox レビュー", "Roblox ランキング", "Roblox おすすめ",
        "ロブロックス ゲーム おすすめ", "Roblox 人気ゲーム",
        "ロブロックス レビュー", "Roblox 日本語", "Roblox 神ゲー",
        "ロブロックス 面白いゲーム", "Roblox ゲーム 探し方"
    ],
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
                alt: "StarRepo - Roblox ゲームレビューサイト",
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

// 構造化データ（JSON-LD）
const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "StarRepo",
    alternateName: "スターレポ",
    url: BASE_URL,
    description: "面白いRobloxゲームをみんなで見つけよう。Place IDでゲームを登録してレビューを投稿できます。",
    inLanguage: "ja",
    potentialAction: {
        "@type": "SearchAction",
        target: {
            "@type": "EntryPoint",
            urlTemplate: `${BASE_URL}/search?q={search_term_string}`
        },
        "query-input": "required name=search_term_string"
    }
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ja" suppressHydrationWarning>
            <head>
                <meta name="google-site-verification" content="plM2OZGGyTWcPYCRS1Otv1rJSCmK53FJ623mRvj1mcA" />
                <link rel="manifest" href="/manifest.json" />
                <meta name="theme-color" content="#0B0E14" />
                <link rel="apple-touch-icon" href="/images/logo/logo_icon.png" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            </head>
            <body className={inter.className} suppressHydrationWarning={true}>
                <PWARegister />
                <Header />
                <ToastContainer />
                {children}
                <Footer />
            </body>
        </html>
    );
}
