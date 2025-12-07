import Link from "next/link";
import { ChevronLeft, FileText } from "lucide-react";

export const metadata = {
    title: "利用規約 - StarRepo",
    description: "StarRepoの利用規約",
};

export default function TermsPage() {
    return (
        <main className="min-h-screen bg-[#0B0E14] text-white pb-20">
            {/* Header */}
            <div className="bg-[#0B0E14]/80 backdrop-blur-md border-b border-slate-800">
                <div className="max-w-4xl mx-auto px-6 py-6">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-slate-400 hover:text-white transition-colors p-2 -ml-2 rounded-full hover:bg-slate-800">
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <FileText className="w-6 h-6 text-blue-400" />
                                利用規約
                            </h1>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-8">
                <div className="prose prose-invert prose-slate max-w-none">
                    <p className="text-slate-400 text-sm mb-8">
                        最終更新日: 2024年12月7日
                    </p>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-white mb-4">1. はじめに</h2>
                        <p className="text-slate-300 leading-relaxed">
                            本利用規約（以下「本規約」）は、StarRepo（以下「本サービス」）の利用条件を定めるものです。
                            本サービスをご利用いただく前に、本規約をよくお読みください。
                            本サービスを利用することにより、本規約に同意したものとみなされます。
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-white mb-4">2. サービスの説明</h2>
                        <p className="text-slate-300 leading-relaxed">
                            本サービスは、Robloxプラットフォーム上のゲームに関する情報を収集・整理し、
                            ユーザーがゲームを発見・評価・共有できるプラットフォームを提供します。
                        </p>
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mt-4">
                            <p className="text-yellow-300 text-sm font-medium">
                                ⚠️ 重要: 本サービスはRoblox Corporationとは一切関係のない非公式のファンサイトです。
                                Roblox®、Robloxロゴ、およびPowering Imagination™はRoblox Corporationの商標です。
                            </p>
                        </div>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-white mb-4">3. ユーザーアカウント</h2>
                        <ul className="text-slate-300 space-y-2 list-disc list-inside">
                            <li>本サービスの一部機能を利用するには、アカウント登録が必要です。</li>
                            <li>アカウント情報は正確かつ最新の状態を維持してください。</li>
                            <li>アカウントの安全管理はユーザーの責任となります。</li>
                            <li>他者のアカウントを使用することは禁止されています。</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-white mb-4">4. ユーザーコンテンツ</h2>
                        <p className="text-slate-300 leading-relaxed mb-4">
                            ユーザーが投稿するレビュー、コメント等のコンテンツについて：
                        </p>
                        <ul className="text-slate-300 space-y-2 list-disc list-inside">
                            <li>著作権、商標権その他の知的財産権を侵害しないこと</li>
                            <li>誹謗中傷、差別的表現を含まないこと</li>
                            <li>虚偽の情報を投稿しないこと</li>
                            <li>スパムや広告目的の投稿をしないこと</li>
                            <li>違法なコンテンツを投稿しないこと</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-white mb-4">5. 禁止事項</h2>
                        <ul className="text-slate-300 space-y-2 list-disc list-inside">
                            <li>本サービスの運営を妨害する行為</li>
                            <li>不正アクセスやハッキング行為</li>
                            <li>自動化ツールを使用したスクレイピング</li>
                            <li>他のユーザーへの嫌がらせ</li>
                            <li>法令に違反する行為</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-white mb-4">6. 免責事項</h2>
                        <p className="text-slate-300 leading-relaxed">
                            本サービスは「現状有姿」で提供されます。
                            ゲーム情報の正確性、完全性、最新性について保証するものではありません。
                            本サービスの利用により生じた損害について、当サービスは一切の責任を負いません。
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-white mb-4">7. サービスの変更・終了</h2>
                        <p className="text-slate-300 leading-relaxed">
                            当サービスは、事前の通知なく本サービスの内容を変更、
                            または本サービスの提供を終了することがあります。
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-white mb-4">8. 準拠法</h2>
                        <p className="text-slate-300 leading-relaxed">
                            本規約は日本法に準拠し、解釈されるものとします。
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-white mb-4">9. お問い合わせ</h2>
                        <p className="text-slate-300 leading-relaxed">
                            本規約に関するお問い合わせは、本サービス内のお問い合わせフォームよりご連絡ください。
                        </p>
                    </section>
                </div>
            </div>
        </main>
    );
}
