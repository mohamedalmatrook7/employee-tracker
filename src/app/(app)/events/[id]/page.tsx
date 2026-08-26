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

  const [{ data: event }, { data: employees }] = await Promise.all([
    supabase
      .from("events")
      .select(
        "id, name, month, period, target_group, notes, employee_id, employees(name)"
      )
      .eq("id", params.id)
      .maybeSingle(),
    supabase.from("employees").select("id, name").order("name"),
  ]);

  if (!event) notFound();

  return (
    <EventDetail
      event={event as unknown as EventDetailData}
      employees={employees ?? []}
    />
  );
}

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
