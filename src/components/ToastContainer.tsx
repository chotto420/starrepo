"use client";

import { useEffect, useState } from "react";

type ToastType = "success" | "error" | "info";

type Toast = {
    id: number;
    message: string;
    type: ToastType;
};

let toastId = 0;
const toastListeners: ((toast: Toast) => void)[] = [];

export function showToast(message: string, type: ToastType = "info") {
    const toast: Toast = {
        id: toastId++,
        message,
        type,
    };
    toastListeners.forEach((listener) => listener(toast));
}

export default function ToastContainer() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    useEffect(() => {
        const listener = (toast: Toast) => {
            setToasts((prev) => [...prev, toast]);
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== toast.id));
            }, 5000);
        };
        toastListeners.push(listener);
        return () => {
            const index = toastListeners.indexOf(listener);
            if (index > -1) toastListeners.splice(index, 1);
        };
    }, []);

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`
                        pointer-events-auto
                        min-w-80 max-w-md
                        px-6 py-4 rounded-lg shadow-2xl
                        border backdrop-blur-sm
                        animate-slide-in-right
                        ${toast.type === "success"
                            ? "bg-green-900/90 border-green-500/50 text-green-100"
                            : toast.type === "error"
                                ? "bg-red-900/90 border-red-500/50 text-red-100"
                                : "bg-blue-900/90 border-blue-500/50 text-blue-100"
                        }
                    `}
                >
                    <div className="flex items-start gap-3">
                        <span className="text-2xl flex-shrink-0">
                            {toast.type === "success" ? "✅" : toast.type === "error" ? "❌" : "ℹ️"}
                        </span>
                        <p className="text-sm font-medium flex-1">{toast.message}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
