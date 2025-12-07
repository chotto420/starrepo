"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

type ConfirmModalProps = {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
};

export default function ConfirmModal({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = "削除する",
    cancelText = "キャンセル",
    danger = true,
}: ConfirmModalProps) {
    // ESCキーでキャンセル
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onCancel();
            }
        };

        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fadeIn"
            onClick={onCancel}
        >
            <div
                className="bg-[#1c222c] rounded-xl p-6 max-w-md w-full border border-slate-700 shadow-2xl animate-scaleIn"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white">{title}</h3>
                    <button
                        onClick={onCancel}
                        className="text-slate-400 hover:text-white transition-colors"
                        aria-label="閉じる"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Message */}
                <p className="text-slate-300 mb-6 whitespace-pre-wrap">{message}</p>

                {/* Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors font-medium"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onCancel();
                        }}
                        className={`flex-1 px-4 py-2 rounded-lg transition-colors font-medium ${danger
                                ? "bg-red-500 hover:bg-red-600 text-white"
                                : "bg-yellow-500 hover:bg-yellow-400 text-black"
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
