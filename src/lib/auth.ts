import { createClient } from "@/lib/supabase/server";
import { SANAA_PROFILE, SUPERVISOR_ID } from "@/lib/single-user";

/**
 * Single-user mode: there is no login. This returns the one fixed supervisor
 * (Sanaa Shaker) and a server Supabase client. The signature is kept so pages
 * and layouts can keep calling it unchanged.
 */
export async function requireUser() {
  const supabase = createClient();
  return {
    supabase,
    user: { id: SUPERVISOR_ID, email: SANAA_PROFILE.email ?? "" },
    profile: SANAA_PROFILE,
  };
}
