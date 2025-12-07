import Link from "next/link";
import { ChevronLeft, AlertTriangle } from "lucide-react";

export const metadata = {
    title: "免責事項 - StarRepo",
    description: "StarRepoの免責事項",
};

export default function DisclaimerPage() {
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
                                <AlertTriangle className="w-6 h-6 text-yellow-400" />
                                免責事項
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

                    {/* Important Notice */}
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 mb-8">
                        <h2 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            重要なお知らせ
                        </h2>
                        <p className="text-yellow-200 leading-relaxed text-lg">
                            <strong>StarRepoはRoblox Corporationとは一切関係のない非公式のファンサイトです。</strong>
                        </p>
                        <p className="text-yellow-300/80 leading-relaxed mt-3">
                            本サービスはRoblox Corporationによって承認、後援、またはその他の方法で支持されているものではありません。
                        </p>
                    </div>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-white mb-4">1. 商標について</h2>
                        <p className="text-slate-300 leading-relaxed">
                            Roblox®、Robloxロゴ、Powering Imagination™、およびその他のRoblox関連の商標は、
                            Roblox Corporationの登録商標または商標です。
                            本サービスにおけるこれらの商標の使用は、識別目的のみであり、
                            Roblox Corporationとの提携や承認を示すものではありません。
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-white mb-4">2. ゲーム情報について</h2>
                        <p className="text-slate-300 leading-relaxed">
                            本サービスに掲載されているゲーム情報（タイトル、説明、サムネイル、統計情報など）は、
                            Roblox APIを通じて取得したものです。
                        </p>
                        <ul className="text-slate-300 space-y-2 list-disc list-inside mt-4">
                            <li>情報の正確性、完全性、最新性を保証するものではありません</li>
                            <li>ゲームの内容や可用性は予告なく変更される場合があります</li>
                            <li>各ゲームの権利は、それぞれのクリエイターに帰属します</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-white mb-4">3. ユーザーレビューについて</h2>
                        <p className="text-slate-300 leading-relaxed">
                            本サービスに投稿されるレビューや評価は、各ユーザーの個人的な意見であり、
                            本サービスの見解を代表するものではありません。
                            レビュー内容の正確性や信頼性について、本サービスは責任を負いません。
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-white mb-4">4. 外部リンクについて</h2>
                        <p className="text-slate-300 leading-relaxed">
                            本サービスからRobloxプラットフォームや他の外部サイトへのリンクが含まれる場合があります。
                            リンク先のコンテンツや安全性について、本サービスは責任を負いません。
                            外部サイトの利用は、ユーザー自身の責任において行ってください。
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-white mb-4">5. サービスの可用性</h2>
                        <p className="text-slate-300 leading-relaxed">
                            本サービスは「現状有姿」で提供されます。
                            サービスの中断、エラー、データ損失などについて、本サービスは責任を負いません。
                            また、Roblox APIの変更や制限により、本サービスの機能が影響を受ける可能性があります。
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-white mb-4">6. 損害の免責</h2>
                        <p className="text-slate-300 leading-relaxed">
                            本サービスの利用または利用不能により生じた直接的、間接的、偶発的、
                            特別、または結果的な損害について、本サービスは一切の責任を負いません。
                            これには、利益の損失、データの損失、またはビジネスの中断が含まれますが、
                            これらに限定されません。
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-white mb-4">7. 年齢制限</h2>
                        <p className="text-slate-300 leading-relaxed">
                            本サービスは全年齢を対象としていますが、
                            13歳未満のユーザーはRobloxの利用規約に従い、保護者の同意が必要です。
                            本サービスで紹介するゲームには年齢制限があるものも含まれる場合があります。
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-white mb-4">8. 関連規約</h2>
                        <p className="text-slate-300 leading-relaxed mb-4">
                            本免責事項は以下の規約と併せてお読みください：
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link
                                href="/terms"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 hover:text-white transition-colors"
                            >
                                📜 利用規約
                            </Link>
                            <Link
                                href="/privacy"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 hover:text-white transition-colors"
                            >
                                🔒 プライバシーポリシー
                            </Link>
                        </div>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-white mb-4">9. お問い合わせ</h2>
                        <p className="text-slate-300 leading-relaxed">
                            本免責事項に関するお問い合わせは、本サービス内のお問い合わせフォームよりご連絡ください。
                        </p>
                    </section>
                </div>
            </div>
        </main>
    );
}
