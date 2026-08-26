"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

export type ApplicationRow = {
  id: string;
  content: string;
  application_date: string;
  status: "pending" | "done";
  management_name: string | null;
  employee_id: string;
  employees: { name: string } | null;
};

// Unique realtime channel name per hook instance.
let channelSeq = 0;

/**
 * Fetches the applications list (with the employee's name) live on the client
 * and keeps it current via realtime. Rendering client-side means the list never
 * shows a stale Next Router Cache snapshot on navigation — it shows a brief
 * loading state, then real data, so a deleted application never flashes back in.
 * Returns `null` while first loading.
 */
export function useApplications() {
  const [rows, setRows] = useState<ApplicationRow[] | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function refresh() {
      const { data } = await supabase
        .from("applications")
        .select(
          "id, content, application_date, status, management_name, employee_id, employees(name)"
        )
        .order("application_date", { ascending: false });
      if (!active) return;
      setRows((data ?? []) as unknown as ApplicationRow[]);
    }

    refresh();
    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(refresh, 200);
    };

    const channel = supabase
      .channel(`applications-${channelSeq++}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "applications" },
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
