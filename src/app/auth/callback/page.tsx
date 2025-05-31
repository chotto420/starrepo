"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  useEffect(() => {
    const exchange = async () => {
      try {
        const { error } = await supabase.auth.exchangeCodeForSession();
        if (error) {
          console.error("exchangeCodeForSession error", error);
          alert("ログインに失敗しました");
          return;
        }
        location.replace("/");
      } catch (err) {
        console.error("exchangeCodeForSession error", err);
        alert("ログインに失敗しました");
      }
    };
    exchange();
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <p>Signing in…</p>
    </main>
  );
}
