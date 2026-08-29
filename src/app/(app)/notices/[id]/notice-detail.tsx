"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, Pencil, Trash2, User } from "lucide-react";
import { toast } from "sonner";

import type { Employee, Notice } from "@/lib/database.types";
import { formatDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";
import { useNotices } from "@/lib/use-notices";
import { deleteNotice } from "@/lib/actions/notices";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { NoticeDialog } from "@/components/notice-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";

type Props = {
  notice: Notice;
  employee: Employee | null;
};

export function NoticeDetail({ notice, employee }: Props) {
  const router = useRouter();
  const { t } = useI18n();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // All notices (live) — used only to derive the reusable problem-type list for
  // the edit dialog, mirroring the notices list.
  const notices = useNotices();
  const problemTypes = useMemo(() => {
    const set = new Set<string>();
    for (const n of notices ?? []) {
      const p = n.problem_type?.trim();
      if (p) set.add(p);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ar"));
  }, [notices]);

  // The edit dialog expects a NoticeRow (with the joined employee name). Keep a
  // stable reference so the dialog's reset effect doesn't refire mid-edit.
  const noticeRow = useMemo(
    () => ({
      id: notice.id,
      notice_number: notice.notice_number,
      student_name: notice.student_name,
      cpr: notice.cpr,
      school_name: notice.school_name,
      employee_id: notice.employee_id,
      problem_type: notice.problem_type,
      notice_date: notice.notice_date,
      employees: employee ? { name: employee.name } : null,
    }),
    [notice, employee]
  );

  return (
    <div className="space-y-6">
      <Link
        href="/notices"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" />
        {t("noticeDetail.back")}
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">
            {t("noticeDetail.heading")}
          </h1>
          <span className="text-lg text-muted-foreground" dir="auto">
            #{notice.notice_number}
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
            aria-label={t("noticeDetail.deleteAria")}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Details */}
      <Card>
        <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
          <Field label={t("noticeDialog.number")}>
            <span dir="auto">{notice.notice_number}</span>
          </Field>
          <Field label={t("noticeDialog.date")} icon={CalendarDays}>
            <span dir="ltr">{formatDate(notice.notice_date)}</span>
          </Field>
          <Field label={t("noticeDialog.studentName")}>
            <span dir="auto">{notice.student_name || "—"}</span>
          </Field>
          <Field label={t("noticeDialog.cpr")}>
            <span dir="auto">{notice.cpr || "—"}</span>
          </Field>
          <Field label={t("noticeDialog.school")}>
            <span dir="auto">{notice.school_name || "—"}</span>
          </Field>
          <Field label={t("noticeDialog.employee")} icon={User}>
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
            <Field label={t("noticeDialog.problemType")}>
              <p className="whitespace-pre-wrap" dir="auto">
                {notice.problem_type || "—"}
              </p>
            </Field>
          </div>
        </CardContent>
      </Card>

      <NoticeDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        notice={noticeRow}
        problemTypes={problemTypes}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("noticeDetail.deleteTitle")}
        description={t("noticeDetail.deleteDesc")}
        confirmLabel={t("common.delete")}
        onConfirm={async () => {
          const res = await deleteNotice(notice.id);
          if (res.error) {
            toast.error(res.error);
            throw new Error(res.error);
          }
          toast.success(t("noticeDialog.deleted"));
          router.push("/notices");
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
