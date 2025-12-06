"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, Flag, CheckCircle, XCircle, Clock, Trash2, ExternalLink, User } from "lucide-react";

type Report = {
    id: number;
    review_id: number | null;
    reporter_id: string;
    reason: string;
    detail: string | null;
    status: string;
    resolved_at: string | null;
    resolved_by: string | null;
    created_at: string;
    reporter?: { username: string } | null;
    review?: {
        id: number;
        comment: string;
        rating: number;
        user_id: string;
        place_id: number;
        reviewer?: { username: string } | null;
    } | null;
};

const reasonLabels: Record<string, string> = {
    harassment: "ハラスメント",
    spam: "スパム",
    inappropriate: "不適切なコンテンツ",
    impersonation: "なりすまし",
    other: "その他",
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    pending: { label: "対応待ち", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: <Clock className="w-4 h-4" /> },
    resolved: { label: "対応済み", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: <CheckCircle className="w-4 h-4" /> },
    dismissed: { label: "却下", color: "bg-slate-500/20 text-slate-400 border-slate-500/30", icon: <XCircle className="w-4 h-4" /> },
};

export default function AdminReportsPage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "pending">("pending");
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/reports");
            if (res.ok) {
                const data = await res.json();
                setReports(data);
            }
        } catch (error) {
            console.error("Failed to fetch reports:", error);
        }
        setLoading(false);
    };

    const handleAction = async (reportId: number, action: "resolve" | "dismiss" | "delete_review") => {
        setActionLoading(reportId);
        try {
            const res = await fetch(`/api/admin/reports/${reportId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action }),
            });

            if (res.ok) {
                fetchReports();
            } else {
                const data = await res.json();
                alert(data.error || "操作に失敗しました");
            }
        } catch (error) {
            alert("エラーが発生しました");
        }
        setActionLoading(null);
    };

    const filteredReports = filter === "pending"
        ? reports.filter(r => r.status === "pending")
        : reports;

    return (
        <main className="min-h-screen bg-slate-900 text-white">
            {/* Header */}
            <div className="bg-slate-800/50 border-b border-slate-700">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center gap-4">
                        <Link href="/admin" className="text-slate-400 hover:text-white transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <div className="flex items-center gap-2">
                            <Flag className="w-6 h-6 text-red-400" />
                            <h1 className="text-xl font-bold">通報管理</h1>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Filter Tabs */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="flex bg-slate-800 p-1 rounded-lg">
                        <button
                            onClick={() => setFilter("pending")}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === "pending"
                                    ? "bg-yellow-500/20 text-yellow-400"
                                    : "text-slate-400 hover:text-white"
                                }`}
                        >
                            未対応 ({reports.filter(r => r.status === "pending").length})
                        </button>
                        <button
                            onClick={() => setFilter("all")}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === "all"
                                    ? "bg-slate-700 text-white"
                                    : "text-slate-400 hover:text-white"
                                }`}
                        >
                            すべて ({reports.length})
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-12 text-slate-400">読み込み中...</div>
                ) : filteredReports.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        {filter === "pending" ? "未対応の通報はありません 🎉" : "通報がありません"}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredReports.map((report) => {
                            const status = statusConfig[report.status] || statusConfig.pending;

                            return (
                                <div key={report.id} className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
                                    {/* Report Header */}
                                    <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${status.color}`}>
                                                {status.icon}
                                                {status.label}
                                            </span>
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                                                {reasonLabels[report.reason] || report.reason}
                                            </span>
                                        </div>
                                        <span className="text-sm text-slate-500">
                                            {new Date(report.created_at).toLocaleString("ja-JP")}
                                        </span>
                                    </div>

                                    <div className="p-4">
                                        {/* Reporter Info */}
                                        <div className="text-sm text-slate-400 mb-4 flex items-center gap-2">
                                            <User className="w-4 h-4" />
                                            通報者: <span className="text-white">{report.reporter?.username || "不明"}</span>
                                        </div>

                                        {/* Reported Review */}
                                        {report.review ? (
                                            <div className="bg-slate-900/50 p-4 rounded-lg mb-4 border border-slate-700">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="text-sm font-medium text-slate-300">
                                                                {report.review.reviewer?.username || "匿名"}
                                                            </span>
                                                            <span className="text-yellow-400 text-sm">
                                                                {"★".repeat(report.review.rating)}
                                                            </span>
                                                        </div>
                                                        <p className="text-slate-300 text-sm whitespace-pre-wrap">
                                                            {report.review.comment || "(コメントなし)"}
                                                        </p>
                                                    </div>
                                                    <Link
                                                        href={`/place/${report.review.place_id}`}
                                                        target="_blank"
                                                        className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 shrink-0"
                                                    >
                                                        ゲームを見る <ExternalLink className="w-3 h-3" />
                                                    </Link>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-slate-900/50 p-4 rounded-lg mb-4 border border-slate-700 text-slate-500 text-sm">
                                                対象レビューは既に削除されています
                                            </div>
                                        )}

                                        {/* Detail */}
                                        {report.detail && (
                                            <div className="text-sm text-slate-300 mb-4">
                                                <span className="text-slate-500">詳細: </span>
                                                {report.detail}
                                            </div>
                                        )}

                                        {/* Actions */}
                                        {report.status === "pending" && (
                                            <div className="flex gap-2 pt-2 border-t border-slate-700/50">
                                                {report.review && (
                                                    <button
                                                        onClick={() => handleAction(report.id, "delete_review")}
                                                        disabled={actionLoading === report.id}
                                                        className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm font-medium disabled:opacity-50"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        レビューを削除して対応済みに
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleAction(report.id, "resolve")}
                                                    disabled={actionLoading === report.id}
                                                    className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-sm font-medium disabled:opacity-50"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    対応済み
                                                </button>
                                                <button
                                                    onClick={() => handleAction(report.id, "dismiss")}
                                                    disabled={actionLoading === report.id}
                                                    className="flex items-center gap-2 px-4 py-2 bg-slate-600/50 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors text-sm font-medium disabled:opacity-50"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                    却下（問題なし）
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}
