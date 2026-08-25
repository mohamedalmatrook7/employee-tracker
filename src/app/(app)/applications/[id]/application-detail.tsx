"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Download,
  MessageSquarePlus,
  Pencil,
  Printer,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";

import type { Application, Employee } from "@/lib/database.types";
import { formatDate, todayISO } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";
import {
  deleteApplication,
  saveFeedback,
  clearFeedback,
} from "@/lib/actions/applications";
import { feedbackSchema } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/status-badge";
import { ApplicationDialog } from "@/components/application-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { ManagementOption } from "@/components/management-combobox";
import type { EmployeeOption } from "@/components/application-dialog";

type Props = {
  application: Application;
  employee: Employee | null;
  employees: EmployeeOption[];
  managements: ManagementOption[];
};

export function ApplicationDetail({
  application,
  employee,
  employees,
  managements,
}: Props) {
  const router = useRouter();
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);

  const hasFeedback = application.feedback_text != null;
  const [editingFeedback, setEditingFeedback] = useState(false);

  // Where "back" (and the post-delete redirect) should go, based on where we
  // arrived from: the applications list, a management's page, or (default) the
  // owning employee.
  const from = searchParams.get("from");
  const cameFromApplications = from === "applications";
  const cameFromManagement = from === "management" && !!application.management_id;
  const backHref = cameFromApplications
    ? "/applications"
    : cameFromManagement
      ? `/managements/${application.management_id}`
      : employee
        ? `/employees/${employee.id}`
        : "/employees";
  const backLabel = cameFromApplications
    ? t("appDetail.backToApplications")
    : cameFromManagement
      ? t("appDetail.backToManagement", {
          name: application.management_name || t("appDetail.management"),
        })
      : employee
        ? t("appDetail.backToEmployee", { name: employee.name })
        : t("appDetail.backToEmployees");

  return (
    <div className="space-y-6">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" />
        {backLabel}
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">
            {t("appDetail.heading")}
          </h1>
          <StatusBadge status={application.status} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={`/applications/${application.id}/print`} target="_blank">
              <Printer className="h-4 w-4" />
              {t("common.print")}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <a href={`/api/reports/application/${application.id}`} download>
              <Download className="h-4 w-4" />
              {t("common.downloadPdf")}
            </a>
          </Button>
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" />
            {t("common.edit")}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive"
            onClick={() => setDeleteOpen(true)}
            aria-label={t("appDetail.deleteAria")}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Details */}
      <Card>
        <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
          <Field label={t("common.employee")} icon={User}>
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
          <Field label={t("common.managementDepartment")}>
            {application.management_name || "—"}
          </Field>
          <Field label={t("appDetail.applicationDate")} icon={CalendarDays}>
            {formatDate(application.application_date)}
          </Field>
          <Field label={t("common.status")}>
            <StatusBadge status={application.status} />
          </Field>
          <div className="sm:col-span-2">
            <Field label={t("common.content")}>
              <p className="whitespace-pre-wrap" dir="auto">
                {application.content}
              </p>
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* Feedback */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">{t("appDetail.feedback")}</CardTitle>
          {hasFeedback && !editingFeedback && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingFeedback(true)}
              >
                <Pencil className="h-4 w-4" />
                {t("appDetail.editFeedback")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => setClearOpen(true)}
              >
                {t("appDetail.clear")}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {hasFeedback && !editingFeedback ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {t("appDetail.recorded", {
                  date: formatDate(application.feedback_date),
                })}
              </p>
              <p className="whitespace-pre-wrap" dir="auto">
                {application.feedback_text}
              </p>
            </div>
          ) : (
            <FeedbackForm
              applicationId={application.id}
              initialText={application.feedback_text ?? ""}
              initialDate={application.feedback_date ?? todayISO()}
              isEdit={hasFeedback}
              onCancel={
                hasFeedback ? () => setEditingFeedback(false) : undefined
              }
              onSaved={() => {
                setEditingFeedback(false);
                router.refresh();
              }}
            />
          )}
        </CardContent>
      </Card>

      <ApplicationDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        employees={employees}
        managements={managements}
        application={application}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("appDetail.deleteTitle")}
        description={t("appDetail.deleteDesc")}
        confirmLabel={t("common.delete")}
        onConfirm={async () => {
          const res = await deleteApplication(
            application.id,
            application.employee_id
          );
          if (res.error) {
            toast.error(res.error);
            throw new Error(res.error);
          }
          toast.success(t("appDetail.deleted"));
          router.push(backHref);
        }}
      />
      <ConfirmDialog
        open={clearOpen}
        onOpenChange={setClearOpen}
        title={t("appDetail.clearTitle")}
        description={t("appDetail.clearDesc")}
        confirmLabel={t("appDetail.clearConfirm")}
        onConfirm={async () => {
          const res = await clearFeedback(application.id);
          if (res.error) {
            toast.error(res.error);
            throw new Error(res.error);
          }
          toast.success(t("appDetail.feedbackCleared"));
          router.refresh();
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

function FeedbackForm({
  applicationId,
  initialText,
  initialDate,
  isEdit,
  onCancel,
  onSaved,
}: {
  applicationId: string;
  initialText: string;
  initialDate: string;
  isEdit: boolean;
  onCancel?: () => void;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const [text, setText] = useState(initialText);
  const [date, setDate] = useState(initialDate.slice(0, 10));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { feedback_text: text, feedback_date: date };
    const parsed = feedbackSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t("appDetail.invalidInput"));
      return;
    }
    setError(null);
    setSaving(true);
    const res = await saveFeedback(applicationId, payload);
    setSaving(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(
      isEdit ? t("appDetail.feedbackUpdated") : t("appDetail.feedbackSaved")
    );
    onSaved();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isEdit && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <MessageSquarePlus className="h-4 w-4" />
          {t("appDetail.noFeedbackYet")}
        </p>
      )}
      <div className="space-y-2">
        <Label htmlFor="feedbackText">{t("appDetail.feedback")}</Label>
        <Textarea
          id="feedbackText"
          rows={4}
          placeholder={t("appDetail.feedbackPlaceholder")}
          value={text}
          onChange={(e) => setText(e.target.value)}
          dir="auto"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="feedbackDate">{t("appDetail.feedbackDate")}</Label>
        <Input
          id="feedbackDate"
          type="date"
          className="w-fit"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>
      <Separator />
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
        )}
        <Button type="submit" disabled={saving}>
          {saving
            ? t("common.saving")
            : isEdit
              ? t("appDetail.updateFeedback")
              : t("appDetail.saveFeedback")}
        </Button>
      </div>
    </form>
  );
}
