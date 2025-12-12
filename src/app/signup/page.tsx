"use client";

import { useState, useActionState } from "react";
import { createClient } from "@/lib/supabase/client";
import { signup } from "../auth/actions";
import Link from "next/link";

type SignupState = {
    message?: string;
    error?: string;
};

const initialState: SignupState = {
    message: "",
    error: "",
};

export default function SignupPage() {
    const [googleLoading, setGoogleLoading] = useState(false);
    const [googleError, setGoogleError] = useState("");
    const [state, formAction, isPending] = useActionState<SignupState, FormData>(signup, initialState);
    const supabase = createClient();

    const handleGoogleLogin = async () => {
        setGoogleLoading(true);
        setGoogleError("");

        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (error) {
                setGoogleError("Googleログインに失敗しました: " + error.message);
                setGoogleLoading(false);
            }
        } catch (err) {
            setGoogleError("予期せぬエラーが発生しました。");
            console.error(err);
            setGoogleLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700">
                <h1 className="text-3xl font-bold text-center mb-6 text-white">新規登録</h1>

                {/* Google Login Button */}
                <button
                    onClick={handleGoogleLogin}
                    disabled={googleLoading}
                    className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-6"
                >
                    {googleLoading ? (
                        <div className="w-5 h-5 border-2 border-gray-400 border-t-gray-800 rounded-full animate-spin" />
                    ) : (
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                    )}
                    {googleLoading ? "接続中..." : "Googleで登録"}
                </button>

                {/* Divider */}
                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-slate-800 text-slate-400">または</span>
                    </div>
                </div>

                {googleError && (
                    <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg text-sm mb-4">
                        {googleError}
                    </div>
                )}

                {state?.error && (
                    <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg text-sm mb-4">
                        {state.error}
                    </div>
                )}

                {state?.message && (
                    <div className="bg-green-500/10 border border-green-500 text-green-500 p-3 rounded-lg text-sm mb-4">
                        {state.message}
                    </div>
                )}

                <form action={formAction} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">メールアドレス</label>
                        <input
                            name="email"
                            type="email"
                            required
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">パスワード</label>
                        <input
                            name="password"
                            type="password"
                            required
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full bg-green-500 hover:bg-green-400 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isPending ? "作成中..." : "アカウントを作成"}
                    </button>
                </form>
                <p className="mt-6 text-center text-slate-400 text-sm">
                    すでにアカウントをお持ちの方は{" "}
                    <Link href="/login" className="text-yellow-400 hover:underline">
                        ログイン
                    </Link>
                </p>
            </div>
        </div>
    );
}

