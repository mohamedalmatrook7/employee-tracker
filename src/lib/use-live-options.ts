"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

export type Option = { id: string; name: string };

// Unique channel name per hook instance so multiple mounted dialogs don't clash.
let channelSeq = 0;

/**
 * Keeps the employee/management dropdown lists live on the client.
 *
 * Seeds from the server-rendered props, then (a) re-fetches once on mount to
 * bypass any stale Next.js Router Cache, and (b) subscribes to Postgres changes
 * so adds/deletes/renames appear instantly — no page refresh. Because writes are
 * hard deletes, a removed employee/management drops out of the list right away.
 */
export function useLiveOptions(
  initialEmployees: Option[],
  initialManagements: Option[]
) {
  const [employees, setEmployees] = useState<Option[]>(initialEmployees);
  const [managements, setManagements] = useState<Option[]>(initialManagements);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function refresh() {
      const [{ data: emps }, { data: mgmts }] = await Promise.all([
        supabase.from("employees").select("id, name").order("name"),
        supabase.from("managements").select("id, name").order("name"),
      ]);
      if (!active) return;
      if (emps) setEmployees(emps);
      if (mgmts) setManagements(mgmts);
    }

    // Catch up immediately, then coalesce bursts of changes into one refresh.
    refresh();
    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(refresh, 200);
    };

    const channel = supabase
      .channel(`live-options-${channelSeq++}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "employees" },
        schedule
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "managements" },
        schedule
      )
      .subscribe();

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, []);

  return { employees, managements };
}
