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
 * Month picker + download link for the monthly notices PDF report
 * (cover page + every notice raised in the selected month).
 */
export function MonthlyNoticesReportButton() {
  const { t } = useI18n();
  const [month, setMonth] = useState<string>(currentMonthISO());
  const [open, setOpen] = useState(false);

  const hrefFor = (format: "pdf" | "xlsx") =>
    `/api/reports/notices/monthly?month=${month}&format=${format}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <CalendarDays className="h-4 w-4" />
          {t("notices.report.title")}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-medium">{t("notices.report.title")}</p>
            <p className="text-xs text-muted-foreground">
              {t("notices.report.desc")}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notices-report-month">{t("monthly.month")}</Label>
            <Input
              id="notices-report-month"
              type="month"
              value={month}
              max={currentMonthISO()}
              onChange={(e) => setMonth(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full" disabled={!month}>
              <a href={hrefFor("pdf")} download onClick={() => setOpen(false)}>
                <Download className="h-4 w-4" />
                {t("monthly.downloadPdf", {
                  month: month ? formatMonthLabel(month) : "",
                })}
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full"
              disabled={!month}
            >
              <a href={hrefFor("xlsx")} download onClick={() => setOpen(false)}>
                <Download className="h-4 w-4" />
                {t("monthly.downloadExcel", {
                  month: month ? formatMonthLabel(month) : "",
                })}
              </a>
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
