"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ProfileEditModal from "./ProfileEditModal";
import LogoutButton from "./LogoutButton";
import { Edit2, Shield, Trash2, AlertTriangle } from "lucide-react";

type ProfileHeaderProps = {
    userEmail: string;
    isAdmin?: boolean;
    initialProfile?: {
        username: string | null;
        avatar_url: string | null;
        bio: string | null;
    } | null;
};

export default function ProfileHeader({ userEmail, isAdmin, initialProfile }: ProfileHeaderProps) {
    const router = useRouter();
    const [profile, setProfile] = useState<{
        username: string | null;
        avatar_url: string | null;
        bio: string | null;
    } | null>(initialProfile || null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [loading, setLoading] = useState(!initialProfile);

    useEffect(() => {
        // initialProfileが渡されている場合はAPI呼び出しをスキップ
        if (initialProfile) {
            setLoading(false);
            return;
        }
        fetchProfile();
    }, [initialProfile]);

    const fetchProfile = async () => {
        try {
            const response = await fetch("/api/profile");
            if (response.ok) {
                const data = await response.json();
                setProfile(data);
            }
        } catch (error) {
            console.error("Failed to fetch profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditSuccess = () => {
        setShowEditModal(false);
        fetchProfile();
        window.location.reload();
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== "退会する") return;

        setIsDeleting(true);
        try {
            const response = await fetch("/api/account", { method: "DELETE" });
            if (response.ok) {
                // Sign out the user after account deletion
                const supabase = createClient();
                await supabase.auth.signOut();
                // Force redirect to home
                window.location.href = "/";
            } else {
                alert("退会処理に失敗しました。時間をおいて再度お試しください。");
            }
        } catch (error) {
            console.error("Delete account error:", error);
            alert("エラーが発生しました。");
        } finally {
            setIsDeleting(false);
        }
    };

    const displayName = loading ? "" : (profile?.username || userEmail);
    const avatarUrl = profile?.avatar_url;
    const bio = profile?.bio;

    return (
        <>
            <div className="bg-[#151921] border-b border-slate-800">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="relative shrink-0">
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt={displayName}
                                        className="w-20 h-20 rounded-full object-cover border-2 border-slate-700 shadow-xl"
                                    />
                                ) : (
                                    <div className="w-20 h-20 bg-gradient-to-br from-slate-700 to-slate-600 rounded-full flex items-center justify-center text-white font-bold text-3xl shadow-xl border border-slate-600">
                                        {userEmail[0].toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div>
                                {loading ? (
                                    <div className="h-9 w-40 bg-slate-700 rounded animate-pulse mb-1"></div>
                                ) : (
                                    <h1 className="text-3xl font-bold text-white mb-1">{displayName}</h1>
                                )}
                                <p className="text-slate-500 text-sm mb-2">{userEmail}</p>
                                {bio && <p className="text-slate-300 max-w-2xl leading-relaxed">{bio}</p>}
                            </div>
                        </div>
                        <div className="flex gap-3">
                            {isAdmin && (
                                <a
                                    href="/admin"
                                    className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 font-medium rounded-lg transition-colors border border-yellow-500/50"
                                >
                                    <Shield className="w-4 h-4" />
                                    管理者
                                </a>
                            )}
                            <button
                                onClick={() => setShowEditModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg transition-colors border border-slate-700"
                            >
                                <Edit2 className="w-4 h-4" />
                                編集
                            </button>
                            <LogoutButton />
                        </div>
                    </div>

                    {/* Delete Account Link */}
                    <div className="mt-6 pt-4 border-t border-slate-800">
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="text-sm text-slate-500 hover:text-red-400 transition-colors"
                        >
                            アカウントを削除する
                        </button>
                    </div>
                </div>
            </div>

            {showEditModal && profile && (
                <ProfileEditModal
                    initialProfile={profile}
                    onClose={() => setShowEditModal(false)}
                    onSuccess={handleEditSuccess}
                />
            )}

            {/* Delete Account Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
                    <div className="relative bg-[#1A1D24] border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <div className="flex items-center gap-3 text-red-500 mb-4">
                            <AlertTriangle className="w-8 h-8" />
                            <h2 className="text-xl font-bold">アカウント削除</h2>
                        </div>

                        <div className="text-slate-300 mb-6 space-y-3">
                            <p>アカウントを削除すると、以下のデータが<span className="text-red-400 font-bold">完全に削除</span>されます：</p>
                            <ul className="list-disc list-inside text-sm text-slate-400 space-y-1">
                                <li>投稿したレビュー</li>
                                <li>マイリスト</li>
                                <li>いいね履歴</li>
                                <li>プロフィール情報</li>
                            </ul>
                            <p className="text-sm text-slate-500">この操作は取り消せません。</p>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm text-slate-400 mb-2">
                                確認のため「<span className="text-red-400 font-bold">退会する</span>」と入力してください
                            </label>
                            <input
                                type="text"
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                placeholder="退会する"
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setDeleteConfirmText("");
                                }}
                                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={deleteConfirmText !== "退会する" || isDeleting}
                                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                {isDeleting ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        処理中...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4" />
                                        退会する
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
