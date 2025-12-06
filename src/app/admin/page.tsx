import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import Link from "next/link";
import { MessageSquare, Flag, Shield, ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

async function getStats() {
    const supabase = await createClient();

    const [reviewsResult, reportsResult] = await Promise.all([
        supabase.from("reviews").select("*", { count: "exact", head: true }),
        supabase.from("review_reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
    ]);

    return {
        totalReviews: reviewsResult.count || 0,
        pendingReports: reportsResult.count || 0,
    };
}

export default async function AdminDashboard() {
    const admin = await isAdmin();

    if (!admin) {
        redirect("/");
    }

    const stats = await getStats();

    return (
        <main className="min-h-screen bg-slate-900 text-white">
            {/* Header */}
            <div className="bg-slate-800/50 border-b border-slate-700">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/" className="text-slate-400 hover:text-white transition-colors">
                                <ChevronLeft className="w-5 h-5" />
                            </Link>
                            <div className="flex items-center gap-2">
                                <Shield className="w-6 h-6 text-yellow-500" />
                                <h1 className="text-xl font-bold">管理者ダッシュボード</h1>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-500/20 rounded-lg">
                                <MessageSquare className="w-6 h-6 text-green-400" />
                            </div>
                            <div>
                                <div className="text-3xl font-bold">{stats.totalReviews}</div>
                                <div className="text-sm text-slate-400">総レビュー数</div>
                            </div>
                        </div>
                    </div>

                    <Link
                        href="/admin/reports"
                        className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 hover:border-red-500/50 transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-500/20 rounded-lg">
                                <Flag className="w-6 h-6 text-red-400" />
                            </div>
                            <div>
                                <div className="text-3xl font-bold">{stats.pendingReports}</div>
                                <div className="text-sm text-slate-400">未対応の通報 →</div>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Quick Actions */}
                <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50">
                    <h2 className="text-lg font-bold mb-4">通報管理</h2>
                    <p className="text-slate-400 mb-4">ユーザーからの通報を確認し、問題のあるレビューを削除できます。</p>
                    <Link
                        href="/admin/reports"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                    >
                        <Flag className="w-4 h-4" />
                        通報一覧を見る
                    </Link>
                </div>

                {/* Note */}
                <p className="text-slate-500 text-sm mt-6">
                    ※ユーザーの管理者権限の変更は、Supabaseダッシュボードから直接行ってください。
                </p>
            </div>
        </main>
    );
}
