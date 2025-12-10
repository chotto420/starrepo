import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function DELETE() {
    try {
        // Get current user first
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = user.id;
        const userEmail = user.email;
        console.log("Starting account deletion for user:", userId, userEmail);

        // Create service role client for admin operations
        const serviceClient = createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Delete related data using service role (bypasses RLS)
        // 1. Delete user's review likes first (foreign key dependency)
        const { error: likesError } = await serviceClient.from("review_likes").delete().eq("user_id", userId);
        if (likesError) console.error("Error deleting likes:", likesError);

        // 2. Delete user's reviews
        const { error: reviewsError } = await serviceClient.from("reviews").delete().eq("user_id", userId);
        if (reviewsError) console.error("Error deleting reviews:", reviewsError);

        // 3. Delete user's mylist
        const { error: mylistError } = await serviceClient.from("user_mylist").delete().eq("user_id", userId);
        if (mylistError) console.error("Error deleting mylist:", mylistError);

        // 4. Delete user's profile
        const { error: profileError } = await serviceClient.from("profiles").delete().eq("user_id", userId);
        if (profileError) console.error("Error deleting profile:", profileError);

        // Note: Auth user deletion is handled manually by admin via Supabase Dashboard
        console.log("Account data deleted successfully. Auth user remains for manual cleanup:", userId);

        return NextResponse.json({
            message: "退会処理が完了しました",
            userId: userId
        });
    } catch (error) {
        console.error("Delete account error:", error);
        return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 });
    }
}
