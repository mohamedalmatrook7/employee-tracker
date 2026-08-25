import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";

type DB = SupabaseClient<Database>;

/**
 * Resolves a management for an application. If `id` is given, use it; otherwise
 * if a name was typed, find-or-create a management with that name (so it's
 * reusable next time) and return its id. Returns the id (or null) plus the
 * denormalized snapshot name to store on the application.
 *
 * Not a server action — a plain helper called from within server actions.
 */
export async function resolveManagement(
  supabase: DB,
  supervisorId: string,
  id: string | null | undefined,
  name: string | null | undefined
): Promise<{ management_id: string | null; management_name: string | null }> {
  const trimmed = (name ?? "").trim();

  if (id) {
    return { management_id: id, management_name: trimmed || null };
  }
  if (!trimmed) {
    return { management_id: null, management_name: null };
  }

  // Try to find an existing one (case-insensitive) before creating.
  const { data: existing } = await supabase
    .from("managements")
    .select("id, name")
    .eq("supervisor_id", supervisorId)
    .ilike("name", trimmed)
    .maybeSingle();

  if (existing) {
    return { management_id: existing.id, management_name: existing.name };
  }

  const { data: created, error } = await supabase
    .from("managements")
    .insert({ supervisor_id: supervisorId, name: trimmed })
    .select("id, name")
    .single();

  if (error || !created) {
    // Fall back to a free-text snapshot if creation failed.
    return { management_id: null, management_name: trimmed };
  }
  return { management_id: created.id, management_name: created.name };
}
