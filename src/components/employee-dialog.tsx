"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createEmployee, updateEmployee } from "@/lib/actions/employees";
import { employeeSchema } from "@/lib/validation";
import type { Employee } from "@/lib/database.types";
import { useI18n } from "@/lib/i18n/provider";
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

interface EmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Provide to edit; omit to create. */
  employee?: Employee;
}

export function EmployeeDialog({
  open,
  onOpenChange,
  employee,
}: EmployeeDialogProps) {
  const router = useRouter();
  const { t } = useI18n();
  const isEdit = !!employee;

  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(employee?.name ?? "");
    setPosition(employee?.position ?? "");
    setEmail(employee?.email ?? "");
    setErrors({});
  }, [open, employee]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { name, position, email };
    const parsed = employeeSchema.safeParse(payload);
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
      ? await updateEmployee(employee!.id, payload)
      : await createEmployee(payload);
    setSaving(false);

    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(isEdit ? t("empDialog.updated") : t("empDialog.added"));
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("empDialog.editTitle") : t("empDialog.addTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t("empDialog.editDesc") : t("empDialog.addDesc")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("common.name")}</Label>
            <Input
              id="name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("empDialog.namePlaceholder")}
              dir="auto"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="position">
              {t("common.position")}{" "}
              <span className="text-muted-foreground">
                {t("common.optional")}
              </span>
            </Label>
            <Input
              id="position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder={t("empDialog.positionPlaceholder")}
              dir="auto"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">
              {t("common.email")}{" "}
              <span className="text-muted-foreground">
                {t("common.optional")}
              </span>
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("empDialog.emailPlaceholder")}
              dir="ltr"
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
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
                  : t("empDialog.addTitle")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
