"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import type { Employee } from "@/lib/database.types";

export type EmployeeRow = Employee & { total: number; pending: number };

// Unique realtime channel name per hook instance.
let channelSeq = 0;

/**
 * Fetches the employees list (with per-employee application counts) live on the
 * client and keeps it current via realtime. Rendering client-side means the
 * list never shows a stale Next Router Cache snapshot on navigation — it shows a
 * brief loading state, then the real data. Returns `null` while first loading.
 */
export function useEmployeeRows() {
  const [rows, setRows] = useState<EmployeeRow[] | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function refresh() {
      const [{ data: emps }, { data: apps }] = await Promise.all([
        supabase.from("employees").select("*").order("name"),
        supabase.from("applications").select("employee_id, status"),
      ]);
      if (!active) return;

      const counts = new Map<string, { total: number; pending: number }>();
      for (const a of apps ?? []) {
        const c = counts.get(a.employee_id) ?? { total: 0, pending: 0 };
        c.total += 1;
        if (a.status === "pending") c.pending += 1;
        counts.set(a.employee_id, c);
      }
      setRows(
        (emps ?? []).map((e) => ({
          ...e,
          total: counts.get(e.id)?.total ?? 0,
          pending: counts.get(e.id)?.pending ?? 0,
        }))
      );
    }

    refresh();
    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(refresh, 200);
    };

    const channel = supabase
      .channel(`employee-rows-${channelSeq++}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "employees" },
        schedule
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "applications" },
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
