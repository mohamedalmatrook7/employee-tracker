"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { noticeSchema } from "@/lib/validation";
import { SUPERVISOR_ID } from "@/lib/single-user";

type ActionResult = { error?: string; id?: string };

/** Postgres unique-violation code — a duplicate notice number. */
const UNIQUE_VIOLATION = "23505";

function getAuth() {
  return { supabase: createClient(), supervisorId: SUPERVISOR_ID };
}

/** Trim/normalize the validated form values into a DB row payload. */
function toRow(v: {
  notice_number: string;
  student_name: string;
  cpr?: string | null;
  school_name?: string | null;
  employee_id?: string | null;
  problem_type?: string | null;
  notice_date: string;
}) {
  return {
    notice_number: v.notice_number.trim(),
    student_name: v.student_name.trim(),
    cpr: v.cpr?.trim() || null,
    school_name: v.school_name?.trim() || null,
    employee_id: v.employee_id ? v.employee_id : null,
    problem_type: v.problem_type?.trim() || null,
    notice_date: v.notice_date || null,
  };
}

export async function createNotice(values: unknown): Promise<ActionResult> {
  const parsed = noticeSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { supabase, supervisorId } = getAuth();
  const row = toRow(parsed.data);

  const { data, error } = await supabase
    .from("notices")
    .insert({ supervisor_id: supervisorId, ...row })
    .select("id")
    .single();

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { error: "DUPLICATE_NUMBER" };
    }
    return { error: error.message };
  }
  revalidatePath("/notices");
  revalidatePath("/dashboard");
  return { id: data.id };
}

export async function updateNotice(
  id: string,
  values: unknown
): Promise<ActionResult> {
  const parsed = noticeSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { supabase } = getAuth();
  const row = toRow(parsed.data);

  const { error } = await supabase.from("notices").update(row).eq("id", id);

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { error: "DUPLICATE_NUMBER" };
    }
    return { error: error.message };
  }
  revalidatePath("/notices");
  revalidatePath("/dashboard");
  return { id };
}

export async function deleteNotice(id: string): Promise<ActionResult> {
  const { supabase } = getAuth();
  const { error } = await supabase.from("notices").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/notices");
  revalidatePath("/dashboard");
  return {};
}
