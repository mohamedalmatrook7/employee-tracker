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
  employees,
  managements,
  lockedEmployeeId,
  application,
}: ApplicationDialogProps) {
  const router = useRouter();
  const isEdit = !!application;

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
    toast.success(isEdit ? "Application updated." : "Application added.");
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit application" : "Add application"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the details of this application."
              : "Assign a new application to an employee. Feedback is recorded later."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employee">Employee</Label>
            <Select
              value={employeeId}
              onValueChange={setEmployeeId}
              disabled={!!lockedEmployeeId}
            >
              <SelectTrigger id="employee">
                <SelectValue placeholder="Select an employee" />
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
            <Label>Management / department</Label>
            <ManagementCombobox
              managements={managements}
              value={management}
              onChange={setManagement}
            />
            <p className="text-xs text-muted-foreground">
              Pick from your list or type a new one to create it.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="Describe the application…"
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            {errors.content && (
              <p className="text-sm text-destructive">{errors.content}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="applicationDate">Application date</Label>
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
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving
                ? "Saving…"
                : isEdit
                  ? "Save changes"
                  : "Add application"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
