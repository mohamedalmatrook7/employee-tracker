import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";

/**
 * Server-side Supabase client for Server Components, Route Handlers and Server
 * Actions. The app runs in single-user mode (no login), so this uses the
 * service-role key and bypasses RLS. It must never be imported into client
 * ("use client") code — the service-role key is a server-only secret.
 */
export function createClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}
