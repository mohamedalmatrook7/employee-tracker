"use client";

import { useState } from "react";
import { CalendarDays, Download } from "lucide-react";

import { currentMonthISO, formatMonthLabel } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * Month picker + download link for an employee's monthly PDF report
 * (cover page + that month's applications).
 */
export function MonthlyReportButton({ employeeId }: { employeeId: string }) {
  const { t } = useI18n();
  const [month, setMonth] = useState<string>(currentMonthISO());
  const [open, setOpen] = useState(false);

  const href = `/api/reports/employee/${employeeId}/monthly?month=${month}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <CalendarDays className="h-4 w-4" />
          {t("monthly.title")}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-medium">{t("monthly.title")}</p>
            <p className="text-xs text-muted-foreground">{t("monthly.desc")}</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="report-month">{t("monthly.month")}</Label>
            <Input
              id="report-month"
              type="month"
              value={month}
              max={currentMonthISO()}
              onChange={(e) => setMonth(e.target.value)}
            />
          </div>
          <Button asChild className="w-full" disabled={!month}>
            <a href={href} download onClick={() => setOpen(false)}>
              <Download className="h-4 w-4" />
              {t("monthly.download", {
                month: month ? formatMonthLabel(month) : "",
              })}
            </a>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
