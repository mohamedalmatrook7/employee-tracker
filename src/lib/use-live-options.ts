"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

export type Option = { id: string; name: string };

// Unique channel name per hook instance so multiple mounted dialogs don't clash.
let channelSeq = 0;

/**
 * Keeps the employee/management dropdown lists live on the client.
 *
 * Starts empty and fetches on mount rather than seeding from server-rendered
 * props — a server prop can be a stale Next.js Router Cache snapshot, which
 * would flash a since-deleted employee/management for a frame. Starting empty
 * guarantees a deleted row is never shown, not even briefly. Subscribes to
 * Postgres changes so adds/deletes/renames appear instantly, and because writes
 * are hard deletes, a removed row drops out right away. Returns `[]` until the
 * first fetch resolves (dialogs mount before opening, so this is not visible).
 */
export function useLiveOptions() {
  const [employees, setEmployees] = useState<Option[]>([]);
  const [managements, setManagements] = useState<Option[]>([]);

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
