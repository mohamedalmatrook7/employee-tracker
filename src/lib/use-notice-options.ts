"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import type { Option } from "@/lib/use-live-options";

// Unique channel name per hook instance so mounted dialogs don't clash.
let channelSeq = 0;

/**
 * Live dropdown data for the notice form: the employee list and the distinct
 * set of school names in the system (from the master visit_schedules). Fetched
 * fresh on mount and kept current via realtime, mirroring useLiveOptions — so a
 * deleted employee or a newly added school shows up without a reload.
 */
export function useNoticeOptions() {
  const [employees, setEmployees] = useState<Option[]>([]);
  const [schools, setSchools] = useState<string[]>([]);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function refresh() {
      const [{ data: emps }, { data: sched }] = await Promise.all([
        supabase.from("employees").select("id, name").order("name"),
        supabase.from("visit_schedules").select("school_name"),
      ]);
      if (!active) return;
      if (emps) setEmployees(emps);
      if (sched) {
        const distinct = Array.from(
          new Set(
            sched
              .map((s) => (s.school_name ?? "").trim())
              .filter((s) => s.length > 0)
          )
        ).sort((a, b) => a.localeCompare(b, "ar"));
        setSchools(distinct);
      }
    }

    refresh();
    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(refresh, 200);
    };

    const channel = supabase
      .channel(`notice-options-${channelSeq++}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "employees" },
        schedule
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "visit_schedules" },
        schedule
      )
      .subscribe();

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, []);

  return { employees, schools };
}
