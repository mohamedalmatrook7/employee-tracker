"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Forces a fresh server fetch on every route change.
 *
 * Next's client Router Cache reuses a previously-rendered page when you
 * navigate back to it, which can show a stale list (e.g. employees or
 * managements that were added/deleted since it was last cached) until a manual
 * refresh. Pages here are already `force-dynamic`, so re-fetching always
 * returns current data — this just guarantees we re-fetch on each navigation
 * instead of trusting the cache, regardless of Router Cache config.
 */
export function RefreshOnNavigate() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    router.refresh();
  }, [pathname, router]);

  return null;
}
