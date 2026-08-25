import type { Profile } from "@/lib/database.types";

/**
 * Single-user mode. The app has no login — every request acts as this one
 * fixed supervisor. Keep SUPERVISOR_ID in sync with the seeded profile in
 * supabase/migrations/0002_single_user.sql.
 */
export const SUPERVISOR_ID = "00000000-0000-0000-0000-000000000001";

export const SUPERVISOR_NAME = "Sana Shaker Alderazi";

/** Contact details shown in the dashboard header. Not translated. */
export const SUPERVISOR_EMAIL = "sana.s.aldurazi@moe.gov.bh";
export const SUPERVISOR_PHONE = "(+973) 17873083";

export const SANAA_PROFILE: Profile = {
  id: SUPERVISOR_ID,
  full_name: SUPERVISOR_NAME,
  email: SUPERVISOR_EMAIL,
  created_at: new Date(0).toISOString(),
};
