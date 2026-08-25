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
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);

  return (
    <div>
      <PageHeader
        title="Employees"
        description="Everyone on your team and their application workload."
        action={
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Add employee
          </Button>
        }
      />

      {employees.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No employees yet"
          description="Add your first team member to start assigning and tracking applications."
          action={
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" />
              Add your first employee
            </Button>
          }
        />
      ) : (
        <div className="rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Position</TableHead>
                <TableHead className="w-28 text-center">Applications</TableHead>
                <TableHead className="w-24 text-center">Pending</TableHead>
                <TableHead className="w-16 text-right">Actions</TableHead>
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
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
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
                    className="text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setEditing(emp)}>
                          <Pencil className="h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onSelect={() => setDeleting(emp)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
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
        title={`Delete ${deleting?.name}?`}
        description={
          deleting && deleting.total > 0
            ? `This will permanently delete ${deleting.name} and their ${deleting.total} application(s). This cannot be undone.`
            : "This will permanently delete this employee. This cannot be undone."
        }
        confirmLabel="Delete"
        onConfirm={async () => {
          if (!deleting) return;
          const res = await deleteEmployee(deleting.id);
          if (res.error) {
            toast.error(res.error);
            throw new Error(res.error);
          }
          toast.success("Employee deleted.");
        }}
      />
    </div>
  );
}
