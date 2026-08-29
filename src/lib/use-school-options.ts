"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

// Unique channel name per hook instance so mounted dialogs don't clash.
let channelSeq = 0;

/**
 * The shared, live list of school names offered in the notice AND application
 * school pickers. It merges three sources, de-duplicated and Arabic-sorted:
 *
 *   1. the fixed events schools (distinct `visit_schedules.school_name` — the
 *      ~208 master schools),
 *   2. any school previously typed on a notice,
 *   3. any school previously typed on an application.
 *
 * So a school typed here or in a notice becomes reusable in both pickers, shown
 * alongside the fixed events schools — WITHOUT ever growing the events school
 * list (events keep reading only from `visit_schedules`). Reads are resilient:
 * if a source column doesn't exist yet (e.g. before a migration is applied),
 * that query just contributes nothing instead of failing the whole list.
 */
export function useSchoolOptions() {
  const [schools, setSchools] = useState<string[]>([]);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function refresh() {
      const [{ data: sched }, { data: notices }, { data: apps }] =
        await Promise.all([
          supabase.from("visit_schedules").select("school_name"),
          supabase.from("notices").select("school_name"),
          supabase.from("applications").select("school_name"),
        ]);
      if (!active) return;
      const set = new Set<string>();
      for (const src of [sched, notices, apps]) {
        for (const row of src ?? []) {
          const v = (row as { school_name: string | null }).school_name?.trim();
          if (v) set.add(v);
        }
      }
      setSchools(
        Array.from(set).sort((a, b) => a.localeCompare(b, "ar"))
      );
    }

    refresh();
    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(refresh, 200);
    };

    const channel = supabase
      .channel(`school-options-${channelSeq++}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "visit_schedules" },
        schedule
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notices" },
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

  return schools;
}
