"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import {
  ApplicationDialog,
  type EmployeeOption,
} from "@/components/application-dialog";
import type { ManagementOption } from "@/components/management-combobox";

export function NewApplicationClient({
  employees,
  managements,
  preselectedEmployeeId,
}: {
  employees: EmployeeOption[];
  managements: ManagementOption[];
  preselectedEmployeeId?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(employees.length > 0);

  if (employees.length === 0) {
    return (
      <div>
        <PageHeader title="New application" />
        <EmptyState
          icon={ClipboardList}
          title="Add an employee first"
          description="Applications are assigned to employees, so you'll need at least one before creating an application."
          action={
            <Button onClick={() => router.push("/employees")}>
              Go to employees
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="New application"
        description="Fill in the details to assign a new application."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            New application
          </Button>
        }
      />
      <ApplicationDialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) router.back();
        }}
        employees={employees}
        managements={managements}
        lockedEmployeeId={preselectedEmployeeId}
      />
    </div>
  );
}
