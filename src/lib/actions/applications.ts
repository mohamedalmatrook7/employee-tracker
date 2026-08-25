"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { applicationSchema, feedbackSchema } from "@/lib/validation";
import { resolveManagement } from "@/lib/managements-helpers";
import { SUPERVISOR_ID } from "@/lib/single-user";

type ActionResult = { error?: string; id?: string };

async function getAuth() {
  return { supabase: createClient(), supervisorId: SUPERVISOR_ID };
}

type DB = ReturnType<typeof createClient>;

/**
 * Revalidate every page that shows an application's derived state, so status
 * changes (e.g. adding feedback flips pending → done) show up everywhere: the
 * dashboard, the owning employee's page and the related management's page.
 */
async function revalidateAppPaths(supabase: DB, id: string) {
  const { data } = await supabase
    .from("applications")
    .select("employee_id, management_id")
    .eq("id", id)
    .maybeSingle();

  revalidatePath("/dashboard");
  revalidatePath("/employees");
  revalidatePath("/managements");
  revalidatePath(`/applications/${id}`);
  if (data?.employee_id) revalidatePath(`/employees/${data.employee_id}`);
  if (data?.management_id) revalidatePath(`/managements/${data.management_id}`);
}

export async function createApplication(values: unknown): Promise<ActionResult> {
  const parsed = applicationSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { supabase, supervisorId } = await getAuth();
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
    .from("applications")
    .insert({
      supervisor_id: supervisorId,
      employee_id: v.employee_id,
      management_id: mgmt.management_id,
      management_name: mgmt.management_name,
      content: v.content,
      application_date: v.application_date,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/employees");
  revalidatePath("/managements");
  revalidatePath(`/employees/${v.employee_id}`);
  if (mgmt.management_id) revalidatePath(`/managements/${mgmt.management_id}`);
  return { id: data.id };
}

export async function updateApplication(
  id: string,
  values: unknown
): Promise<ActionResult> {
  const parsed = applicationSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { supabase, supervisorId } = await getAuth();
  const v = parsed.data;

  const mgmt = await resolveManagement(
    supabase,
    supervisorId,
    v.management_id ?? null,
    v.management_name ?? null
  );

  const { error } = await supabase
    .from("applications")
    .update({
      employee_id: v.employee_id,
      management_id: mgmt.management_id,
      management_name: mgmt.management_name,
      content: v.content,
      application_date: v.application_date,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/employees");
  revalidatePath("/managements");
  revalidatePath(`/applications/${id}`);
  revalidatePath(`/employees/${v.employee_id}`);
  if (mgmt.management_id) revalidatePath(`/managements/${mgmt.management_id}`);
  return { id };
}

export async function deleteApplication(
  id: string,
  employeeId?: string
): Promise<ActionResult> {
  const { supabase } = await getAuth();
  // Capture the links before deleting so we can refresh the related pages.
  const { data: existing } = await supabase
    .from("applications")
    .select("employee_id, management_id")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("applications").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/employees");
  revalidatePath("/managements");
  const empId = existing?.employee_id ?? employeeId;
  if (empId) revalidatePath(`/employees/${empId}`);
  if (existing?.management_id)
    revalidatePath(`/managements/${existing.management_id}`);
  return {};
}

/** Create or edit feedback. Setting feedback_text flips status to "done". */
export async function saveFeedback(
  id: string,
  values: unknown
): Promise<ActionResult> {
  const parsed = feedbackSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { supabase } = await getAuth();

  const { error } = await supabase
    .from("applications")
    .update({
      feedback_text: parsed.data.feedback_text,
      feedback_date: parsed.data.feedback_date,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  await revalidateAppPaths(supabase, id);
  return { id };
}

/** Clear feedback, returning the application to "pending". */
export async function clearFeedback(id: string): Promise<ActionResult> {
  const { supabase } = await getAuth();
  const { error } = await supabase
    .from("applications")
    .update({ feedback_text: null, feedback_date: null })
    .eq("id", id);
  if (error) return { error: error.message };
  await revalidateAppPaths(supabase, id);
  return { id };
}
