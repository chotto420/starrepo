import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import Link from "next/link";
import { Users, MessageSquare, Flag, Shield, ChevronLeft, LayoutDashboard } from "lucide-react";

export const dynamic = "force-dynamic";

async function getStats() {
    const supabase = await createClient();

    const [usersResult, reviewsResult, reportsResult] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("reviews").select("*", { count: "exact", head: true }),
        supabase.from("review_reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
    ]);

    return {
        totalUsers: usersResult.count || 0,
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500/20 rounded-lg">
                                <Users className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <div className="text-3xl font-bold">{stats.totalUsers}</div>
                                <div className="text-sm text-slate-400">登録ユーザー</div>
                            </div>
                        </div>
                    </div>

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

                    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-500/20 rounded-lg">
                                <Flag className="w-6 h-6 text-red-400" />
                            </div>
                            <div>
                                <div className="text-3xl font-bold">{stats.pendingReports}</div>
                                <div className="text-sm text-slate-400">未対応の通報</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation Cards */}
                <h2 className="text-xl font-bold mb-4">管理メニュー</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Link href="/admin/users" className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 hover:border-blue-500/50 transition-colors group">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                                <Users className="w-6 h-6 text-blue-400" />
                            </div>
                            <h3 className="text-lg font-semibold">ユーザー管理</h3>
                        </div>
                        <p className="text-sm text-slate-400">ユーザー一覧の表示、管理者権限の付与・削除</p>
                    </Link>

                    <Link href="/admin/reviews" className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 hover:border-green-500/50 transition-colors group">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors">
                                <MessageSquare className="w-6 h-6 text-green-400" />
                            </div>
                            <h3 className="text-lg font-semibold">レビュー管理</h3>
                        </div>
                        <p className="text-sm text-slate-400">レビュー一覧の表示、不適切なレビューの削除</p>
                    </Link>

                    <Link href="/admin/reports" className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 hover:border-red-500/50 transition-colors group">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-red-500/20 rounded-lg group-hover:bg-red-500/30 transition-colors">
                                <Flag className="w-6 h-6 text-red-400" />
                            </div>
                            <h3 className="text-lg font-semibold">通報管理</h3>
                        </div>
                        <p className="text-sm text-slate-400">ユーザーからの通報を確認し、対応する</p>
                    </Link>
                </div>
            </div>
        </main>
    );
}
