"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const exchange = async () => {
      try {
        const code = new URLSearchParams(window.location.search).get("code");
        if (!code) {
          setError("認証コードが見つかりません");
          return;
        }
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error("exchangeCodeForSession error", error);
          alert("ログインに失敗しました");
          setError("認証に失敗しました");
          return;
        }
        location.replace("/");
      } catch (err) {
        console.error("exchangeCodeForSession error", err);
        alert("ログインに失敗しました");
        setError("認証に失敗しました");
      }
    };
    exchange();
  }, []);

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <p className="text-red-600">{error}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <p>Signing in…</p>
    </main>
  );
}
