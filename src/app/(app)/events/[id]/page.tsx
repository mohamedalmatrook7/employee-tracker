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

  const [{ data: event }, { data: employees }, { data: visits }] =
    await Promise.all([
      supabase
        .from("events")
        .select(
          "id, name, month, period, target_group, notes, employee_id, employees(name)"
        )
        .eq("id", params.id)
        .maybeSingle(),
      supabase.from("employees").select("id, name").order("name"),
      supabase
        .from("event_visits")
        .select("employee_id, status, attendance_count")
        .eq("event_id", params.id),
    ]);

  if (!event) notFound();

  const rows = visits ?? [];
  const doneRows = rows.filter((v) => v.status === "done");
  const stats: EventStats = {
    schoolsDone: doneRows.length,
    schoolsTotal: rows.length,
    attendance: doneRows.reduce((s, v) => s + (v.attendance_count ?? 0), 0),
    employees: new Set(doneRows.map((v) => v.employee_id)).size,
  };

  return (
    <EventDetail
      event={event as unknown as EventDetailData}
      employees={employees ?? []}
      stats={stats}
    />
  );
}

export type EventStats = {
  schoolsDone: number;
  schoolsTotal: number;
  attendance: number;
  employees: number;
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
