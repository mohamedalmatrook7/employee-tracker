import { requireUser } from "@/lib/auth";
import { EventsList, type EventRow } from "./events-list";

export const metadata = { title: "Events" };

export default async function EventsPage() {
  const { supabase } = await requireUser();

  const [{ data: events }, { data: employees }] = await Promise.all([
    supabase
      .from("events")
      .select(
        "id, name, month, period, target_group, notes, employee_id, employees(name)"
      )
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase.from("employees").select("id, name").order("name"),
  ]);

  return (
    <EventsList
      events={(events ?? []) as unknown as EventRow[]}
      employees={employees ?? []}
    />
  );
}
