import { signup } from "../auth/actions";
import Link from "next/link";

export default function SignupPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700">
                <h1 className="text-3xl font-bold text-center mb-6 text-white">新規登録</h1>
                <form className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">メールアドレス</label>
                        <input
                            name="email"
                            type="email"
                            required
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">パスワード</label>
                        <input
                            name="password"
                            type="password"
                            required
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none"
                        />
                    </div>
                    <button
                        formAction={signup}
                        className="w-full bg-green-500 hover:bg-green-400 text-white font-bold py-3 rounded-lg transition-colors"
                    >
                        アカウントを作成
                    </button>
                </form>
                <p className="mt-6 text-center text-slate-400 text-sm">
                    Already have an account?{" "}
                    <Link href="/login" className="text-yellow-400 hover:underline">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
}
