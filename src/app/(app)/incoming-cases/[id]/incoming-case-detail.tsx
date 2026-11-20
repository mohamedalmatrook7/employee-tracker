"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, Pencil, Trash2, User } from "lucide-react";
import { toast } from "sonner";

import type { Employee, IncomingCase } from "@/lib/database.types";
import { formatDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";
import { deleteIncomingCase } from "@/lib/actions/incoming-cases";
import type { IncomingCaseRow } from "@/lib/use-incoming-cases";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { IncomingCaseDialog } from "@/components/incoming-case-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";

type Props = {
  incomingCase: IncomingCase;
  employee: Employee | null;
};

export function IncomingCaseDetail({ incomingCase, employee }: Props) {
  const router = useRouter();
  const { t } = useI18n();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // The edit dialog expects an IncomingCaseRow (with the joined employee
  // name). Keep a stable reference so the dialog's reset effect doesn't
  // refire mid-edit.
  const caseRow = useMemo<IncomingCaseRow>(
    () => ({
      id: incomingCase.id,
      employee_id: incomingCase.employee_id,
      management_name: incomingCase.management_name,
      school_name: incomingCase.school_name,
      student_name: incomingCase.student_name,
      student_cpr: incomingCase.student_cpr,
      case_number: incomingCase.case_number,
      case_date: incomingCase.case_date,
      notes: incomingCase.notes,
      employees: employee ? { name: employee.name } : null,
    }),
    [incomingCase, employee]
  );

  return (
    <div className="space-y-6">
      <Link
        href="/incoming-cases"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" />
        {t("incomingCaseDetail.back")}
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">
            {t("incomingCaseDetail.heading")}
          </h1>
          <span className="text-lg text-muted-foreground" dir="auto">
            #{incomingCase.case_number}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" />
            {t("common.edit")}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive"
            onClick={() => setDeleteOpen(true)}
            aria-label={t("incomingCaseDetail.deleteAria")}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Details */}
      <Card>
        <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
          <Field label={t("incomingCaseDialog.number")}>
            <span dir="auto">{incomingCase.case_number}</span>
          </Field>
          <Field label={t("incomingCaseDialog.date")} icon={CalendarDays}>
            <span dir="ltr">{formatDate(incomingCase.case_date)}</span>
          </Field>
          <Field label={t("incomingCaseDialog.studentName")}>
            <span dir="auto">{incomingCase.student_name || "—"}</span>
          </Field>
          <Field label={t("incomingCaseDialog.studentCpr")}>
            <span dir="auto">{incomingCase.student_cpr || "—"}</span>
          </Field>
          <Field label={t("incomingCaseDialog.school")}>
            <span dir="auto">{incomingCase.school_name || "—"}</span>
          </Field>
          <Field label={t("incomingCaseDialog.management")}>
            <span dir="auto">{incomingCase.management_name || "—"}</span>
          </Field>
          <Field label={t("incomingCaseDialog.employee")} icon={User}>
            {employee ? (
              <Link
                href={`/employees/${employee.id}`}
                className="hover:underline"
              >
                {employee.name}
                {employee.position ? ` · ${employee.position}` : ""}
              </Link>
            ) : (
              "—"
            )}
          </Field>
          <div className="sm:col-span-2">
            <Field label={t("incomingCaseDialog.notes")}>
              <p className="whitespace-pre-wrap" dir="auto">
                {incomingCase.notes || "—"}
              </p>
            </Field>
          </div>
        </CardContent>
      </Card>

      <IncomingCaseDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        incomingCase={caseRow}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("incomingCaseDetail.deleteTitle")}
        description={t("incomingCaseDetail.deleteDesc")}
        confirmLabel={t("common.delete")}
        onConfirm={async () => {
          const res = await deleteIncomingCase(incomingCase.id);
          if (res.error) {
            toast.error(res.error);
            throw new Error(res.error);
          }
          toast.success(t("incomingCaseDialog.deleted"));
          router.push("/incoming-cases");
        }}
      />
    </div>
  );
}

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </p>
      <div className="text-sm">{children}</div>
    </div>
  );
}
