"use client";

import { useI18n } from "@/lib/i18n/provider";

type Row = { name: string; pending: number; done: number; total: number };

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
      {/* Plain flex rows instead of an SVG chart: the label always sits in
          its own column beside the bar, so long department names can never
          render on top of the bar — they just truncate with an ellipsis
          (full name on hover/long-press via title). This also sidesteps
          Recharts' RTL/label-wrapping quirks that caused overlap on
          mobile and iPad. */}
      <div className="space-y-2.5">
        {data.map((row) => {
          const pendingPct = (row.pending / max) * 100;
          const donePct = (row.done / max) * 100;
          return (
            <div key={row.name} className="flex items-center gap-2.5 sm:gap-3">
              <div
                className="w-24 shrink-0 truncate text-xs text-muted-foreground sm:w-32 sm:text-sm"
                title={row.name}
              >
                {row.name}
              </div>
              <div className="h-5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="flex h-full">
                  <div
                    className="h-full bg-amber-500"
                    style={{ width: `${pendingPct}%` }}
                  />
                  <div
                    className="h-full bg-green-600"
                    style={{ width: `${donePct}%` }}
                  />
                </div>
              </div>
              <div className="w-6 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                {row.total}
              </div>
            </div>
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
