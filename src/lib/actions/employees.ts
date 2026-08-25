"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { employeeSchema } from "@/lib/validation";
import { SUPERVISOR_ID } from "@/lib/single-user";

type ActionResult = { error?: string; id?: string };

async function getAuth() {
  return { supabase: createClient(), supervisorId: SUPERVISOR_ID };
}

function normalize(values: { name: string; position?: string; email?: string }) {
  return {
    name: values.name.trim(),
    position: values.position?.trim() ? values.position.trim() : null,
    email: values.email?.trim() ? values.email.trim() : null,
  };
}

export async function createEmployee(values: unknown): Promise<ActionResult> {
  const parsed = employeeSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { supabase, supervisorId } = await getAuth();

  const { data, error } = await supabase
    .from("employees")
    .insert({ supervisor_id: supervisorId, ...normalize(parsed.data) })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/employees");
  revalidatePath("/dashboard");
  return { id: data.id };
}

export async function updateEmployee(
  id: string,
  values: unknown
): Promise<ActionResult> {
  const parsed = employeeSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { supabase } = await getAuth();

  const { error } = await supabase
    .from("employees")
    .update(normalize(parsed.data))
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/employees");
  revalidatePath(`/employees/${id}`);
  revalidatePath("/dashboard");
  return { id };
}

export async function deleteEmployee(id: string): Promise<ActionResult> {
  const { supabase } = await getAuth();
  // ON DELETE CASCADE removes the employee's applications too.
  const { error } = await supabase.from("employees").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/employees");
  revalidatePath("/dashboard");
  return {};
}
