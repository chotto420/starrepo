"use client";

import { useState } from "react";

type CollapsibleDescriptionProps = {
    description: string | null;
};

export default function CollapsibleDescription({ description }: CollapsibleDescriptionProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (!description) return null;

    return (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden mb-8">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-700/50 transition-colors group"
            >
                <div className="flex items-center gap-3">
                    <span className="text-2xl group-hover:scale-110 transition-transform">📖</span>
                    <span className="text-lg font-semibold text-white">ゲーム概要</span>
                </div>
                <svg
                    className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""
                        }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </button>

            <div
                className={`transition-all duration-300 ease-in-out ${isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    }`}
            >
                <div className="px-6 pb-6 border-t border-slate-700/50">
                    <div className="pt-4 text-slate-300 leading-relaxed whitespace-pre-wrap overflow-y-auto max-h-80">
                        {description}
                    </div>
                </div>
            </div>
        </div>
    );
}
