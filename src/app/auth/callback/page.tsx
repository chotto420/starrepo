"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function Callback() {
  useEffect(() => {
    (async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(
        window.location.href
      );
      if (error) {
        console.error(error);
        alert(`ログイン失敗: ${error.message}`);
      } else {
        location.replace("/");
      }
    })();
  }, []);

  return <p style={{ textAlign: "center" }}>Signing&nbsp;in…</p>;
}
