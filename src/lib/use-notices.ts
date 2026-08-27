"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

export type NoticeRow = {
  id: string;
  notice_number: string;
  student_name: string;
  cpr: string | null;
  school_name: string | null;
  employee_id: string | null;
  problem_type: string | null;
  notice_date: string | null;
  employees: { name: string } | null;
};

// Unique realtime channel name per hook instance.
let channelSeq = 0;

/**
 * Fetches the notices list (with the responsible employee's name) live on the
 * client and keeps it current via realtime — same approach as the applications
 * and events lists, so the list never shows a stale Router Cache snapshot.
 * Returns `null` while first loading.
 */
export function useNotices() {
  const [rows, setRows] = useState<NoticeRow[] | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function refresh() {
      const { data } = await supabase
        .from("notices")
        .select(
          "id, notice_number, student_name, cpr, school_name, employee_id, problem_type, notice_date, employees(name)"
        )
        .order("notice_date", { ascending: false })
        .order("created_at", { ascending: false });
      if (!active) return;
      setRows((data ?? []) as unknown as NoticeRow[]);
    }

    refresh();
    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(refresh, 200);
    };

    const channel = supabase
      .channel(`notices-${channelSeq++}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notices" },
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
