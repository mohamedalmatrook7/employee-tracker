"use client";

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

export function ManagementBreakdown({ data }: { data: Row[] }) {
  const { t } = useI18n();

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
    <div className="space-y-4" dir="ltr">
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
              width={120}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
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
