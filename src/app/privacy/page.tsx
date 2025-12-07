import Link from "next/link";
import { ChevronLeft, Shield } from "lucide-react";

export const metadata = {
    title: "プライバシーポリシー - StarRepo",
    description: "StarRepoのプライバシーポリシー",
};

export default function PrivacyPage() {
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
                                <Shield className="w-6 h-6 text-green-400" />
                                プライバシーポリシー
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
                            StarRepo（以下「本サービス」）は、ユーザーのプライバシーを尊重し、
                            個人情報の保護に努めています。本プライバシーポリシーでは、
                            本サービスが収集する情報、その利用方法、および保護方法について説明します。
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-white mb-4">2. 収集する情報</h2>

                        <h3 className="text-lg font-semibold text-slate-200 mt-6 mb-3">2.1 アカウント情報</h3>
                        <ul className="text-slate-300 space-y-2 list-disc list-inside">
                            <li>メールアドレス（アカウント認証に使用）</li>
                            <li>ユーザー名（任意で設定）</li>
                            <li>プロフィール画像（任意でアップロード）</li>
                            <li>自己紹介文（任意で設定）</li>
                        </ul>

                        <h3 className="text-lg font-semibold text-slate-200 mt-6 mb-3">2.2 ユーザー生成コンテンツ</h3>
                        <ul className="text-slate-300 space-y-2 list-disc list-inside">
                            <li>ゲームレビュー・評価</li>
                            <li>マイリスト（お気に入りゲーム）</li>
                        </ul>

                        <h3 className="text-lg font-semibold text-slate-200 mt-6 mb-3">2.3 自動的に収集される情報</h3>
                        <ul className="text-slate-300 space-y-2 list-disc list-inside">
                            <li>アクセスログ（IPアドレス、ブラウザ情報など）</li>
                            <li>Cookie情報</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-white mb-4">3. 情報の利用目的</h2>
                        <p className="text-slate-300 leading-relaxed mb-4">
                            収集した情報は以下の目的で利用します：
                        </p>
                        <ul className="text-slate-300 space-y-2 list-disc list-inside">
                            <li>本サービスの提供・運営</li>
                            <li>ユーザー認証・アカウント管理</li>
                            <li>サービスの改善・新機能の開発</li>
                            <li>不正利用の防止・セキュリティ確保</li>
                            <li>お問い合わせへの対応</li>
                        </ul>

                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mt-4">
                            <p className="text-green-300 text-sm font-medium">
                                ✓ 当サービスは、収集したデータをAIや機械学習のトレーニングに使用しません。
                                また、ユーザーデータの第三者への販売は一切行いません。
                            </p>
                        </div>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-white mb-4">4. 第三者への提供</h2>
                        <p className="text-slate-300 leading-relaxed">
                            以下の場合を除き、ユーザーの個人情報を第三者に提供することはありません：
                        </p>
                        <ul className="text-slate-300 space-y-2 list-disc list-inside mt-4">
                            <li>ユーザーの同意がある場合</li>
                            <li>法令に基づく場合</li>
                            <li>人の生命、身体または財産の保護のために必要がある場合</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-white mb-4">5. Cookieの使用</h2>
                        <p className="text-slate-300 leading-relaxed">
                            本サービスでは、ユーザー認証およびサービス改善のためにCookieを使用しています。
                            ブラウザの設定によりCookieを無効にすることができますが、
                            その場合、一部の機能が正常に動作しない可能性があります。
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-white mb-4">6. 外部サービス</h2>
                        <p className="text-slate-300 leading-relaxed mb-4">
                            本サービスは以下の外部サービスを利用しています：
                        </p>
                        <ul className="text-slate-300 space-y-2 list-disc list-inside">
                            <li><strong>Supabase</strong>: 認証・データベースサービス</li>
                            <li><strong>Roblox API</strong>: ゲーム情報の取得</li>
                        </ul>
                        <p className="text-slate-300 leading-relaxed mt-4">
                            各サービスのプライバシーポリシーについては、それぞれのサービス提供元をご確認ください。
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-white mb-4">7. データの保管</h2>
                        <p className="text-slate-300 leading-relaxed">
                            ユーザーデータは適切なセキュリティ対策を施したサーバーに保管されます。
                            アカウント削除時には、関連するデータは適切な期間内に削除されます。
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-white mb-4">8. ユーザーの権利</h2>
                        <p className="text-slate-300 leading-relaxed">
                            ユーザーは以下の権利を有します：
                        </p>
                        <ul className="text-slate-300 space-y-2 list-disc list-inside mt-4">
                            <li>自身の個人情報へのアクセス</li>
                            <li>個人情報の訂正・更新</li>
                            <li>アカウントの削除</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-white mb-4">9. 変更について</h2>
                        <p className="text-slate-300 leading-relaxed">
                            本プライバシーポリシーは、必要に応じて変更されることがあります。
                            重要な変更がある場合は、本サービス上で通知します。
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-white mb-4">10. お問い合わせ</h2>
                        <p className="text-slate-300 leading-relaxed">
                            本ポリシーに関するお問い合わせは、本サービス内のお問い合わせフォームよりご連絡ください。
                        </p>
                    </section>
                </div>
            </div>
        </main>
    );
}
