"use client";

import { useState } from "react";

type ProfileEditModalProps = {
    initialProfile: {
        username: string | null;
        avatar_url: string | null;
        bio: string | null;
    };
    onClose: () => void;
    onSuccess: () => void;
};

export default function ProfileEditModal({
    initialProfile,
    onClose,
    onSuccess,
}: ProfileEditModalProps) {
    const [username, setUsername] = useState(initialProfile.username || "");
    const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatar_url || "");
    const [bio, setBio] = useState(initialProfile.bio || "");
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // ファイルサイズチェック（2MB）
        if (file.size > 2 * 1024 * 1024) {
            setError("ファイルサイズは2MB以下にしてください");
            return;
        }

        // ファイル形式チェック
        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
            setError("JPEG、PNG、WebP形式の画像のみアップロード可能です");
            return;
        }

        setUploading(true);
        setError("");

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/profile/avatar", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "画像のアップロードに失敗しました");
            }

            const data = await response.json();
            setAvatarUrl(data.url);
        } catch (err) {
            setError(err instanceof Error ? err.message : "予期せぬエラーが発生しました");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: username.trim() || null,
                    avatar_url: avatarUrl.trim() || null,
                    bio: bio.trim() || null,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "プロフィールの更新に失敗しました");
            }

            onSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : "予期せぬエラーが発生しました");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div
                className="bg-slate-800 rounded-xl p-6 max-w-md w-full border border-slate-700 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-2xl font-bold mb-6 text-white">プロフィールを編集</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* プロフィール画像 */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">
                            プロフィール画像
                        </label>
                        {avatarUrl && (
                            <div className="mb-3">
                                <img
                                    src={avatarUrl}
                                    alt="プロフィール画像"
                                    className="w-24 h-24 rounded-full object-cover border-2 border-yellow-500"
                                />
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleFileUpload}
                            disabled={uploading}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-yellow-500 file:text-black hover:file:bg-yellow-400 file:cursor-pointer disabled:opacity-50"
                        />
                        {uploading && (
                            <p className="text-sm text-yellow-400 mt-2">
                                アップロード中...
                            </p>
                        )}
                        <p className="text-xs text-slate-500 mt-1">
                            JPEG、PNG、WebP形式、2MB以下
                        </p>
                    </div>

                    {/* ユーザー名 */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">
                            ユーザー名
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            maxLength={50}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none"
                            placeholder="ユーザー名を入力..."
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            {username.length}/50文字
                        </p>
                    </div>

                    {/* 自己紹介 */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">
                            自己紹介
                        </label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            maxLength={500}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none min-h-[100px]"
                            placeholder="自己紹介を入力..."
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            {bio.length}/500文字
                        </p>
                    </div>

                    {/* エラーメッセージ */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* ボタン */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading || uploading}
                            className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                            キャンセル
                        </button>
                        <button
                            type="submit"
                            disabled={loading || uploading}
                            className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "更新中..." : "更新"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
