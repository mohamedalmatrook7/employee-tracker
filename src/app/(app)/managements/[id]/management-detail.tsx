"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpDown,
  Building2,
  ClipboardList,
  Search,
} from "lucide-react";

import type { Application, Management } from "@/lib/database.types";
import { formatDate, truncate } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";

export type ManagementAppRow = Application & {
  employees: { id: string; name: string } | null;
};

type Props = {
  management: Management;
  applications: ManagementAppRow[];
};

export function ManagementDetail({ management, applications }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [employeeFilter, setEmployeeFilter] = useState<string>("all");
  const [sortAsc, setSortAsc] = useState(false);

  const total = applications.length;
  const pending = applications.filter((a) => a.status === "pending").length;
  const done = total - pending;

  // Distinct employees who have applications under this management.
  const employeeOptions = useMemo(() => {
    const set = new Set<string>();
    for (const a of applications) {
      if (a.employees?.name) set.add(a.employees.name);
    }
    return Array.from(set).sort();
  }, [applications]);

  const visible = useMemo(() => {
    let rows = applications.slice();
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter((a) => a.content.toLowerCase().includes(q));
    }
    if (statusFilter !== "all") {
      rows = rows.filter((a) => a.status === statusFilter);
    }
    if (employeeFilter !== "all") {
      rows = rows.filter((a) => (a.employees?.name ?? "") === employeeFilter);
    }
    rows.sort((a, b) => {
      const cmp = a.application_date.localeCompare(b.application_date);
      return sortAsc ? cmp : -cmp;
    });
    return rows;
  }, [applications, search, statusFilter, employeeFilter, sortAsc]);

  return (
    <div className="space-y-6">
      <Link
        href="/managements"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to managements
      </Link>

      {/* Management header */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              <Building2 className="h-6 w-6 text-muted-foreground" />
              {management.name}
            </h1>
            <div className="flex gap-4 pt-2 text-sm">
              <span>
                <strong>{total}</strong> total
              </span>
              <span className="text-amber-700">
                <strong>{pending}</strong> pending
              </span>
              <span className="text-green-700">
                <strong>{done}</strong> done
              </span>
              <span className="text-muted-foreground">
                <strong>{employeeOptions.length}</strong>{" "}
                {employeeOptions.length === 1 ? "employee" : "employees"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applications */}
      <div>
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold">Applications</h2>
          {total > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search content…"
                  className="h-9 w-[200px] pl-8"
                  dir="auto"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
              <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                <SelectTrigger className="h-9 w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All employees</SelectItem>
                  {employeeOptions.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {total === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No applications yet"
            description={`No applications have been recorded under ${management.name}.`}
          />
        ) : visible.length === 0 ? (
          <EmptyState
            title="No applications match your filters"
            description="Try a different search term, status or employee filter."
          />
        ) : (
          <div className="rounded-lg border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-36">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 hover:text-foreground"
                      onClick={() => setSortAsc((s) => !s)}
                    >
                      Date
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead className="w-28">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((a) => (
                  <TableRow
                    key={a.id}
                    className="cursor-pointer"
                    onClick={() =>
                      router.push(`/applications/${a.id}?from=management`)
                    }
                  >
                    <TableCell className="whitespace-nowrap">
                      {formatDate(a.application_date)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {a.employees ? (
                        <Link
                          href={`/employees/${a.employees.id}`}
                          className="hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {a.employees.name}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell dir="auto">{truncate(a.content, 70)}</TableCell>
                    <TableCell>
                      <StatusBadge status={a.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
