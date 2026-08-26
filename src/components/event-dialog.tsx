"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createEvent, updateEvent } from "@/lib/actions/events";
import { eventSchema } from "@/lib/validation";
import { useI18n } from "@/lib/i18n/provider";
import { useEmployeeOptions } from "@/lib/use-employee-options";
import type { Event } from "@/lib/database.types";
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

const UNASSIGNED = "__unassigned__";

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Provide to edit an existing event; omit to create. */
  event?: Event;
}

export function EventDialog({
  open,
  onOpenChange,
  event,
}: EventDialogProps) {
  const router = useRouter();
  const { t } = useI18n();
  const employees = useEmployeeOptions();
  const isEdit = !!event;

  const [name, setName] = useState("");
  const [month, setMonth] = useState("");
  const [period, setPeriod] = useState("");
  const [targetGroup, setTargetGroup] = useState("");
  const [notes, setNotes] = useState("");
  const [employeeId, setEmployeeId] = useState<string>(UNASSIGNED);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(event?.name ?? "");
    setMonth(event?.month ?? "");
    setPeriod(event?.period ?? "");
    setTargetGroup(event?.target_group ?? "");
    setNotes(event?.notes ?? "");
    setEmployeeId(event?.employee_id ?? UNASSIGNED);
    setErrors({});
  }, [open, event]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name,
      month,
      period,
      target_group: targetGroup,
      notes,
      employee_id: employeeId === UNASSIGNED ? null : employeeId,
    };
    const parsed = eventSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[issue.path[0] as string] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setSaving(true);
    const res = isEdit
      ? await updateEvent(event!.id, payload)
      : await createEvent(payload);
    setSaving(false);

    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(isEdit ? t("eventDialog.updated") : t("eventDialog.added"));
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("eventDialog.editTitle") : t("eventDialog.addTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t("eventDialog.editDesc") : t("eventDialog.addDesc")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="event-name">{t("eventDialog.name")}</Label>
            <Input
              id="event-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("eventDialog.namePlaceholder")}
              dir="auto"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="event-month">{t("eventDialog.month")}</Label>
              <Input
                id="event-month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                placeholder={t("eventDialog.monthPlaceholder")}
                dir="auto"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-period">{t("eventDialog.period")}</Label>
              <Input
                id="event-period"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder={t("eventDialog.periodPlaceholder")}
                dir="auto"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-target">{t("eventDialog.target")}</Label>
            <Input
              id="event-target"
              value={targetGroup}
              onChange={(e) => setTargetGroup(e.target.value)}
              placeholder={t("eventDialog.targetPlaceholder")}
              dir="auto"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-responsible">
              {t("eventDialog.responsible")}
            </Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger id="event-responsible">
                <SelectValue placeholder={t("eventDialog.selectEmployee")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNASSIGNED}>
                  {t("eventDialog.unassigned")}
                </SelectItem>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-notes">{t("eventDialog.notes")}</Label>
            <Textarea
              id="event-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("eventDialog.notesPlaceholder")}
              dir="auto"
            />
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
                  : t("eventDialog.addTitle")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
