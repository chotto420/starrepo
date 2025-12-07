import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
    const admin = await isAdmin();
    if (!admin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const supabase = createAdminClient();

        const { data: contacts, error } = await supabase
            .from("contacts")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Failed to fetch contacts:", error);
            return NextResponse.json(
                { error: "Failed to fetch contacts" },
                { status: 500 }
            );
        }

        return NextResponse.json(contacts);
    } catch (error) {
        console.error("Admin contacts API error:", error);
        return NextResponse.json(
            { error: "Server error" },
            { status: 500 }
        );
    }
}
