"use client";

import { useState, useEffect } from "react";
import ProfileEditModal from "./ProfileEditModal";
import LogoutButton from "./LogoutButton";

type ProfileHeaderProps = {
    userEmail: string;
};

export default function ProfileHeader({ userEmail }: ProfileHeaderProps) {
    const [profile, setProfile] = useState<{
        username: string | null;
        avatar_url: string | null;
        bio: string | null;
    } | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await fetch("/api/profile");
            if (response.ok) {
                const data = await response.json();
                setProfile(data);
            }
        } catch (error) {
            console.error("Failed to fetch profile:", error);
        }
    };

    const handleEditSuccess = () => {
        setShowEditModal(false);
        fetchProfile();
        // ヘッダーのアイコンも更新するためにページをリロード
        window.location.reload();
    };

    const displayName = profile?.username || userEmail;
    const avatarUrl = profile?.avatar_url;
    const bio = profile?.bio;

    return (
        <>
            <div className="bg-slate-800 border-b border-slate-700">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt={displayName}
                                        className="w-16 h-16 rounded-full object-cover border-2 border-yellow-500"
                                    />
                                ) : (
                                    <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center text-black font-bold text-2xl">
                                        {userEmail[0].toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">{displayName}</h1>
                                <p className="text-slate-400 text-sm">{userEmail}</p>
                                {bio && <p className="text-slate-300 mt-2 max-w-2xl">{bio}</p>}
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowEditModal(true)}
                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
                            >
                                プロフィール編集
                            </button>
                            <LogoutButton />
                        </div>
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
        </>
    );
}
