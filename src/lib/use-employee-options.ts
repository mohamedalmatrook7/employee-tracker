"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import type { Option } from "@/lib/use-live-options";

// Unique realtime channel name per hook instance.
let channelSeq = 0;

/**
 * Fetches `{ id, name }` employee options live on the client for dropdowns.
 *
 * Unlike `useLiveOptions`, this seeds from nothing (starts empty) and fetches on
 * mount, so a deleted employee is never shown — not even for a frame from a
 * stale server/Router-Cache snapshot. Realtime keeps adds/renames/deletes
 * current while the dialog is open. Returns `[]` until the first fetch resolves.
 */
export function useEmployeeOptions(): Option[] {
  const [employees, setEmployees] = useState<Option[]>([]);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function refresh() {
      const { data } = await supabase
        .from("employees")
        .select("id, name")
        .order("name");
      if (!active) return;
      if (data) setEmployees(data);
    }

    refresh();
    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(refresh, 200);
    };

    const channel = supabase
      .channel(`employee-options-${channelSeq++}`)
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

  return employees;
}
