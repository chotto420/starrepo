import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Admin client that bypasses RLS using service role key
// Only use this for admin operations that need to bypass RLS
export function createAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
        console.warn("SUPABASE_SERVICE_ROLE_KEY not set, using anon key (RLS will apply)");
        return createSupabaseClient(
            supabaseUrl,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
    }

    return createSupabaseClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}
