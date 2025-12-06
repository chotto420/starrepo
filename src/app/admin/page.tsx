"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, MessageSquare, Flag, Shield, ChevronLeft, RefreshCw, Check, AlertCircle } from "lucide-react";

type Stats = {
    totalUsers: number;
    totalReviews: number;
    pendingReports: number;
    totalGames: number;
};

type SyncResult = {
    success: boolean;
    total: number;
    updated: number;
    failed: number;
    errors?: { placeId: number; error: string }[];
};

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [syncing, setSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await fetch("/api/admin/stats");
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error("Failed to fetch stats:", error);
        }
        setLoading(false);
    };

    const handleSync = async () => {
        console.log("Sync button clicked");
        setSyncing(true);
        setSyncResult(null);

        try {
            console.log("Calling API...");
            const res = await fetch("/api/admin/sync-roblox", { method: "POST" });
            console.log("API response status:", res.status);
            const data = await res.json();
            console.log("API response data:", data);
            setSyncResult(data);
            if (data.success) {
                fetchStats(); // Refresh stats after sync
            }
        } catch (error) {
            console.error("Sync error:", error);
            setSyncResult({ success: false, total: 0, updated: 0, failed: 0 });
        }

        setSyncing(false);
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full"></div>
            </main>
        );
    }

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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500/20 rounded-lg">
                                <Users className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <div className="text-3xl font-bold">{stats?.totalUsers || 0}</div>
                                <div className="text-sm text-slate-400">登録ユーザー</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-500/20 rounded-lg">
                                <MessageSquare className="w-6 h-6 text-purple-400" />
                            </div>
                            <div>
                                <div className="text-3xl font-bold">{stats?.totalGames || 0}</div>
                                <div className="text-sm text-slate-400">登録ゲーム</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-500/20 rounded-lg">
                                <MessageSquare className="w-6 h-6 text-green-400" />
                            </div>
                            <div>
                                <div className="text-3xl font-bold">{stats?.totalReviews || 0}</div>
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
                                <div className="text-3xl font-bold">{stats?.pendingReports || 0}</div>
                                <div className="text-sm text-slate-400">未対応の通報 →</div>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Report Management */}
                    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Flag className="w-5 h-5 text-red-400" />
                            通報管理
                        </h2>
                        <p className="text-slate-400 mb-4">ユーザーからの通報を確認し、問題のあるレビューを削除できます。</p>
                        <Link
                            href="/admin/reports"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                        >
                            <Flag className="w-4 h-4" />
                            通報一覧を見る
                        </Link>
                    </div>

                    {/* Roblox Sync */}
                    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <RefreshCw className="w-5 h-5 text-blue-400" />
                            Robloxデータ更新
                        </h2>
                        <p className="text-slate-400 mb-4">登録済みの全ゲームの訪問数・お気に入り数などをRoblox APIから最新化します。</p>

                        <button
                            onClick={handleSync}
                            disabled={syncing}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
                            {syncing ? "更新中..." : "全ゲームを更新"}
                        </button>

                        {/* Sync Result */}
                        {syncResult && (
                            <div className={`mt-4 p-4 rounded-lg ${syncResult.success ? "bg-green-500/20" : "bg-red-500/20"}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    {syncResult.success ? (
                                        <Check className="w-5 h-5 text-green-400" />
                                    ) : (
                                        <AlertCircle className="w-5 h-5 text-red-400" />
                                    )}
                                    <span className={syncResult.success ? "text-green-400" : "text-red-400"}>
                                        {syncResult.success ? "更新完了" : "エラーが発生しました"}
                                    </span>
                                </div>
                                <div className="text-sm text-slate-300">
                                    成功: {syncResult.updated}/{syncResult.total} 件
                                    {syncResult.failed > 0 && (
                                        <span className="text-red-400 ml-2">（失敗: {syncResult.failed}件）</span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Note */}
                <p className="text-slate-500 text-sm mt-6">
                    ※ユーザーの管理者権限の変更やアカウント削除は、Supabaseダッシュボードから直接行ってください。
                </p>
            </div>
        </main>
    );
}
