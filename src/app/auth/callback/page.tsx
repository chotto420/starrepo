"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  useEffect(() => {
    (async () => {
      try {
        // ① URL から code / state を読み取り、セッション化
        const { data, error } = await supabase.auth.getSessionFromUrl({
          storeSession: true,
          redirectTo: "/",
        });

        // ② デバッグログ（必要なら残す）
        console.log("★ getSessionFromUrl", { data, error });

        if (error) {
          console.error(error);
          alert(`ログイン失敗: ${error.message}`);
          return;
        }

        // ③ 正常ならトップへ
        window.location.replace("/");
      } catch (e) {
        console.error("unexpected error", e);
        alert("予期せぬエラーが発生しました");
      }
    })();
  }, []);

  return <p style={{ textAlign: "center" }}>Signing&nbsp;in…</p>;
}
