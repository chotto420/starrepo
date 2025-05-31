"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  useEffect(() => {
    (async () => {
      // ① クエリ文字列から code を取得
      const code = new URLSearchParams(window.location.search).get("code");
      if (!code) {
        alert("認証コード(code)が URL に見つかりません");
        console.error("callback URL", window.location.href);
        return;
      }

      try {
        // ② 認可コードを Supabase へ渡してセッション化
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        // ③ デバッグログ出力
        console.log("★ exchange result", { data, error });

        if (error) {
          console.error("exchangeCodeForSession error", error);
          alert(`ログイン失敗: ${error.message}`);
          return;
        }

        // ④ 成功したらトップへ
        window.location.replace("/");
      } catch (e) {
        console.error("unexpected error", e);
        alert("ログイン処理で予期せぬエラーが発生しました");
      }
    })();
  }, []); // ← 必ず依存配列を空に

  return <p style={{ textAlign: "center" }}>Signing&nbsp;in…</p>;
}
