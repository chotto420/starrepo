import { X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";

interface CreatorModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CreatorModal({ isOpen, onClose }: CreatorModalProps) {
    // Close on escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            window.addEventListener("keydown", handleEsc);
            // Prevent scrolling when modal is open
            document.body.style.overflow = "hidden";
        }
        return () => {
            window.removeEventListener("keydown", handleEsc);
            document.body.style.overflow = "unset";
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-[#1A1D24] border border-slate-700 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-10 p-1 hover:bg-slate-800 rounded-full"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Header Image */}
                <div className="relative w-full aspect-video bg-gradient-to-b from-slate-800 to-[#1A1D24]">
                    <Image
                        src="/images/creators/group_visual.png"
                        alt="OssansRob Group"
                        fill
                        className="object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#1A1D24] to-transparent h-20" />
                </div>

                <div className="p-6 pt-2 text-center">
                    <h2 className="text-2xl font-bold text-white mb-2 font-mono">
                        Produced by <span className="text-yellow-400">OssansRob</span>
                    </h2>

                    <p className="text-slate-300 mb-8 max-w-sm mx-auto leading-relaxed">
                        YoutubeでRobloxのゲームを作ったり<br />
                        配信したりしているおじさん達です。
                    </p>

                    {/* Members Grid */}
                    <div className="grid grid-cols-5 gap-3 mb-8">
                        <Member
                            name="赤ぺに"
                            image="/images/creators/member_katsuwo.png"
                            color="bg-red-500/10 text-red-400"
                        />
                        <Member
                            name="青ぺに"
                            image="/images/creators/member_daisuke.png"
                            color="bg-blue-500/10 text-blue-400"
                        />
                        <Member
                            name="黄ぺに"
                            image="/images/creators/member_kota.png"
                            color="bg-yellow-500/10 text-yellow-400"
                        />
                        <Member
                            name="オレンジぺに"
                            image="/images/creators/mascot_orange.png"
                            color="bg-orange-500/10 text-orange-400"
                        />
                        <Member
                            name="ピンクぺに"
                            image="/images/creators/mascot_pink.png"
                            color="bg-pink-500/10 text-pink-400"
                        />
                    </div>

                    {/* Social Links */}
                    <div className="flex gap-4 justify-center">
                        <SocialButton
                            href="https://www.youtube.com/@ossansROB"
                            label="YouTube"
                            icon={<YoutubeIcon />}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        />
                        <SocialButton
                            href="https://x.com/OssansRob"
                            label="X (Twitter)"
                            icon={<XIcon />}
                            className="bg-black hover:bg-slate-900 text-white border border-slate-700"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function Member({ name, image, color }: { name: string; image: string; color: string }) {
    return (
        <div className="flex flex-col items-center gap-2 group">
            <div className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 border-transparent group-hover:border-slate-500 transition-all duration-300 ring-2 ring-slate-800 shadow-lg ${color.replace('text-', 'ring-')}`}>
                <Image
                    src={image}
                    alt={name}
                    fill
                    className="object-cover"
                />
            </div>
            <span className={`font-bold text-sm ${color} px-2 py-0.5 rounded-full`}>
                {name}
            </span>
        </div>
    );
}

function SocialButton({ href, label, icon, className }: { href: string; label: string; icon: React.ReactNode; className: string }) {
    return (
        <Link
            href={href}
            target="_blank"
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-transform hover:scale-105 active:scale-95 shadow-lg ${className}`}
        >
            {icon}
            <span>{label}</span>
        </Link>
    );
}

function YoutubeIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M18 3a5 5 0 0 1 5 5v8a5 5 0 0 1 -5 5h-12a5 5 0 0 1 -5 -5v-8a5 5 0 0 1 5 -5zm-6 6a1 1 0 0 0 -1 1v4a1 1 0 0 0 1.514 .857l3 -2a1 1 0 0 0 0 -1.714l-3 -2a1 1 0 0 0 -.514 -.143z" /></svg>
    )
}

function XIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
    )
}
