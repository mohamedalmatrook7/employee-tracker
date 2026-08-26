"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { eventSchema } from "@/lib/validation";
import { SUPERVISOR_ID } from "@/lib/single-user";

type ActionResult = { error?: string; id?: string };

function getAuth() {
  return { supabase: createClient(), supervisorId: SUPERVISOR_ID };
}

function normalize(values: {
  name: string;
  month?: string;
  period?: string;
  target_group?: string;
  notes?: string;
  employee_id?: string | null;
}) {
  const opt = (v?: string | null) => (v && v.trim() ? v.trim() : null);
  return {
    name: values.name.trim(),
    month: opt(values.month),
    period: opt(values.period),
    target_group: opt(values.target_group),
    notes: opt(values.notes),
    employee_id: opt(values.employee_id),
  };
}

export async function createEvent(values: unknown): Promise<ActionResult> {
  const parsed = eventSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { supabase, supervisorId } = getAuth();

  const { data, error } = await supabase
    .from("events")
    .insert({ supervisor_id: supervisorId, ...normalize(parsed.data) })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/events");
  return { id: data.id };
}

export async function updateEvent(
  id: string,
  values: unknown
): Promise<ActionResult> {
  const parsed = eventSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { supabase } = getAuth();

  const { error } = await supabase
    .from("events")
    .update(normalize(parsed.data))
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/events");
  revalidatePath(`/events/${id}`);
  return { id };
}

export async function deleteEvent(id: string): Promise<ActionResult> {
  const { supabase } = getAuth();
  // ON DELETE CASCADE removes this event's per-event visit copies too.
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/events");
  return {};
}
