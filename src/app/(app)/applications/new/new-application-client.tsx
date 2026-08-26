"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Plus } from "lucide-react";

import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import {
  ApplicationDialog,
  type EmployeeOption,
} from "@/components/application-dialog";

export function NewApplicationClient({
  employees,
  preselectedEmployeeId,
}: {
  employees: EmployeeOption[];
  preselectedEmployeeId?: string;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [open, setOpen] = useState(employees.length > 0);

  if (employees.length === 0) {
    return (
      <div>
        <PageHeader title={t("newApp.title")} />
        <EmptyState
          icon={ClipboardList}
          title={t("newApp.needEmployee.title")}
          description={t("newApp.needEmployee.desc")}
          action={
            <Button onClick={() => router.push("/employees")}>
              {t("dashboard.goToEmployees")}
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={t("newApp.title")}
        description={t("newApp.subtitle")}
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            {t("newApp.title")}
          </Button>
        }
      />
      <ApplicationDialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) router.back();
        }}
        lockedEmployeeId={preselectedEmployeeId}
      />
    </div>
  );
}
