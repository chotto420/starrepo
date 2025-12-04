"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Header() {
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<{ avatar_url: string | null } | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const supabase = createClient();

        async function checkAuth() {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            // ユーザーがいる場合はプロフィールを取得
            if (user) {
                fetchProfile();
            }
        }

        async function fetchProfile() {
            try {
                const response = await fetch("/api/profile");
                if (response.ok) {
                    const data = await response.json();
                    setProfile(data);
                }
            } catch (error) {
                console.error("Failed to fetch profile:", error);
            }
        }

        checkAuth();

        // Subscribe to auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile();
            } else {
                setProfile(null);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const navLinks = [
        { href: "/", label: "ホーム", icon: "🏠" },
        { href: "/ranking", label: "ランキング", icon: "🏆" },
        { href: "/genre", label: "ジャンル", icon: "🎮" },
        { href: "/search", label: "検索", icon: "🔍" },
    ];

    return (
        <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50 backdrop-blur-sm sticky top-0 z-50 shadow-lg shadow-black/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="relative">
                            <span className="text-yellow-400 text-3xl group-hover:scale-110 transition-transform inline-block group-hover:rotate-12">
                                ★
                            </span>
                            <span className="absolute inset-0 text-yellow-400 text-3xl blur-sm opacity-50 group-hover:opacity-75 transition-opacity">
                                ★
                            </span>
                        </div>
                        <span className="text-xl font-black bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-500 bg-clip-text text-transparent tracking-tight">
                            STAR REPO
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-2">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`
                                        relative px-4 py-2 rounded-lg text-sm font-semibold
                                        transition-all duration-200 group
                                        ${isActive
                                            ? "bg-yellow-500/10 text-yellow-400 shadow-lg shadow-yellow-500/20"
                                            : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                                        }
                                    `}
                                >
                                    <span className="flex items-center gap-2">
                                        <span className="text-lg group-hover:scale-110 transition-transform">
                                            {link.icon}
                                        </span>
                                        <span>{link.label}</span>
                                    </span>
                                    {isActive && (
                                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-gradient-to-r from-transparent via-yellow-400 to-transparent rounded-full"></span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Menu */}
                    <div className="hidden md:flex items-center gap-3">
                        {user ? (
                            <>
                                <Link
                                    href="/mypage"
                                    className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
                                >
                                    マイページ
                                </Link>
                                <div className="relative group">
                                    {profile?.avatar_url ? (
                                        <img
                                            src={profile.avatar_url}
                                            alt="Profile"
                                            className="w-10 h-10 rounded-full object-cover shadow-lg shadow-yellow-500/30 cursor-pointer hover:scale-105 transition-transform border-2 border-yellow-400"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-black font-bold text-sm shadow-lg shadow-yellow-500/30 cursor-pointer hover:scale-105 transition-transform">
                                            {user.email?.[0].toUpperCase()}
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full blur-md opacity-50 group-hover:opacity-75 transition-opacity -z-10"></div>
                                </div>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
                                >
                                    ログイン
                                </Link>
                                <Link
                                    href="/signup"
                                    className="relative px-5 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold text-sm rounded-lg transition-all shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 hover:scale-105"
                                >
                                    <span className="relative z-10">新規登録</span>
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
                        aria-label="メニュー"
                    >
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            {mobileMenuOpen ? (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            ) : (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            )}
                        </svg>
                    </button>
                </div>

                {/* Mobile Navigation */}
                {mobileMenuOpen && (
                    <nav className="md:hidden py-4 border-t border-slate-700/50 animate-fade-in">
                        <div className="flex flex-col gap-2">
                            {navLinks.map((link) => {
                                const isActive = pathname === link.href;
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`
                                            flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold
                                            transition-all
                                            ${isActive
                                                ? "bg-yellow-500/10 text-yellow-400 border-l-4 border-yellow-400"
                                                : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                                            }
                                        `}
                                    >
                                        <span className="text-xl">{link.icon}</span>
                                        <span>{link.label}</span>
                                    </Link>
                                );
                            })}
                            <div className="border-t border-slate-700/50 my-2"></div>
                            {user ? (
                                <Link
                                    href="/mypage"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all"
                                >
                                    <span className="text-xl">👤</span>
                                    <span>マイページ</span>
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href="/login"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all"
                                    >
                                        <span className="text-xl">🔑</span>
                                        <span>ログイン</span>
                                    </Link>
                                    <Link
                                        href="/signup"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold text-sm rounded-lg shadow-lg shadow-yellow-500/30"
                                    >
                                        <span className="text-xl">✨</span>
                                        <span>新規登録</span>
                                    </Link>
                                </>
                            )}
                        </div>
                    </nav>
                )}
            </div>
        </header>
    );
}
