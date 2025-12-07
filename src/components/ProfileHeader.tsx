"use client";

import { useState, useEffect } from "react";
import ProfileEditModal from "./ProfileEditModal";
import LogoutButton from "./LogoutButton";
import { Edit2, Shield } from "lucide-react";

type ProfileHeaderProps = {
    userEmail: string;
    isAdmin?: boolean;
};

export default function ProfileHeader({ userEmail, isAdmin }: ProfileHeaderProps) {
    const [profile, setProfile] = useState<{
        username: string | null;
        avatar_url: string | null;
        bio: string | null;
    } | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [loading, setLoading] = useState(true);

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
        } finally {
            setLoading(false);
        }
    };

    const handleEditSuccess = () => {
        setShowEditModal(false);
        fetchProfile();
        window.location.reload();
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
