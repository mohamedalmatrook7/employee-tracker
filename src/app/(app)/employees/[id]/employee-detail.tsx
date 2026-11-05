"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpDown,
  ClipboardList,
  Download,
  FileText,
  Mail,
  Pencil,
  Plus,
  Printer,
  Search,
} from "lucide-react";

import type { Application, Employee } from "@/lib/database.types";
import { formatDate, truncate } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { EmployeeDialog } from "@/components/employee-dialog";
import { ApplicationDialog } from "@/components/application-dialog";
import { MonthlyReportButton } from "@/components/monthly-report-button";

type Props = {
  employee: Employee;
  applications: Application[];
};

export function EmployeeDetail({ employee, applications }: Props) {
  const router = useRouter();
  const { t } = useI18n();
  const [editEmployeeOpen, setEditEmployeeOpen] = useState(false);
  const [addAppOpen, setAddAppOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [mgmtFilter, setMgmtFilter] = useState<string>("all");
  const [sortAsc, setSortAsc] = useState(false);

  const total = applications.length;
  const pending = applications.filter((a) => a.status === "pending").length;
  const done = total - pending;

  // Distinct management names actually present on this employee's applications.
  const mgmtOptions = useMemo(() => {
    const set = new Set<string>();
    for (const a of applications) {
      if (a.management_name) set.add(a.management_name);
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
    if (mgmtFilter !== "all") {
      rows = rows.filter((a) => (a.management_name ?? "") === mgmtFilter);
    }
    rows.sort((a, b) => {
      const cmp = a.application_date.localeCompare(b.application_date);
      return sortAsc ? cmp : -cmp;
    });
    return rows;
  }, [applications, search, statusFilter, mgmtFilter, sortAsc]);

  return (
    <div className="space-y-6">
      <Link
        href="/employees"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" />
        {t("empDetail.backToEmployees")}
      </Link>

      {/* Employee header */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">
              {employee.name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {employee.position && <span>{employee.position}</span>}
              {employee.email && (
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  {employee.email}
                </span>
              )}
            </div>
            <div className="flex gap-4 pt-2 text-sm">
              <span>
                <strong>{total}</strong> {t("common.total")}
              </span>
              <span className="text-amber-700">
                <strong>{pending}</strong> {t("empDetail.pending")}
              </span>
              <span className="text-green-700">
                <strong>{done}</strong> {t("empDetail.done")}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setEditEmployeeOpen(true)}>
              <Pencil className="h-4 w-4" />
              {t("common.edit")}
            </Button>
            <MonthlyReportButton employeeId={employee.id} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <FileText className="h-4 w-4" />
                  {t("empDetail.allTimeReport")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/employees/${employee.id}/print`} target="_blank">
                    <Printer className="h-4 w-4" />
                    {t("empDetail.printableView")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href={`/api/reports/employee/${employee.id}`}>
                    <Download className="h-4 w-4" />
                    {t("common.downloadPdf")}
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href={`/api/reports/employee/${employee.id}?format=xlsx`}>
                    <Download className="h-4 w-4" />
                    {t("common.downloadExcel")}
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={() => setAddAppOpen(true)}>
              <Plus className="h-4 w-4" />
              {t("empDetail.addApplication")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Applications */}
      <div>
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold">
            {t("empDetail.applications")}
          </h2>
          {total > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("common.searchContent")}
                  className="h-9 w-[200px] ps-8"
                  dir="auto"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.allStatuses")}</SelectItem>
                  <SelectItem value="pending">{t("common.pending")}</SelectItem>
                  <SelectItem value="done">{t("common.done")}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={mgmtFilter} onValueChange={setMgmtFilter}>
                <SelectTrigger className="h-9 w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("common.allManagements")}
                  </SelectItem>
                  {mgmtOptions.map((name) => (
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
            title={t("empDetail.none.title")}
            description={t("empDetail.none.desc", { name: employee.name })}
            action={
              <Button onClick={() => setAddAppOpen(true)}>
                <Plus className="h-4 w-4" />
                {t("empDetail.addApplication")}
              </Button>
            }
          />
        ) : visible.length === 0 ? (
          <EmptyState
            title={t("empDetail.noMatch.title")}
            description={t("empDetail.noMatch.desc")}
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
                      {t("common.date")}
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </TableHead>
                  <TableHead>{t("common.management")}</TableHead>
                  <TableHead>{t("common.content")}</TableHead>
                  <TableHead className="w-28">{t("common.status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((a) => (
                  <TableRow
                    key={a.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/applications/${a.id}`)}
                  >
                    <TableCell className="whitespace-nowrap">
                      {formatDate(a.application_date)}
                    </TableCell>
                    <TableCell className="text-muted-foreground" dir="auto">
                      {a.management_name || "—"}
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

      <EmployeeDialog
        open={editEmployeeOpen}
        onOpenChange={setEditEmployeeOpen}
        employee={employee}
      />
      <ApplicationDialog
        open={addAppOpen}
        onOpenChange={setAddAppOpen}
        lockedEmployeeId={employee.id}
      />
    </div>
  );
}
