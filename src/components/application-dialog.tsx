"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  createApplication,
  updateApplication,
} from "@/lib/actions/applications";
import { applicationSchema } from "@/lib/validation";
import { todayISO } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";
import { useLiveOptions } from "@/lib/use-live-options";
import type { Application } from "@/lib/database.types";
import {
  ManagementCombobox,
  type ManagementOption,
  type ManagementValue,
} from "@/components/management-combobox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface EmployeeOption {
  id: string;
  name: string;
}

interface ApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: EmployeeOption[];
  managements: ManagementOption[];
  /** Pre-select and lock the employee (e.g. from an employee's page). */
  lockedEmployeeId?: string;
  /** Provide to edit an existing application; omit to create. */
  application?: Application;
}

export function ApplicationDialog({
  open,
  onOpenChange,
  employees: initialEmployees,
  managements: initialManagements,
  lockedEmployeeId,
  application,
}: ApplicationDialogProps) {
  const router = useRouter();
  const { t } = useI18n();
  const isEdit = !!application;

  // Live dropdowns: reflect adds/deletes instantly without a page refresh.
  const { employees, managements } = useLiveOptions(
    initialEmployees,
    initialManagements
  );

  const [employeeId, setEmployeeId] = useState("");
  const [management, setManagement] = useState<ManagementValue>({
    id: null,
    name: "",
  });
  const [content, setContent] = useState("");
  const [applicationDate, setApplicationDate] = useState(todayISO());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Reset the form whenever the dialog opens.
  useEffect(() => {
    if (!open) return;
    if (application) {
      setEmployeeId(application.employee_id);
      setManagement({
        id: application.management_id,
        name: application.management_name ?? "",
      });
      setContent(application.content);
      setApplicationDate(application.application_date.slice(0, 10));
    } else {
      setEmployeeId(lockedEmployeeId ?? "");
      setManagement({ id: null, name: "" });
      setContent("");
      setApplicationDate(todayISO());
    }
    setErrors({});
  }, [open, application, lockedEmployeeId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      employee_id: employeeId,
      management_id: management.id,
      management_name: management.name,
      content,
      application_date: applicationDate,
    };
    const parsed = applicationSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[issue.path[0] as string] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSaving(true);
    const res = isEdit
      ? await updateApplication(application!.id, payload)
      : await createApplication(payload);
    setSaving(false);

    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(isEdit ? t("appDialog.updated") : t("appDialog.added"));
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("appDialog.editTitle") : t("appDialog.addTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t("appDialog.editDesc") : t("appDialog.addDesc")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employee">{t("common.employee")}</Label>
            <Select
              value={employeeId}
              onValueChange={setEmployeeId}
              disabled={!!lockedEmployeeId}
            >
              <SelectTrigger id="employee">
                <SelectValue placeholder={t("appDialog.selectEmployee")} />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.employee_id && (
              <p className="text-sm text-destructive">{errors.employee_id}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t("common.managementDepartment")}</Label>
            <ManagementCombobox
              managements={managements}
              value={management}
              onChange={setManagement}
            />
            <p className="text-xs text-muted-foreground">
              {t("appDialog.managementHint")}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">{t("common.content")}</Label>
            <Textarea
              id="content"
              placeholder={t("appDialog.contentPlaceholder")}
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              dir="auto"
            />
            {errors.content && (
              <p className="text-sm text-destructive">{errors.content}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="applicationDate">
              {t("appDialog.applicationDate")}
            </Label>
            <Input
              id="applicationDate"
              type="date"
              value={applicationDate}
              onChange={(e) => setApplicationDate(e.target.value)}
              className="w-fit"
            />
            {errors.application_date && (
              <p className="text-sm text-destructive">
                {errors.application_date}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving
                ? t("common.saving")
                : isEdit
                  ? t("common.saveChanges")
                  : t("appDialog.addTitle")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
