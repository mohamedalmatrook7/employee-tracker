"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

// Unique channel name per hook instance so mounted dialogs don't clash.
let channelSeq = 0;

/**
 * The schools assigned to a single employee's visit schedule (same source
 * events draw from — `visit_schedules`), live + realtime. Used to narrow the
 * incoming-case school picker once an employee is chosen, mirroring how
 * events load an employee's own school list. Returns `[]` when `employeeId`
 * is empty, and re-fetches whenever it changes.
 */
export function useEmployeeSchoolOptions(employeeId: string) {
  const [schools, setSchools] = useState<string[]>([]);

  useEffect(() => {
    if (!employeeId) {
      setSchools([]);
      return;
    }

    const supabase = createClient();
    let active = true;

    async function refresh() {
      const { data } = await supabase
        .from("visit_schedules")
        .select("school_name")
        .eq("employee_id", employeeId);
      if (!active) return;
      const distinct = Array.from(
        new Set(
          (data ?? [])
            .map((s) => (s.school_name ?? "").trim())
            .filter((s) => s.length > 0)
        )
      ).sort((a, b) => a.localeCompare(b, "ar"));
      setSchools(distinct);
    }

    refresh();
    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(refresh, 200);
    };

    const channel = supabase
      .channel(`employee-school-options-${channelSeq++}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "visit_schedules",
          filter: `employee_id=eq.${employeeId}`,
        },
        schedule
      )
      .subscribe();

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [employeeId]);

  return schools;
}
