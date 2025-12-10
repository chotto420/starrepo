"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    Home,
    Trophy,
    Gamepad2,
    Search,
    User,
    Menu,
    X,
    Star
} from "lucide-react";

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
        { href: "/", label: "ホーム", icon: Home },
        { href: "/ranking", label: "ランキング", icon: Trophy },
        { href: "/genre", label: "ジャンル", icon: Gamepad2 },
        { href: "/search", label: "検索", icon: Search },
    ];

    return (
        <header className="bg-[#0B0E14]/80 border-b border-slate-800 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="relative w-8 h-8">
                            <img
                                src="/images/logo/logo_icon_transparent.png"
                                alt="Logo"
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <span className="text-xl font-bold text-white tracking-tight group-hover:text-yellow-400 transition-colors">
                            STAR REPO
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href;
                            const Icon = link.icon;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`
                                        flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                                        ${isActive
                                            ? "text-yellow-400 bg-yellow-500/10"
                                            : "text-slate-400 hover:text-white hover:bg-slate-800"
                                        }
                                    `}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{link.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Menu */}
                    <div className="hidden md:flex items-center gap-4">
                        {user ? (
                            <>
                                <Link href="/mypage" className="group flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-all">
                                    {profile?.avatar_url ? (
                                        <img
                                            src={profile.avatar_url}
                                            alt="Profile"
                                            className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-700 group-hover:ring-yellow-500/50 transition-all"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-slate-300 group-hover:text-white transition-all">
                                            <User className="w-4 h-4" />
                                        </div>
                                    )}
                                    <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                                        マイページ
                                    </span>
                                </Link>
                            </>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link
                                    href="/login"
                                    className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
                                >
                                    ログイン
                                </Link>
                                <Link
                                    href="/signup"
                                    className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm rounded-lg transition-colors"
                                >
                                    新規登録
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
                        aria-label="メニュー"
                    >
                        {mobileMenuOpen ? (
                            <X className="w-6 h-6" />
                        ) : (
                            <Menu className="w-6 h-6" />
                        )}
                    </button>
                </div>

                {/* Mobile Navigation */}
                {mobileMenuOpen && (
                    <nav className="md:hidden py-4 border-t border-slate-800 animate-fade-in">
                        <div className="flex flex-col gap-1">
                            {navLinks.map((link) => {
                                const isActive = pathname === link.href;
                                const Icon = link.icon;
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`
                                            flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
                                            ${isActive
                                                ? "text-yellow-400 bg-yellow-500/10"
                                                : "text-slate-400 hover:text-white hover:bg-slate-800"
                                            }
                                        `}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span>{link.label}</span>
                                    </Link>
                                );
                            })}
                            <div className="border-t border-slate-800 my-2 pt-2">
                                {user ? (
                                    <Link
                                        href="/mypage"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800"
                                    >
                                        <User className="w-5 h-5" />
                                        <span>マイページ</span>
                                    </Link>
                                ) : (
                                    <div className="px-4 flex flex-col gap-2">
                                        <Link
                                            href="/login"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="block w-full text-center py-2 text-sm font-medium text-slate-400 hover:text-white bg-slate-800 rounded-lg"
                                        >
                                            ログイン
                                        </Link>
                                        <Link
                                            href="/signup"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="block w-full text-center py-2 bg-yellow-500 text-black font-bold text-sm rounded-lg"
                                        >
                                            新規登録
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </nav>
                )}
            </div>
        </header>
    );
}
