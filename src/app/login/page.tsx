"use client";

import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const handleLogin = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
    } catch (error) {
      console.error("signInWithOAuth error", error);
      alert("Googleログインに失敗しました");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <button onClick={handleLogin}>Googleでログイン</button>
    </main>
  );
}
