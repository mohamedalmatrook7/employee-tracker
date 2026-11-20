"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { incomingCaseSchema } from "@/lib/validation";
import { resolveManagement } from "@/lib/managements-helpers";
import { SUPERVISOR_ID } from "@/lib/single-user";

type ActionResult = { error?: string; id?: string };

function getAuth() {
  return { supabase: createClient(), supervisorId: SUPERVISOR_ID };
}

export async function createIncomingCase(values: unknown): Promise<ActionResult> {
  const parsed = incomingCaseSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { supabase, supervisorId } = getAuth();
  const v = parsed.data;

  // Guard: the employee must belong to this supervisor (RLS also enforces this).
  const { data: employee } = await supabase
    .from("employees")
    .select("id")
    .eq("id", v.employee_id)
    .maybeSingle();
  if (!employee) return { error: "Employee not found." };

  const mgmt = await resolveManagement(
    supabase,
    supervisorId,
    v.management_id ?? null,
    v.management_name ?? null
  );

  const { data, error } = await supabase
    .from("incoming_cases")
    .insert({
      supervisor_id: supervisorId,
      employee_id: v.employee_id,
      management_id: mgmt.management_id,
      management_name: mgmt.management_name,
      school_name: v.school_name?.trim() || null,
      student_name: v.student_name?.trim() || null,
      student_cpr: v.student_cpr?.trim() || null,
      case_number: v.case_number.trim(),
      case_date: v.case_date,
      notes: v.notes?.trim() || null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/incoming-cases");
  revalidatePath("/dashboard");
  return { id: data.id };
}

export async function updateIncomingCase(
  id: string,
  values: unknown
): Promise<ActionResult> {
  const parsed = incomingCaseSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { supabase, supervisorId } = getAuth();
  const v = parsed.data;

  const mgmt = await resolveManagement(
    supabase,
    supervisorId,
    v.management_id ?? null,
    v.management_name ?? null
  );

  const { error } = await supabase
    .from("incoming_cases")
    .update({
      employee_id: v.employee_id,
      management_id: mgmt.management_id,
      management_name: mgmt.management_name,
      school_name: v.school_name?.trim() || null,
      student_name: v.student_name?.trim() || null,
      student_cpr: v.student_cpr?.trim() || null,
      case_number: v.case_number.trim(),
      case_date: v.case_date,
      notes: v.notes?.trim() || null,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/incoming-cases");
  revalidatePath("/dashboard");
  revalidatePath(`/incoming-cases/${id}`);
  return { id };
}

export async function deleteIncomingCase(id: string): Promise<ActionResult> {
  const { supabase } = getAuth();
  const { error } = await supabase.from("incoming_cases").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/incoming-cases");
  revalidatePath("/dashboard");
  return {};
}
