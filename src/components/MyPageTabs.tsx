"use client";

import { useState } from "react";
import MylistSection from "@/components/MylistSection";
import ReviewsSection from "@/components/ReviewsSection";

type Tab = "mylist" | "reviews";

export default function MyPageTabs({
    initialMylist,
    initialReviews,
    currentUserId
}: {
    initialMylist: any[];
    initialReviews: any[];
    currentUserId: string;
}) {
    const [activeTab, setActiveTab] = useState<Tab>("mylist");

    return (
        <div>
            {/* Tab Navigation */}
            <div className="flex border-b border-slate-700 mb-8">
                <button
                    onClick={() => setActiveTab("mylist")}
                    className={`
                        flex-1 pb-4 text-center font-bold text-lg transition-all relative
                        ${activeTab === "mylist"
                            ? "text-yellow-400"
                            : "text-slate-400 hover:text-slate-200"
                        }
                    `}
                >
                    <span className="flex items-center justify-center gap-2">
                        <span>📚</span> マイリスト
                        <span className="bg-slate-800 text-xs px-2 py-0.5 rounded-full text-slate-300">
                            {initialMylist.length}
                        </span>
                    </span>
                    {activeTab === "mylist" && (
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]"></span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab("reviews")}
                    className={`
                        flex-1 pb-4 text-center font-bold text-lg transition-all relative
                        ${activeTab === "reviews"
                            ? "text-yellow-400"
                            : "text-slate-400 hover:text-slate-200"
                        }
                    `}
                >
                    <span className="flex items-center justify-center gap-2">
                        <span>✍️</span> レビュー
                        <span className="bg-slate-800 text-xs px-2 py-0.5 rounded-full text-slate-300">
                            {initialReviews.length}
                        </span>
                    </span>
                    {activeTab === "reviews" && (
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]"></span>
                    )}
                </button>
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {activeTab === "mylist" ? (
                    <div className="animate-fade-in-up">
                        <MylistSection initialMylist={initialMylist} />
                    </div>
                ) : (
                    <div className="animate-fade-in-up">
                        <ReviewsSection initialReviews={initialReviews} currentUserId={currentUserId} />
                    </div>
                )}
            </div>
        </div>
    );
}
