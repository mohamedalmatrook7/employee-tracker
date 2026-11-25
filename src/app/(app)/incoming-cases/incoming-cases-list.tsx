"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronLeft,
  Download,
  FileText,
  Inbox,
  Plus,
  Search,
} from "lucide-react";

import { formatDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";
import { useIncomingCases, type IncomingCaseRow } from "@/lib/use-incoming-cases";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/empty-state";
import { IncomingCaseDialog } from "@/components/incoming-case-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type EmployeeGroup = {
  employeeId: string;
  employeeName: string;
  cases: IncomingCaseRow[];
};

export function IncomingCasesList({
  initialSearch,
}: {
  initialSearch?: string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const cases = useIncomingCases();
  const [search, setSearch] = useState(initialSearch ?? "");
  const [addOpen, setAddOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const q = search.trim().toLowerCase();

  // Group by employee, sorted by name (ar locale). Only employees with at
  // least one case appear.
  const groups = useMemo<EmployeeGroup[]>(() => {
    const byEmployee = new Map<string, EmployeeGroup>();
    for (const c of cases ?? []) {
      const name = c.employees?.name ?? t("incomingCases.unassigned");
      const existing = byEmployee.get(c.employee_id);
      if (existing) {
        existing.cases.push(c);
      } else {
        byEmployee.set(c.employee_id, {
          employeeId: c.employee_id,
          employeeName: name,
          cases: [c],
        });
      }
    }
    return Array.from(byEmployee.values()).sort((a, b) =>
      a.employeeName.localeCompare(b.employeeName, "ar")
    );
  }, [cases, t]);

  // Filter cases within each group by the search query; drop groups left empty.
  const visibleGroups = useMemo(() => {
    if (!q) return groups;
    return groups
      .map((g) => ({
        ...g,
        cases: g.cases.filter(
          (c) =>
            g.employeeName.toLowerCase().includes(q) ||
            (c.student_name ?? "").toLowerCase().includes(q) ||
            (c.student_cpr ?? "").toLowerCase().includes(q) ||
            (c.school_name ?? "").toLowerCase().includes(q) ||
            (c.management_name ?? "").toLowerCase().includes(q) ||
            c.case_number.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.cases.length > 0);
  }, [groups, q]);

  function toggle(employeeId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(employeeId)) next.delete(employeeId);
      else next.add(employeeId);
      return next;
    });
  }

  // First client-side load — show a light skeleton instead of stale data.
  if (cases === null) {
    return (
      <div className="space-y-2 rounded-lg border bg-background p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded bg-muted/60" />
        ))}
      </div>
    );
  }

  const total = cases.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("incomingCases.searchPlaceholder")}
            className="h-9 w-[240px] ps-8"
            dir="auto"
          />
        </div>
        <div className="ms-auto">
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            {t("incomingCases.add")}
          </Button>
        </div>
      </div>

      {total === 0 ? (
        <EmptyState
          icon={Inbox}
          title={t("incomingCases.none.title")}
          description={t("incomingCases.none.desc")}
          action={
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" />
              {t("incomingCases.add")}
            </Button>
          }
        />
      ) : visibleGroups.length === 0 ? (
        <EmptyState
          title={t("incomingCases.noMatch.title")}
          description={t("incomingCases.noMatch.desc")}
        />
      ) : (
        <div className="space-y-2">
          {visibleGroups.map((g) => {
            const isOpen = q ? true : expanded.has(g.employeeId);
            return (
              <div
                key={g.employeeId}
                className="overflow-hidden rounded-lg border bg-background"
              >
                <div className="flex w-full items-center justify-between gap-2 px-4 py-1 hover:bg-muted/40">
                  <button
                    type="button"
                    onClick={() => toggle(g.employeeId)}
                    className="flex flex-1 items-center gap-2 py-2 text-start"
                  >
                    <span className="font-medium" dir="auto">
                      {g.employeeName}
                    </span>
                  </button>
                  <div
                    className="flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label={t("incomingCases.exportAria")}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <a
                            href={`/api/reports/incoming-cases/employee/${g.employeeId}`}
                          >
                            <FileText className="h-4 w-4" />
                            {t("common.downloadPdf")}
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a
                            href={`/api/reports/incoming-cases/employee/${g.employeeId}?format=xlsx`}
                          >
                            <Download className="h-4 w-4" />
                            {t("common.downloadExcel")}
                          </a>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggle(g.employeeId)}
                    aria-label={g.employeeName}
                    className="flex items-center gap-2 py-2 text-sm text-muted-foreground"
                  >
                    {t("incomingCases.caseCount", { count: g.cases.length })}
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
                    )}
                  </button>
                </div>

                {isOpen && (
                  <div className="divide-y border-t">
                    {g.cases.map((c) => (
                      <div
                        key={c.id}
                        className="flex cursor-pointer flex-col gap-1 px-4 py-3 hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
                        onClick={() => router.push(`/incoming-cases/${c.id}`)}
                      >
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                          <span className="font-medium" dir="auto">
                            {c.student_name || "—"}
                          </span>
                          {c.school_name && (
                            <span
                              className="text-muted-foreground"
                              dir="auto"
                            >
                              {c.school_name}
                            </span>
                          )}
                          <span className="text-muted-foreground" dir="auto">
                            #{c.case_number}
                          </span>
                        </div>
                        <span
                          className="whitespace-nowrap text-sm text-muted-foreground"
                          dir="ltr"
                        >
                          {formatDate(c.case_date)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add */}
      <IncomingCaseDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
