"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

export type IncomingCaseRow = {
  id: string;
  employee_id: string;
  management_name: string | null;
  school_name: string | null;
  student_name: string | null;
  student_cpr: string | null;
  case_number: string;
  case_date: string;
  notes: string | null;
  employees: { name: string } | null;
};

// Unique realtime channel name per hook instance.
let channelSeq = 0;

/**
 * Fetches the incoming-cases list (with the responsible employee's name) live
 * on the client and keeps it current via realtime — same approach as the
 * notices/applications lists, so the list never shows a stale Router Cache
 * snapshot. Returns `null` while first loading.
 */
export function useIncomingCases() {
  const [rows, setRows] = useState<IncomingCaseRow[] | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function refresh() {
      const { data } = await supabase
        .from("incoming_cases")
        .select(
          "id, employee_id, management_name, school_name, student_name, student_cpr, case_number, case_date, notes, employees(name)"
        )
        .order("case_date", { ascending: false })
        .order("created_at", { ascending: false });
      if (!active) return;
      setRows((data ?? []) as unknown as IncomingCaseRow[]);
    }

    refresh();
    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(refresh, 200);
    };

    const channel = supabase
      .channel(`incoming-cases-${channelSeq++}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "incoming_cases" },
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
