"use client";

import { supabase } from "@/lib/supabase";

export default function Login() {
  const handleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        flowType: "pkce",
        options: {
          redirectTo: `${location.origin}/auth/callback`,
        },
      });
      if (error) console.error(error);
    } catch (e) {
      console.error("signInWithOAuth error", e);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <button onClick={handleSignIn}>Googleでログイン</button>
    </main>
  );
}
