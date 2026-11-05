"use client";

import Link from "next/link";

import { useI18n } from "@/lib/i18n/provider";

type Row = {
  name: string;
  managementName: string | null;
  pending: number;
  done: number;
  total: number;
};

const BAR_MAX_HEIGHT = 140;

export function ManagementBreakdown({ data }: { data: Row[] }) {
  const { t } = useI18n();

  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t("dashboard.noAppsYet")}</p>
    );
  }

  const max = Math.max(...data.map((r) => r.total), 1);

  return (
    <div className="space-y-4">
      {/* Vertical bars with the full name printed underneath (wrapping onto
          its own lines instead of truncating), each column as a normal flow
          sibling so labels can never sit on top of a bar. Horizontally
          scrollable so it stays usable with many departments on narrow
          screens. */}
      <div className="flex items-start gap-4 overflow-x-auto pb-1 sm:gap-6">
        {data.map((row) => {
          const pendingHeight = (row.pending / max) * BAR_MAX_HEIGHT;
          const doneHeight = (row.done / max) * BAR_MAX_HEIGHT;
          const content = (
            <div className="flex w-16 shrink-0 flex-col items-center gap-1.5 sm:w-20">
              <span className="text-xs font-semibold tabular-nums">
                {row.total}
              </span>
              <div
                className="flex w-8 flex-col justify-end overflow-hidden rounded-md bg-muted sm:w-10"
                style={{ height: BAR_MAX_HEIGHT }}
              >
                <div
                  className="w-full bg-green-600"
                  style={{ height: doneHeight }}
                />
                <div
                  className="w-full bg-amber-500"
                  style={{ height: pendingHeight }}
                />
              </div>
              <span className="text-center text-[11px] leading-tight text-muted-foreground sm:text-xs">
                {row.name}
              </span>
            </div>
          );

          return row.managementName ? (
            <Link
              key={row.name}
              href={`/applications?management=${encodeURIComponent(row.managementName)}`}
              className="rounded-md transition-opacity hover:opacity-80"
              aria-label={row.name}
            >
              {content}
            </Link>
          ) : (
            <div key={row.name}>{content}</div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
          {t("common.pending")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-green-600" />
          {t("common.done")}
        </span>
      </div>
    </div>
  );
}
