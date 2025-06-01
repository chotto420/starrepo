"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function Callback() {
  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const authCode = params.get("code");

      if (!authCode) {
        alert("認可コード(code)が URL にありません");
        console.error("callback URL", window.location.href);
        return;
      }

      // ① localStorage から code_verifier を探す
      const verifierKey = Object.keys(localStorage).find((k) =>
        k.endsWith("-auth-token-code-verifier")
      );
      const codeVerifier = verifierKey ? localStorage.getItem(verifierKey) : null;

      console.log("★ authCode", authCode);
      console.log("★ codeVerifier", codeVerifier);

      if (!codeVerifier) {
        alert("code_verifier が取得できませんでした");
        return;
      }

      try {
        // ② 認可コード＋code_verifier を Supabase に交換
        const { data, error } = await supabase.auth.exchangeCodeForSession({
          authCode,
          codeVerifier,
        });
        console.log("★ exchange result", { data, error });

        if (error) {
          console.error(error);
          alert(`ログイン失敗: ${error.message}`);
          return;
        }

        // ③ 成功 → トップへ
        window.location.replace("/");
      } catch (e) {
        console.error("unexpected error", e);
        alert("予期せぬエラーが発生しました");
      }
    })();
  }, []);

  return <p style={{ textAlign: "center" }}>Signing&nbsp;in…</p>;
}
