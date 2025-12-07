import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ToastContainer from "@/components/ToastContainer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "StarRepo - Roblox Game Discovery",
    description: "Discover hidden gems in Roblox.",
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
