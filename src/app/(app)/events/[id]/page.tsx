import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { EventDetail } from "./event-detail";

export const metadata = { title: "Event" };

export default async function EventPage({
  params,
}: {
  params: { id: string };
}) {
  const { supabase } = await requireUser();

  const [
    { data: event },
    { data: visits },
    { count: employeeCount },
    { count: schoolCount },
  ] = await Promise.all([
    supabase
      .from("events")
      .select(
        "id, name, month, period, target_group, notes, employee_id, employees(name)"
      )
      .eq("id", params.id)
      .maybeSingle(),
    supabase
      .from("event_visits")
      .select(
        "employee_id, status, attendance_count, school_name, visit_date, employees(name)"
      )
      .eq("event_id", params.id)
      .order("sort_order"),
    // Totals come from the system, not this event's progress, so the cards
    // show real figures (e.g. all employees / all schools) from the start.
    supabase.from("employees").select("id", { count: "exact", head: true }),
    supabase
      .from("visit_schedules")
      .select("id", { count: "exact", head: true }),
  ]);

  if (!event) notFound();

  const rows = (visits ?? []) as unknown as VisitRow[];
  const doneRows = rows.filter((v) => v.status === "done");

  const stats: EventStats = {
    schoolsDone: doneRows.length,
    schoolsTotal: schoolCount ?? 0,
    attendance: doneRows.reduce((s, v) => s + (v.attendance_count ?? 0), 0),
    employees: employeeCount ?? 0,
  };

  const completedSchools = doneRows
    .map((v) => ({
      employeeName: v.employees?.name ?? "—",
      school: v.school_name,
      attendance: v.attendance_count,
      date: v.visit_date,
    }))
    .sort((a, b) => a.employeeName.localeCompare(b.employeeName, "ar"));

  const byEmployeeMap = new Map<
    string,
    { employeeName: string; count: number; attendance: number }
  >();
  for (const v of doneRows) {
    const key = v.employee_id;
    const g =
      byEmployeeMap.get(key) ??
      { employeeName: v.employees?.name ?? "—", count: 0, attendance: 0 };
    g.count += 1;
    g.attendance += v.attendance_count ?? 0;
    byEmployeeMap.set(key, g);
  }
  const byEmployee = Array.from(byEmployeeMap.values()).sort((a, b) =>
    a.employeeName.localeCompare(b.employeeName, "ar")
  );

  const breakdown: EventBreakdown = { completedSchools, byEmployee };

  return (
    <EventDetail
      event={event as unknown as EventDetailData}
      stats={stats}
      breakdown={breakdown}
    />
  );
}

type VisitRow = {
  employee_id: string;
  status: "pending" | "done";
  attendance_count: number | null;
  school_name: string;
  visit_date: string | null;
  employees: { name: string } | null;
};

export type EventStats = {
  schoolsDone: number;
  schoolsTotal: number;
  attendance: number;
  employees: number;
};

export type EventBreakdown = {
  completedSchools: {
    employeeName: string;
    school: string;
    attendance: number | null;
    date: string | null;
  }[];
  byEmployee: { employeeName: string; count: number; attendance: number }[];
};

export type EventDetailData = {
  id: string;
  name: string;
  month: string | null;
  period: string | null;
  target_group: string | null;
  notes: string | null;
  employee_id: string | null;
  employees: { name: string } | null;
};
