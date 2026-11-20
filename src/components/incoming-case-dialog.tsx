"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  createIncomingCase,
  updateIncomingCase,
} from "@/lib/actions/incoming-cases";
import { incomingCaseSchema } from "@/lib/validation";
import { todayISO } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";
import { useLiveOptions } from "@/lib/use-live-options";
import { useSchoolOptions } from "@/lib/use-school-options";
import { useEmployeeSchoolOptions } from "@/lib/use-employee-school-options";
import type { IncomingCaseRow } from "@/lib/use-incoming-cases";
import {
  ManagementCombobox,
  type ManagementValue,
} from "@/components/management-combobox";
import { CreatableSelect } from "@/components/creatable-select";
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

interface IncomingCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-select and lock the employee (e.g. from an employee's page). */
  lockedEmployeeId?: string;
  /** Provide to edit an existing case; omit to create. */
  incomingCase?: IncomingCaseRow;
}

export function IncomingCaseDialog({
  open,
  onOpenChange,
  lockedEmployeeId,
  incomingCase,
}: IncomingCaseDialogProps) {
  const router = useRouter();
  const { t } = useI18n();
  const isEdit = !!incomingCase;

  const { employees, managements } = useLiveOptions();
  // Shared, live school list (fixed events schools ∪ notices ∪ applications).
  const allSchools = useSchoolOptions();

  const [employeeId, setEmployeeId] = useState("");
  const [management, setManagement] = useState<ManagementValue>({
    id: null,
    name: "",
  });
  const [schoolName, setSchoolName] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentCpr, setStudentCpr] = useState("");
  const [caseNumber, setCaseNumber] = useState("");
  const [caseDate, setCaseDate] = useState(todayISO());
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Once an employee is picked, narrow the school picker to that employee's
  // own visit schedule — same source events draw from.
  const employeeSchools = useEmployeeSchoolOptions(employeeId);

  // Reset the form whenever the dialog opens.
  useEffect(() => {
    if (!open) return;
    if (incomingCase) {
      setEmployeeId(incomingCase.employee_id);
      setManagement({ id: null, name: incomingCase.management_name ?? "" });
      setSchoolName(incomingCase.school_name ?? "");
      setStudentName(incomingCase.student_name ?? "");
      setStudentCpr(incomingCase.student_cpr ?? "");
      setCaseNumber(incomingCase.case_number);
      setCaseDate(incomingCase.case_date.slice(0, 10));
      setNotes(incomingCase.notes ?? "");
    } else {
      setEmployeeId(lockedEmployeeId ?? "");
      setManagement({ id: null, name: "" });
      setSchoolName("");
      setStudentName("");
      setStudentCpr("");
      setCaseNumber("");
      setCaseDate(todayISO());
      setNotes("");
    }
    setErrors({});
  }, [open, incomingCase, lockedEmployeeId]);

  // Schools offered: once an employee is picked, their own schedule; until
  // then, the full shared list. The current value is always included so an
  // edited case shows its own school even if it isn't among the fetched set.
  const schoolOptions = useMemo(() => {
    const base = employeeId ? employeeSchools : allSchools;
    const set = new Set<string>(base);
    if (schoolName.trim()) set.add(schoolName.trim());
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ar"));
  }, [employeeId, employeeSchools, allSchools, schoolName]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      employee_id: employeeId,
      management_id: management.id,
      management_name: management.name,
      school_name: schoolName,
      student_name: studentName,
      student_cpr: studentCpr,
      case_number: caseNumber,
      case_date: caseDate,
      notes,
    };
    const parsed = incomingCaseSchema.safeParse(payload);
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
      ? await updateIncomingCase(incomingCase!.id, payload)
      : await createIncomingCase(payload);
    setSaving(false);

    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(
      isEdit ? t("incomingCaseDialog.updated") : t("incomingCaseDialog.added")
    );
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? t("incomingCaseDialog.editTitle")
              : t("incomingCaseDialog.addTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? t("incomingCaseDialog.editDesc")
              : t("incomingCaseDialog.addDesc")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="case-employee">
                {t("incomingCaseDialog.employee")}
              </Label>
              <Select
                value={employeeId}
                onValueChange={setEmployeeId}
                disabled={!!lockedEmployeeId}
              >
                <SelectTrigger id="case-employee">
                  <SelectValue
                    placeholder={t("incomingCaseDialog.selectEmployee")}
                  />
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
                <p className="text-sm text-destructive">
                  {errors.employee_id}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t("incomingCaseDialog.management")}</Label>
              <ManagementCombobox
                managements={managements}
                value={management}
                onChange={setManagement}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="case-school">
                {t("incomingCaseDialog.school")}
              </Label>
              <CreatableSelect
                id="case-school"
                options={schoolOptions}
                value={schoolName}
                onChange={setSchoolName}
                placeholder={t("incomingCaseDialog.selectSchool")}
                optionsHeading={t("noticeDialog.schoolsHeading")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="case-student-name">
                {t("incomingCaseDialog.studentName")}
              </Label>
              <Input
                id="case-student-name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                dir="auto"
              />
              {errors.student_name && (
                <p className="text-sm text-destructive">
                  {errors.student_name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="case-student-cpr">
                {t("incomingCaseDialog.studentCpr")}
              </Label>
              <Input
                id="case-student-cpr"
                value={studentCpr}
                onChange={(e) => setStudentCpr(e.target.value)}
                inputMode="numeric"
                dir="auto"
              />
              {errors.student_cpr && (
                <p className="text-sm text-destructive">
                  {errors.student_cpr}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="case-number">
                {t("incomingCaseDialog.number")}
              </Label>
              <Input
                id="case-number"
                value={caseNumber}
                onChange={(e) => setCaseNumber(e.target.value)}
                dir="auto"
              />
              {errors.case_number && (
                <p className="text-sm text-destructive">
                  {errors.case_number}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="case-date">{t("incomingCaseDialog.date")}</Label>
              <Input
                id="case-date"
                type="date"
                value={caseDate}
                onChange={(e) => setCaseDate(e.target.value)}
              />
              {errors.case_date && (
                <p className="text-sm text-destructive">{errors.case_date}</p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="case-notes">
                {t("incomingCaseDialog.notes")}
              </Label>
              <Textarea
                id="case-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                dir="auto"
              />
            </div>
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
                  : t("incomingCaseDialog.addTitle")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
