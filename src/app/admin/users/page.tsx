import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import Link from "next/link";
import { ChevronLeft, Shield, ShieldOff, Users } from "lucide-react";

export const dynamic = "force-dynamic";

async function getUsers() {
    const supabase = await createClient();
    const { data: users } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
    return users || [];
}

export default async function AdminUsersPage() {
    const admin = await isAdmin();
    if (!admin) redirect("/");

    const users = await getUsers();

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
                            <Users className="w-6 h-6 text-blue-400" />
                            <h1 className="text-xl font-bold">ユーザー管理</h1>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-800">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">ユーザー</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">登録日</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">権限</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {users.map((user) => (
                                <tr key={user.user_id} className="hover:bg-slate-700/30">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {user.avatar_url ? (
                                                <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center">
                                                    <Users className="w-5 h-5 text-slate-400" />
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-medium">{user.username || "未設定"}</div>
                                                <div className="text-sm text-slate-400 truncate max-w-xs">{user.bio || "-"}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-400">
                                        {new Date(user.created_at).toLocaleDateString("ja-JP")}
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.is_admin ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
                                                <Shield className="w-3 h-3" /> 管理者
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-500/20 text-slate-400">
                                                一般
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <form action={`/api/admin/users/${user.user_id}/toggle-admin`} method="POST">
                                            <button
                                                type="submit"
                                                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${user.is_admin
                                                        ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                                        : "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                                                    }`}
                                            >
                                                {user.is_admin ? (
                                                    <><ShieldOff className="w-4 h-4" /> 権限削除</>
                                                ) : (
                                                    <><Shield className="w-4 h-4" /> 管理者に</>
                                                )}
                                            </button>
                                        </form>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
}
