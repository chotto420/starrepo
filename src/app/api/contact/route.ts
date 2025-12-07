import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
    try {
        const { name, email, subject, message } = await request.json();

        // Validation
        if (!name || !email || !subject || !message) {
            return NextResponse.json(
                { error: "すべての項目を入力してください" },
                { status: 400 }
            );
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: "有効なメールアドレスを入力してください" },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Get current user (optional)
        const { data: { user } } = await supabase.auth.getUser();

        // Insert contact
        const { error } = await supabase.from("contacts").insert({
            name,
            email,
            subject,
            message,
            user_id: user?.id || null,
        });

        if (error) {
            console.error("Failed to submit contact:", error);
            return NextResponse.json(
                { error: "送信に失敗しました" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Contact API error:", error);
        return NextResponse.json(
            { error: "サーバーエラーが発生しました" },
            { status: 500 }
        );
    }
}
