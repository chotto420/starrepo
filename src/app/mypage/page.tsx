"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function MyPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        // `data.user.email` can be `undefined` in some cases,
        // but the state expects `string | null`.
        setUserEmail(data.user.email ?? null);
      } else {
        router.replace("/login");
      }
    });
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (!userEmail) {
    return <p className="p-4">Loading...</p>;
  }

  return (
    <main className="min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">マイページ</h1>
      <p className="mb-6">ようこそ、{userEmail} さん</p>
      <button
        onClick={handleLogout}
        className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700"
      >
        ログアウト
      </button>
    </main>
  );
}
