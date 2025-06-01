"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const state = params.get("state");

      // ★ デバッグ: URL と localStorage を確認
      console.log("★ URL code/state", { code, state });
      console.log("★ localStorage keys", Object.keys(localStorage));
      console.log(
        "★ code_verifier",
        localStorage.getItem("supabase.auth.code_verifier")
      );

      if (!code) {
        alert("認可コード(code)が見つかりません");
        return;
      }

      try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        console.log("★ exchange result", { data, error });

        if (error) {
          alert(`ログイン失敗: ${error.message}`);
          return;
        }
        window.location.replace("/");
      } catch (e) {
        console.error("unexpected error", e);
        alert("予期せぬエラーが発生しました");
      }
    })();
  }, []);

  return <p style={{ textAlign: "center" }}>Signing&nbsp;in…</p>;
}
