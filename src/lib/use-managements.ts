"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import type { Management } from "@/lib/database.types";

export type ManagementRow = Management & { usageCount: number };

// Unique realtime channel name per hook instance.
let channelSeq = 0;

/**
 * Fetches the managements list (with per-management application usage counts)
 * live on the client and keeps it current via realtime. Rendering client-side
 * means the list never shows a stale Next Router Cache snapshot on navigation —
 * it shows a brief loading state, then real data, so a deleted management never
 * flashes back in. Returns `null` while first loading.
 */
export function useManagements() {
  const [rows, setRows] = useState<ManagementRow[] | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function refresh() {
      const [{ data: managements }, { data: apps }] = await Promise.all([
        supabase.from("managements").select("*").order("name"),
        supabase.from("applications").select("management_id"),
      ]);
      if (!active) return;

      const usage = new Map<string, number>();
      for (const a of apps ?? []) {
        if (a.management_id) {
          usage.set(a.management_id, (usage.get(a.management_id) ?? 0) + 1);
        }
      }
      setRows(
        (managements ?? []).map((m) => ({
          ...m,
          usageCount: usage.get(m.id) ?? 0,
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
      .channel(`managements-${channelSeq++}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "managements" },
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
