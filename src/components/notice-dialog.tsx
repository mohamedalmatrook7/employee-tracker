"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  createNotice,
  updateNotice,
  deleteNotice,
} from "@/lib/actions/notices";
import { noticeSchema } from "@/lib/validation";
import { todayISO } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";
import { useNoticeOptions } from "@/lib/use-notice-options";
import type { NoticeRow } from "@/lib/use-notices";
import { SearchableSelect } from "@/components/searchable-select";
import { CreatableSelect } from "@/components/creatable-select";
import { ProblemTypeCombobox } from "@/components/problem-type-combobox";
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

interface NoticeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Provide to edit an existing notice; omit to create. */
  notice?: NoticeRow;
  /** Distinct problem types already used, offered for reuse in the dropdown. */
  problemTypes: string[];
  /**
   * School names already used on notices, offered for reuse. Kept separate from
   * the fixed events school list so typing a new school here never grows it.
   */
  schoolNames: string[];
}

export function NoticeDialog({
  open,
  onOpenChange,
  notice,
  problemTypes,
  schoolNames,
}: NoticeDialogProps) {
  const router = useRouter();
  const { t } = useI18n();
  const isEdit = !!notice;
  const { employees, schools } = useNoticeOptions();

  const [noticeNumber, setNoticeNumber] = useState("");
  const [studentName, setStudentName] = useState("");
  const [cpr, setCpr] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [problemType, setProblemType] = useState("");
  const [noticeDate, setNoticeDate] = useState(todayISO());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Reset the form whenever the dialog opens.
  useEffect(() => {
    if (!open) return;
    if (notice) {
      setNoticeNumber(notice.notice_number);
      setStudentName(notice.student_name);
      setCpr(notice.cpr ?? "");
      setSchoolName(notice.school_name ?? "");
      setEmployeeId(notice.employee_id ?? "");
      setProblemType(notice.problem_type ?? "");
      setNoticeDate((notice.notice_date ?? todayISO()).slice(0, 10));
    } else {
      setNoticeNumber("");
      setStudentName("");
      setCpr("");
      setSchoolName("");
      setEmployeeId("");
      setProblemType("");
      setNoticeDate(todayISO());
    }
    setErrors({});
  }, [open, notice]);

  // Schools offered here = the fixed events schools (from visit_schedules) plus
  // any schools previously typed on a notice, merged and de-duplicated. The
  // current value is always included so an edited notice shows its own school.
  const schoolOptions = useMemo(() => {
    const set = new Set<string>();
    for (const s of schools) {
      const v = s.trim();
      if (v) set.add(v);
    }
    for (const s of schoolNames) {
      const v = s.trim();
      if (v) set.add(v);
    }
    if (schoolName.trim()) set.add(schoolName.trim());
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ar"));
  }, [schools, schoolNames, schoolName]);

  const employeeOptions = useMemo(
    () => employees.map((e) => ({ value: e.id, label: e.name })),
    [employees]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      notice_number: noticeNumber,
      student_name: studentName,
      cpr,
      school_name: schoolName,
      employee_id: employeeId,
      problem_type: problemType,
      notice_date: noticeDate,
    };
    const parsed = noticeSchema.safeParse(payload);
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
      ? await updateNotice(notice!.id, payload)
      : await createNotice(payload);
    setSaving(false);

    if (res.error) {
      if (res.error === "DUPLICATE_NUMBER") {
        setErrors({ notice_number: t("noticeDialog.duplicateNumber") });
      } else {
        toast.error(res.error);
      }
      return;
    }
    toast.success(isEdit ? t("noticeDialog.updated") : t("noticeDialog.added"));
    onOpenChange(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!notice) return;
    setDeleting(true);
    const res = await deleteNotice(notice.id);
    setDeleting(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(t("noticeDialog.deleted"));
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("noticeDialog.editTitle") : t("noticeDialog.addTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t("noticeDialog.editDesc") : t("noticeDialog.addDesc")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="notice-number">{t("noticeDialog.number")}</Label>
              <Input
                id="notice-number"
                value={noticeNumber}
                onChange={(e) => setNoticeNumber(e.target.value)}
                dir="auto"
              />
              {errors.notice_number && (
                <p className="text-sm text-destructive">
                  {errors.notice_number}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notice-date">{t("noticeDialog.date")}</Label>
              <Input
                id="notice-date"
                type="date"
                value={noticeDate}
                onChange={(e) => setNoticeDate(e.target.value)}
              />
              {errors.notice_date && (
                <p className="text-sm text-destructive">{errors.notice_date}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="student-name">
                {t("noticeDialog.studentName")}
              </Label>
              <Input
                id="student-name"
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
              <Label htmlFor="cpr">{t("noticeDialog.cpr")}</Label>
              <Input
                id="cpr"
                value={cpr}
                onChange={(e) => setCpr(e.target.value)}
                inputMode="numeric"
                dir="auto"
              />
              {errors.cpr && (
                <p className="text-sm text-destructive">{errors.cpr}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notice-school">{t("noticeDialog.school")}</Label>
            <CreatableSelect
              id="notice-school"
              options={schoolOptions}
              value={schoolName}
              onChange={setSchoolName}
              placeholder={t("noticeDialog.selectSchool")}
              optionsHeading={t("noticeDialog.schoolsHeading")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notice-employee">
              {t("noticeDialog.employee")}
            </Label>
            <SearchableSelect
              id="notice-employee"
              options={employeeOptions}
              value={employeeId}
              onChange={setEmployeeId}
              placeholder={t("noticeDialog.selectEmployee")}
              emptyText={t("noticeDialog.noEmployees")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="problem-type">{t("noticeDialog.problemType")}</Label>
            <ProblemTypeCombobox
              id="problem-type"
              options={problemTypes}
              value={problemType}
              onChange={setProblemType}
              placeholder={t("noticeDialog.selectProblemType")}
            />
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            {isEdit ? (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={handleDelete}
                disabled={deleting || saving}
              >
                {deleting ? t("common.working") : t("common.delete")}
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
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
                    : t("noticeDialog.addTitle")}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
