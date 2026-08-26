import type { EventReportGroup } from "@/lib/pdf/documents";

/** Shape returned by the event_visits query with the employee embed. */
export type EventVisitJoin = {
  school_name: string;
  attendance_count: number | null;
  visit_date: string | null;
  sort_order: number;
  employee_id: string;
  employees: { name: string; position: string | null } | null;
};

/** Group finished visit rows by employee, sorted by employee name (Arabic-aware). */
export function groupEventVisits(visits: EventVisitJoin[]): EventReportGroup[] {
  const map = new Map<string, EventReportGroup>();
  for (const v of visits) {
    let g = map.get(v.employee_id);
    if (!g) {
      g = {
        employeeName: v.employees?.name ?? "—",
        position: v.employees?.position ?? null,
        rows: [],
      };
      map.set(v.employee_id, g);
    }
    g.rows.push({
      school: v.school_name,
      attendance: v.attendance_count,
      date: v.visit_date,
    });
  }
  return Array.from(map.values()).sort((a, b) =>
    a.employeeName.localeCompare(b.employeeName, "ar")
  );
}

/** "September · 1-30/9/2026" from an event's month/period (either may be null). */
export function eventMetaLine(
  month: string | null,
  period: string | null
): string | null {
  return [month, period].filter((s) => s && s.trim()).join(" · ") || null;
}
