"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Users,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

import { deleteEmployee } from "@/lib/actions/employees";
import type { Employee } from "@/lib/database.types";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { EmployeeDialog } from "@/components/employee-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";

type Row = Employee & { total: number; pending: number };

export function EmployeesList({ employees }: { employees: Row[] }) {
  const router = useRouter();
  const { t } = useI18n();
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);

  return (
    <div>
      <PageHeader
        title={t("employees.title")}
        description={t("employees.subtitle")}
        action={
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            {t("employees.add")}
          </Button>
        }
      />

      {employees.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t("employees.none.title")}
          description={t("employees.none.desc")}
          action={
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" />
              {t("employees.addFirst")}
            </Button>
          }
        />
      ) : (
        <div className="rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.name")}</TableHead>
                <TableHead>{t("common.position")}</TableHead>
                <TableHead className="w-28 text-center">
                  {t("employees.colApplications")}
                </TableHead>
                <TableHead className="w-24 text-center">
                  {t("common.pending")}
                </TableHead>
                <TableHead className="w-16 text-end">
                  {t("common.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp) => (
                <TableRow
                  key={emp.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/employees/${emp.id}`)}
                >
                  <TableCell className="font-medium">
                    <Link
                      href={`/employees/${emp.id}`}
                      className="flex items-center justify-center gap-1 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {emp.name}
                      <ArrowRight className="h-3 w-3 text-muted-foreground rtl:-scale-x-100" />
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {emp.position || "—"}
                  </TableCell>
                  <TableCell className="text-center">{emp.total}</TableCell>
                  <TableCell className="text-center">
                    {emp.pending > 0 ? (
                      <Badge variant="pending">{emp.pending}</Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell
                    className="text-end"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">{t("common.actions")}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setEditing(emp)}>
                          <Pencil className="h-4 w-4" />
                          {t("common.edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onSelect={() => setDeleting(emp)}
                        >
                          <Trash2 className="h-4 w-4" />
                          {t("common.delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <EmployeeDialog open={addOpen} onOpenChange={setAddOpen} />
      <EmployeeDialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        employee={editing ?? undefined}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t("employees.deleteTitle", { name: deleting?.name ?? "" })}
        description={
          deleting && deleting.total > 0
            ? t("employees.deleteWithApps", {
                name: deleting.name,
                count: deleting.total,
              })
            : t("employees.deleteDesc")
        }
        confirmLabel={t("common.delete")}
        onConfirm={async () => {
          if (!deleting) return;
          const res = await deleteEmployee(deleting.id);
          if (res.error) {
            toast.error(res.error);
            throw new Error(res.error);
          }
          toast.success(t("employees.deleted"));
        }}
      />
    </div>
  );
}
