"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          flowType: "pkce",
        },
      });
    } catch (error) {
      console.error("signInWithOAuth error", error);
      alert("Googleログインに失敗しました");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">ログイン</h1>
      <button
        onClick={handleLogin}
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Signing in…" : "Googleでログイン"}
      </button>
    </main>
  );
}
