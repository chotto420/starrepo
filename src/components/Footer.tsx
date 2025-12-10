import Link from "next/link";
import { Star } from "lucide-react";

export default function Footer() {
    return (
        <footer className="bg-[#080A0E] border-t border-slate-800">
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Main Footer Content */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-6">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <div className="relative w-8 h-8">
                            <img
                                src="/images/logo/logo_icon_transparent.png"
                                alt="Logo"
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <span className="text-lg font-bold text-white">
                            STAR REPO
                        </span>
                    </div>

                    {/* Legal Links */}
                    <nav className="flex flex-wrap gap-4 md:gap-6 text-sm">
                        <Link
                            href="/terms"
                            className="text-slate-400 hover:text-white transition-colors"
                        >
                            利用規約
                        </Link>
                        <Link
                            href="/privacy"
                            className="text-slate-400 hover:text-white transition-colors"
                        >
                            プライバシーポリシー
                        </Link>
                        <Link
                            href="/disclaimer"
                            className="text-slate-400 hover:text-white transition-colors"
                        >
                            免責事項
                        </Link>
                        <Link
                            href="/contact"
                            className="text-slate-400 hover:text-white transition-colors"
                        >
                            お問い合わせ
                        </Link>
                    </nav>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-800 pt-6">
                    {/* Disclaimer */}
                    <p className="text-xs text-slate-500 leading-relaxed mb-4">
                        本サービスはRoblox Corporationとは一切関係のない非公式のファンサイトです。
                        Roblox®、Robloxロゴ、およびPowering Imagination™はRoblox Corporationの登録商標または商標です。
                    </p>

                    {/* Copyright */}
                    <p className="text-xs text-slate-600">
                        © {new Date().getFullYear()} StarRepo. Not affiliated with Roblox Corporation.
                    </p>
                </div>
            </div>
        </footer>
    );
}
