"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { managementSchema } from "@/lib/validation";
import { SUPERVISOR_ID } from "@/lib/single-user";

type ActionResult = { error?: string };

async function getSupervisorId() {
  return { supabase: createClient(), supervisorId: SUPERVISOR_ID };
}

export async function createManagement(
  values: unknown
): Promise<ActionResult> {
  const parsed = managementSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { supabase, supervisorId } = await getSupervisorId();

  const { error } = await supabase
    .from("managements")
    .insert({ supervisor_id: supervisorId, name: parsed.data.name });

  if (error) {
    if (error.code === "23505") {
      return { error: "You already have a management with that name." };
    }
    return { error: error.message };
  }
  revalidatePath("/managements");
  return {};
}

export async function renameManagement(
  id: string,
  values: unknown
): Promise<ActionResult> {
  const parsed = managementSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { supabase } = await getSupervisorId();

  const { error } = await supabase
    .from("managements")
    .update({ name: parsed.data.name })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return { error: "You already have a management with that name." };
    }
    return { error: error.message };
  }

  // Refresh denormalized snapshots on applications still linked to this one.
  await supabase
    .from("applications")
    .update({ management_name: parsed.data.name })
    .eq("management_id", id);

  revalidatePath("/managements");
  revalidatePath("/dashboard");
  return {};
}

export async function deleteManagement(id: string): Promise<ActionResult> {
  const { supabase } = await getSupervisorId();
  // ON DELETE SET NULL detaches applications but keeps their management_name
  // snapshot, so past applications are unaffected.
  const { error } = await supabase.from("managements").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/managements");
  return {};
}
