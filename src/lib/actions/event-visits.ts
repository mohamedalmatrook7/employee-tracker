"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { eventVisitSchema } from "@/lib/validation";
import { SUPERVISOR_ID } from "@/lib/single-user";
import type { Database, VisitStatus } from "@/lib/database.types";

type EventVisitUpdate = Database["public"]["Tables"]["event_visits"]["Update"];

/** The per-row shape the event-detail UI renders and edits. */
export type EventVisitRow = {
  id: string;
  school_name: string;
  visit_date: string | null;
  attendance_count: number | null;
  status: VisitStatus;
  sort_order: number;
};

const ROW_COLS =
  "id, school_name, visit_date, attendance_count, status, sort_order";

function getAuth() {
  return { supabase: createClient(), supervisorId: SUPERVISOR_ID };
}

/**
 * Returns the per-event visit rows for one employee, creating them the first
 * time by cloning the employee's master جدول الزيارات (visit_schedules). Each
 * event keeps its own editable copy, so edits here never touch the master or
 * other events.
 */
export async function loadEventSchedule(
  eventId: string,
  employeeId: string
): Promise<{ rows?: EventVisitRow[]; error?: string }> {
  const { supabase, supervisorId } = getAuth();

  const { data: existing, error: exErr } = await supabase
    .from("event_visits")
    .select(ROW_COLS)
    .eq("event_id", eventId)
    .eq("employee_id", employeeId)
    .order("sort_order");
  if (exErr) return { error: exErr.message };
  if (existing && existing.length > 0) {
    return { rows: existing as EventVisitRow[] };
  }

  // First open for this event + employee: clone from the master schedule.
  const { data: master, error: mErr } = await supabase
    .from("visit_schedules")
    .select("id, school_name, visit_date, sort_order")
    .eq("employee_id", employeeId)
    .order("sort_order");
  if (mErr) return { error: mErr.message };
  if (!master || master.length === 0) return { rows: [] };

  const toInsert = master.map((m) => ({
    supervisor_id: supervisorId,
    event_id: eventId,
    employee_id: employeeId,
    school_name: m.school_name,
    visit_date: m.visit_date,
    sort_order: m.sort_order,
    source_schedule_id: m.id,
    status: "pending" as const,
  }));

  const { data: inserted, error: insErr } = await supabase
    .from("event_visits")
    .insert(toInsert)
    .select(ROW_COLS)
    .order("sort_order");
  if (insErr) return { error: insErr.message };
  revalidatePath(`/events/${eventId}`);
  return { rows: (inserted ?? []) as EventVisitRow[] };
}

/** Patch a single editable field-set on one per-event visit row. */
export async function updateEventVisit(
  id: string,
  patch: {
    school_name?: string;
    visit_date?: string | null;
    attendance_count?: number | null;
    status?: VisitStatus;
  }
): Promise<{ error?: string }> {
  const parsed = eventVisitSchema.partial().safeParse(patch);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const p = parsed.data;

  const update: EventVisitUpdate = {};
  if (p.school_name !== undefined) update.school_name = p.school_name.trim();
  if (p.visit_date !== undefined)
    update.visit_date = p.visit_date ? p.visit_date : null;
  if (p.attendance_count !== undefined)
    update.attendance_count = p.attendance_count ?? null;
  if (p.status !== undefined) update.status = p.status;

  if (Object.keys(update).length === 0) return {};

  const { supabase } = getAuth();
  const { error } = await supabase
    .from("event_visits")
    .update(update)
    .eq("id", id);
  if (error) return { error: error.message };
  return {};
}

/** Append a new blank visit row for this event + employee. */
export async function addEventVisit(
  eventId: string,
  employeeId: string
): Promise<{ row?: EventVisitRow; error?: string }> {
  const { supabase, supervisorId } = getAuth();

  const { data: last } = await supabase
    .from("event_visits")
    .select("sort_order")
    .eq("event_id", eventId)
    .eq("employee_id", employeeId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = (last?.sort_order ?? 0) + 1;

  const { data, error } = await supabase
    .from("event_visits")
    .insert({
      supervisor_id: supervisorId,
      event_id: eventId,
      employee_id: employeeId,
      school_name: "",
      visit_date: null,
      status: "pending" as const,
      sort_order: nextOrder,
    })
    .select(ROW_COLS)
    .single();
  if (error) return { error: error.message };
  return { row: data as EventVisitRow };
}

export async function deleteEventVisit(
  id: string
): Promise<{ error?: string }> {
  const { supabase } = getAuth();
  const { error } = await supabase.from("event_visits").delete().eq("id", id);
  if (error) return { error: error.message };
  return {};
}
