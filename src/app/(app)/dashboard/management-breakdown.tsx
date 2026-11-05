"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";

import { useI18n } from "@/lib/i18n/provider";

type Row = { name: string; pending: number; done: number; total: number };

const PENDING = "#f59e0b"; // amber-500
const DONE = "#16a34a"; // green-600
const TICK_FONT = "12px system-ui, -apple-system, Segoe UI, sans-serif";

// Binary-search the longest prefix of `text` (plus an ellipsis) that still
// fits within `maxWidth` px, measured with the same font the tick renders
// with. Keeps every label on a single line so rows can never overlap,
// regardless of viewport width.
function truncateToWidth(
  text: string,
  maxWidth: number,
  ctx: CanvasRenderingContext2D | null
): string {
  if (!ctx || maxWidth <= 0) return text;
  if (ctx.measureText(text).width <= maxWidth) return text;
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (ctx.measureText(`${text.slice(0, mid)}…`).width <= maxWidth) lo = mid;
    else hi = mid - 1;
  }
  return lo === 0 ? "…" : `${text.slice(0, lo)}…`;
}

export function ManagementBreakdown({ data }: { data: Row[] }) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setContainerWidth(w);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Label column scales with the actual card width (mobile/iPad/desktop)
  // instead of a fixed pixel value, so it never eats most of a narrow card.
  const yAxisWidth = containerWidth
    ? Math.max(64, Math.min(150, Math.round(containerWidth * 0.4)))
    : 120;

  const measureCtx = useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.font = TICK_FONT;
    return ctx;
  }, []);

  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t("dashboard.noAppsYet")}</p>
    );
  }

  // Cap chart height by row count for a tidy layout.
  const height = Math.max(140, data.length * 44);

  return (
    // Force LTR layout for the chart only: recharts miscomputes the label
    // column under an RTL page and paints the names over the bars. The Arabic
    // label text still renders correctly inside this LTR box.
    <div className="space-y-4" dir="ltr" ref={containerRef}>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 12, bottom: 4, left: 8 }}
            barCategoryGap={12}
          >
            <XAxis type="number" allowDecimals={false} hide />
            <YAxis
              type="category"
              dataKey="name"
              width={yAxisWidth}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              // Recharts' default tick wraps long labels across multiple
              // lines but still reserves only one line of vertical space per
              // category, which made long names spill into the row below
              // (visible as overlapping text on mobile/iPad). Truncating to
              // a single line keeps rows self-contained; the full name still
              // shows in the tooltip on hover/tap.
              tickFormatter={(value: string) =>
                truncateToWidth(value, yAxisWidth - 12, measureCtx)
              }
            />
            <Tooltip
              cursor={{ fill: "rgba(0,0,0,0.04)" }}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid hsl(214.3 31.8% 91.4%)",
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar
              dataKey="pending"
              stackId="a"
              fill={PENDING}
              name={t("common.pending")}
              radius={[4, 0, 0, 4]}
            />
            <Bar
              dataKey="done"
              stackId="a"
              fill={DONE}
              name={t("common.done")}
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
