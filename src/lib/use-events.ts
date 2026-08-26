"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

export type EventRow = {
  id: string;
  name: string;
  month: string | null;
  period: string | null;
  target_group: string | null;
  notes: string | null;
  employee_id: string | null;
  employees: { name: string } | null;
};

// Unique realtime channel name per hook instance.
let channelSeq = 0;

/**
 * Fetches the events list (with the responsible employee's name) live on the
 * client and keeps it current via realtime. Rendering client-side means the
 * list never shows a stale Next Router Cache snapshot on navigation — it shows a
 * brief loading state, then the real data, so deleted events never flash back
 * in. Subscribes to both `events` and `employees` so renames/deletes of the
 * responsible employee reflect immediately. Returns `null` while first loading.
 */
export function useEvents() {
  const [rows, setRows] = useState<EventRow[] | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function refresh() {
      const { data } = await supabase
        .from("events")
        .select(
          "id, name, month, period, target_group, notes, employee_id, employees(name)"
        )
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (!active) return;
      setRows((data ?? []) as unknown as EventRow[]);
    }

    refresh();
    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(refresh, 200);
    };

    const channel = supabase
      .channel(`events-${channelSeq++}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events" },
        schedule
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "employees" },
        schedule
      )
      .subscribe();

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, []);

  return rows;
}
