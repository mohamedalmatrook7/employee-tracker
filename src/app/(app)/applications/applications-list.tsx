"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown, ClipboardList, Search } from "lucide-react";

import { formatDate, truncate } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";
import { Input } from "@/components/ui/input";
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

export type ApplicationRow = {
  id: string;
  content: string;
  application_date: string;
  status: "pending" | "done";
  management_name: string | null;
  employee_id: string;
  employees: { name: string } | null;
};

export function ApplicationsList({
  applications,
  initialStatus,
}: {
  applications: ApplicationRow[];
  initialStatus: "pending" | "done" | "all";
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [sortAsc, setSortAsc] = useState(false);

  const visible = useMemo(() => {
    let rows = applications.slice();
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (a) =>
          a.content.toLowerCase().includes(q) ||
          (a.employees?.name ?? "").toLowerCase().includes(q) ||
          (a.management_name ?? "").toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      rows = rows.filter((a) => a.status === statusFilter);
    }
    rows.sort((a, b) => {
      const cmp = a.application_date.localeCompare(b.application_date);
      return sortAsc ? cmp : -cmp;
    });
    return rows;
  }, [applications, search, statusFilter, sortAsc]);

  const total = applications.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("common.searchContent")}
            className="h-9 w-[220px] ps-8"
            dir="auto"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.allStatuses")}</SelectItem>
            <SelectItem value="pending">{t("common.pending")}</SelectItem>
            <SelectItem value="done">{t("common.done")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {total === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={t("applications.none.title")}
          description={t("applications.none.desc")}
        />
      ) : visible.length === 0 ? (
        <EmptyState
          title={t("applications.noMatch.title")}
          description={t("applications.noMatch.desc")}
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
                <TableHead>{t("common.employee")}</TableHead>
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
                  onClick={() =>
                    router.push(`/applications/${a.id}?from=applications`)
                  }
                >
                  <TableCell className="whitespace-nowrap">
                    {formatDate(a.application_date)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {a.employees?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground" dir="auto">
                    {a.management_name || "—"}
                  </TableCell>
                  <TableCell dir="auto">{truncate(a.content, 60)}</TableCell>
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
  );
}
