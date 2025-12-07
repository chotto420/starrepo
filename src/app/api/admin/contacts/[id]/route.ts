import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const admin = await isAdmin();
    if (!admin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const { status } = await request.json();

        if (!["pending", "read", "replied", "closed"].includes(status)) {
            return NextResponse.json(
                { error: "Invalid status" },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        const { error } = await supabase
            .from("contacts")
            .update({ status, updated_at: new Date().toISOString() })
            .eq("id", parseInt(id));

        if (error) {
            console.error("Failed to update contact:", error);
            return NextResponse.json(
                { error: "Failed to update contact" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Admin contact update API error:", error);
        return NextResponse.json(
            { error: "Server error" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const admin = await isAdmin();
    if (!admin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const supabase = createAdminClient();

        const { error } = await supabase
            .from("contacts")
            .delete()
            .eq("id", parseInt(id));

        if (error) {
            console.error("Failed to delete contact:", error);
            return NextResponse.json(
                { error: "Failed to delete contact" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Admin contact delete API error:", error);
        return NextResponse.json(
            { error: "Server error" },
            { status: 500 }
        );
    }
}
