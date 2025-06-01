"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function Callback() {
  useEffect(() => {
    (async () => {
      try {
        // ① URL に含まれる code & state を解析しセッション保存
        const { data, error } = await supabase.auth.getSessionFromUrl({
          storeSession: true, // ← セッションを supabase に保持
          // redirectTo を指定しない場合は何もしない
        });

        // ② デバッグログ（必要なら残す）
        console.log("★ getSessionFromUrl", { data, error });

        if (error) {
          console.error(error);
          alert(`ログイン失敗: ${error.message}`);
          return;
        }

        // ② 正常ならトップへ遷移
        window.location.replace("/");
      } catch (e) {
        console.error("unexpected error", e);
        alert("予期せぬエラーが発生しました");
      }
    })();
  }, []);

  return <p style={{ textAlign: "center" }}>Signing&nbsp;in…</p>;
}
