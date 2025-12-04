import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "ファイルがありません" }, { status: 400 });
        }

        // ファイルサイズチェック（2MB）
        if (file.size > 2 * 1024 * 1024) {
            return NextResponse.json({ error: "ファイルサイズは2MB以下にしてください" }, { status: 400 });
        }

        // ファイル形式チェック
        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: "JPEG、PNG、WebP形式の画像のみアップロード可能です" }, { status: 400 });
        }

        // ファイル名を生成（user_id + タイムスタンプ + 拡張子）
        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        // Supabase Storage にアップロード
        const { data, error } = await supabase.storage
            .from("avatars")
            .upload(filePath, file, {
                cacheControl: "3600",
                upsert: false,
            });

        if (error) {
            console.error("Upload error:", error);
            return NextResponse.json({ error: "画像のアップロードに失敗しました" }, { status: 500 });
        }

        // 公開URLを取得
        const { data: urlData } = supabase.storage
            .from("avatars")
            .getPublicUrl(filePath);

        return NextResponse.json({
            message: "画像をアップロードしました",
            url: urlData.publicUrl,
        });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "画像のアップロードに失敗しました" }, { status: 500 });
    }
}
