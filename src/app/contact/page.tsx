"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Mail, Send, Check, AlertCircle } from "lucide-react";

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");

        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setSubmitted(true);
            } else {
                const data = await res.json();
                setError(data.error || "送信に失敗しました");
            }
        } catch (err) {
            console.error("Contact form error:", err);
            setError("送信中にエラーが発生しました");
        }

        setSubmitting(false);
    };

    if (submitted) {
        return (
            <main className="min-h-screen bg-[#0B0E14] text-white pb-20">
                <div className="max-w-2xl mx-auto px-6 py-20 text-center">
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Check className="w-10 h-10 text-green-400" />
                    </div>
                    <h1 className="text-2xl font-bold mb-4">送信完了</h1>
                    <p className="text-slate-400 mb-8">
                        お問い合わせありがとうございます。<br />
                        内容を確認次第、ご連絡いたします。
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors"
                    >
                        ホームに戻る
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#0B0E14] text-white pb-20">
            {/* Header */}
            <div className="bg-[#0B0E14]/80 backdrop-blur-md border-b border-slate-800">
                <div className="max-w-2xl mx-auto px-6 py-6">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-slate-400 hover:text-white transition-colors p-2 -ml-2 rounded-full hover:bg-slate-800">
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <Mail className="w-6 h-6 text-blue-400" />
                                お問い合わせ
                            </h1>
                        </div>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="max-w-2xl mx-auto px-6 py-8">
                <p className="text-slate-400 mb-8">
                    ご質問、ご要望、不具合報告などがありましたら、以下のフォームからお問い合わせください。
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            お名前 <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all"
                            placeholder="山田 太郎"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            メールアドレス <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all"
                            placeholder="example@email.com"
                        />
                    </div>

                    {/* Subject */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            件名 <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            required
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all"
                            placeholder="お問い合わせの件名"
                        />
                    </div>

                    {/* Message */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            メッセージ <span className="text-red-400">*</span>
                        </label>
                        <textarea
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            required
                            rows={6}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all resize-none"
                            placeholder="お問い合わせ内容をご記入ください..."
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {submitting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                送信中...
                            </>
                        ) : (
                            <>
                                <Send className="w-5 h-5" />
                                送信する
                            </>
                        )}
                    </button>
                </form>

                {/* Note */}
                <p className="text-xs text-slate-500 mt-6 text-center">
                    お問い合わせ内容は、<Link href="/privacy" className="text-slate-400 hover:text-white underline">プライバシーポリシー</Link>に基づいて取り扱います。
                </p>
            </div>
        </main>
    );
}
