"use client";

import { useState, useEffect } from "react";
import { Download, X, Share, PlusSquare } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [showIOSPrompt, setShowIOSPrompt] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // すでにアプリとして起動しているかチェック
        const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
        setIsStandalone(isStandaloneMode);

        if (isStandaloneMode) return;

        // Android / Desktop (Chrome/Edge)
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

        // iOS判定
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(isIosDevice);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            // Android / Desktop: 標準のインストールプロンプトを表示
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === "accepted") {
                setDeferredPrompt(null);
            }
        } else if (isIOS) {
            // iOS: 手順を表示
            setShowIOSPrompt(true);
        }
    };

    // すでにインストール済み(スタンドアロン)の場合や、
    // まだプロンプトが出ておらず(PCなど)、かつiOSでもない場合は表示しない
    // ※ 常に「アプリを入れる」ボタンをヘッダーに出す場合は、ここは調整可能。
    // 今回は「ヘッダーにボタンを常設」ではなく「条件が揃ったらバナーを出す」or「ヘッダーボタンからここを呼び出す」
    // 設計書では「Headerへの統合」となっていたので、外部から呼び出せるようにするか、
    // あるいはこのコンポーネント自体が「インストール可能な時だけ出るボタン」として振る舞うか。
    // ここでは「Header内に置くためのボタン」ではなく
    // 「画面下部などに固定表示するプロンプト」または「Headerから呼び出されるモーダル」として実装する形をとりますが、
    // まずは「ボタン」としてHeaderに埋め込める形で作ります。

    // 今回はHeaderに統合するため、UIはボタンのみを返す形にします。
    // ただしiOSガイダンスのモーダルも含みます。

    if (isStandalone) return null;
    // Android/PCでイベント未発生、かつiOSでない場合はボタンを出さない（インストール不可のため）
    if (!deferredPrompt && !isIOS) return null;

    return (
        <>
            <button
                onClick={handleInstallClick}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded-lg text-sm font-medium transition-all"
            >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">アプリをインストール</span>
                <span className="sm:hidden">アプリ</span>
            </button>

            {/* iOS向けのインストール手順モーダル */}
            {showIOSPrompt && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-[#1A1D24] border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl relative max-h-[90vh] flex flex-col">
                        <div className="p-5 overflow-y-auto">
                            <button
                                onClick={() => setShowIOSPrompt(false)}
                                className="absolute top-4 right-4 text-slate-400 hover:text-white z-10"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center mb-4 mt-2">
                                <Download className="w-6 h-6 text-yellow-400" />
                            </div>

                            <h3 className="text-lg font-bold text-white mb-2">
                                ホーム画面に追加
                            </h3>
                            <p className="text-sm text-slate-400 mb-5">
                                アプリとしてインストールすると、全画面でより快適に利用できます。
                                <br />
                                <span className="text-yellow-500 text-xs mt-2 block">
                                    ※Safariからのみインストール可能です
                                </span>
                            </p>

                            <div className="space-y-3">
                                <div className="flex items-center gap-4 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                                    <div className="w-8 h-8 flex items-center justify-center text-blue-400 shrink-0">
                                        <Share className="w-6 h-6" />
                                    </div>
                                    <div className="text-sm text-slate-300">
                                        1. 画面下部の<span className="font-bold text-white mx-1">共有</span>ボタンをタップ
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                                    <div className="w-8 h-8 flex items-center justify-center text-slate-200 shrink-0">
                                        <PlusSquare className="w-6 h-6" />
                                    </div>
                                    <div className="text-sm text-slate-300">
                                        2. <span className="font-bold text-white mx-1">ホーム画面に追加</span>を選択
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowIOSPrompt(false)}
                                className="w-full mt-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl transition-colors"
                            >
                                閉じる
                            </button>
                        </div>

                        {/* 吹き出しの矢印は削除（画面中央表示のため） */}
                    </div>
                </div>
            )}
        </>
    );
}
