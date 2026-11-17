"use client";

import { FileText, Download } from "lucide-react";

import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Download link for the comprehensive notices report (cover page + every
 * notice ever raised, no month filter) — PDF or Excel.
 */
export function AllNoticesReportButton() {
  const { t } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <FileText className="h-4 w-4" />
          {t("notices.allReport.title")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <a href="/api/reports/notices" download>
            <Download className="h-4 w-4" />
            {t("common.downloadPdf")}
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href="/api/reports/notices?format=xlsx" download>
            <Download className="h-4 w-4" />
            {t("common.downloadExcel")}
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
