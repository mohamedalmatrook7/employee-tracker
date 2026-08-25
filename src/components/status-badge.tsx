"use client";

import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/provider";
import type { ApplicationStatus } from "@/lib/database.types";

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  const { t } = useI18n();
  return (
    <Badge variant={status === "done" ? "done" : "pending"}>
      {status === "done" ? t("common.done") : t("common.pending")}
    </Badge>
  );
}
