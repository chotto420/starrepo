import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import Link from "next/link";
import { ChevronLeft, Flag, CheckCircle, XCircle, Clock, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

const reasonLabels: Record<string, string> = {
    harassment: "ハラスメント",
    spam: "スパム",
    inappropriate: "不適切なコンテンツ",
    impersonation: "なりすまし",
    other: "その他",
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    pending: { label: "対応待ち", color: "bg-yellow-500/20 text-yellow-400", icon: <Clock className="w-4 h-4" /> },
    resolved: { label: "対応済み", color: "bg-green-500/20 text-green-400", icon: <CheckCircle className="w-4 h-4" /> },
    dismissed: { label: "却下", color: "bg-slate-500/20 text-slate-400", icon: <XCircle className="w-4 h-4" /> },
};

async function getReports() {
    const supabase = await createClient();

    const { data: reports } = await supabase
        .from("review_reports")
        .select("*")
        .order("created_at", { ascending: false });

    if (!reports) return [];

    // Fetch related data
    const reporterIds = [...new Set(reports.map(r => r.reporter_id))];
    const reviewIds = [...new Set(reports.filter(r => r.review_id).map(r => r.review_id))];

    const [profilesResult, reviewsResult] = await Promise.all([
        supabase.from("profiles").select("user_id, username").in("user_id", reporterIds),
        reviewIds.length > 0 ? supabase.from("reviews").select("id, comment, user_id").in("id", reviewIds) : { data: [] },
    ]);

    return reports.map(r => ({
        ...r,
        reporter: profilesResult.data?.find(p => p.user_id === r.reporter_id),
        review: reviewsResult.data?.find(rv => rv.id === r.review_id),
    }));
}

export default async function AdminReportsPage() {
    const admin = await isAdmin();
    if (!admin) redirect("/");

    const reports = await getReports();

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
                <div className="space-y-4">
                    {reports.map((report) => {
                        const status = statusConfig[report.status] || statusConfig.pending;

                        return (
                            <div key={report.id} className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        {/* Status & Reason */}
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                                                {status.icon}
                                                {status.label}
                                            </span>
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                                                {reasonLabels[report.reason] || report.reason}
                                            </span>
                                        </div>

                                        {/* Reporter */}
                                        <div className="text-sm text-slate-400 mb-2">
                                            通報者: <span className="text-white">{report.reporter?.username || "不明"}</span>
                                            <span className="mx-2">•</span>
                                            {new Date(report.created_at).toLocaleString("ja-JP")}
                                        </div>

                                        {/* Review Preview */}
                                        {report.review && (
                                            <div className="bg-slate-700/50 p-3 rounded-lg mb-3">
                                                <div className="text-sm text-slate-400 mb-1">対象レビュー:</div>
                                                <p className="text-slate-300 line-clamp-2">{report.review.comment || "(内容なし)"}</p>
                                            </div>
                                        )}

                                        {/* Detail */}
                                        {report.detail && (
                                            <p className="text-slate-300">{report.detail}</p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    {report.status === "pending" && (
                                        <div className="flex gap-2">
                                            <form action={`/api/admin/reports/${report.id}`} method="POST">
                                                <input type="hidden" name="status" value="resolved" />
                                                <button
                                                    type="submit"
                                                    className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                                                    title="対応済みにする"
                                                >
                                                    <CheckCircle className="w-5 h-5" />
                                                </button>
                                            </form>
                                            <form action={`/api/admin/reports/${report.id}`} method="POST">
                                                <input type="hidden" name="status" value="dismissed" />
                                                <button
                                                    type="submit"
                                                    className="p-2 rounded-lg bg-slate-500/20 text-slate-400 hover:bg-slate-500/30 transition-colors"
                                                    title="却下する"
                                                >
                                                    <XCircle className="w-5 h-5" />
                                                </button>
                                            </form>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {reports.length === 0 && (
                        <div className="text-center py-12 text-slate-400">
                            通報がありません
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
