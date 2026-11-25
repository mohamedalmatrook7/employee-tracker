"use client";

import Link from "next/link";

import { useI18n } from "@/lib/i18n/provider";

type Row = {
  name: string;
  managementName: string | null;
  total: number;
};

const BAR_MAX_HEIGHT = 140;

export function IncomingCasesBreakdown({ data }: { data: Row[] }) {
  const { t } = useI18n();

  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t("dashboard.noCasesYet")}</p>
    );
  }

  const max = Math.max(...data.map((r) => r.total), 1);

  return (
    <div className="flex items-start gap-4 overflow-x-auto pb-1 sm:gap-6">
      {data.map((row) => {
        const barHeight = (row.total / max) * BAR_MAX_HEIGHT;
        const content = (
          <div className="flex w-16 shrink-0 flex-col items-center gap-1.5 sm:w-20">
            <span className="text-xs font-semibold tabular-nums">
              {row.total}
            </span>
            <div
              className="flex w-8 flex-col justify-end overflow-hidden rounded-md bg-muted sm:w-10"
              style={{ height: BAR_MAX_HEIGHT }}
            >
              <div className="w-full bg-sky-600" style={{ height: barHeight }} />
            </div>
            <span className="text-center text-[11px] leading-tight text-muted-foreground sm:text-xs">
              {row.name}
            </span>
          </div>
        );

        return row.managementName ? (
          <Link
            key={row.name}
            href={`/incoming-cases?management=${encodeURIComponent(row.managementName)}`}
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
  );
}
