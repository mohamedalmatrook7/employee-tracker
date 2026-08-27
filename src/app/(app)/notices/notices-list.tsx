"use client";

import { useMemo, useState } from "react";
import { Bell, Plus, Search } from "lucide-react";

import { formatDate } from "@/lib/format";
import { useNotices, type NoticeRow } from "@/lib/use-notices";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { NoticeDialog } from "@/components/notice-dialog";

export function NoticesList() {
  const { t } = useI18n();
  const notices = useNotices();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<NoticeRow | null>(null);

  // Distinct problem types already used — offered for reuse in the form.
  const problemTypes = useMemo(() => {
    const set = new Set<string>();
    for (const n of notices ?? []) {
      const p = n.problem_type?.trim();
      if (p) set.add(p);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ar"));
  }, [notices]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return notices ?? [];
    return (notices ?? []).filter(
      (n) =>
        n.notice_number.toLowerCase().includes(q) ||
        n.student_name.toLowerCase().includes(q) ||
        (n.cpr ?? "").toLowerCase().includes(q) ||
        (n.employees?.name ?? "").toLowerCase().includes(q) ||
        (n.school_name ?? "").toLowerCase().includes(q) ||
        (n.problem_type ?? "").toLowerCase().includes(q)
    );
  }, [notices, search]);

  // First client-side load — show a light skeleton instead of stale data.
  if (notices === null) {
    return (
      <div className="space-y-2 rounded-lg border bg-background p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded bg-muted/60" />
        ))}
      </div>
    );
  }

  const total = notices.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("notices.searchPlaceholder")}
            className="h-9 w-[240px] ps-8"
            dir="auto"
          />
        </div>
        <Button className="ms-auto" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          {t("notices.add")}
        </Button>
      </div>

      {total === 0 ? (
        <EmptyState
          icon={Bell}
          title={t("notices.none.title")}
          description={t("notices.none.desc")}
          action={
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" />
              {t("notices.add")}
            </Button>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState
          title={t("notices.noMatch.title")}
          description={t("notices.noMatch.desc")}
        />
      ) : (
        <div className="rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">{t("notices.colNumber")}</TableHead>
                <TableHead>{t("notices.colStudent")}</TableHead>
                <TableHead className="w-32">{t("notices.colCpr")}</TableHead>
                <TableHead>{t("notices.colEmployee")}</TableHead>
                <TableHead>{t("notices.colSchool")}</TableHead>
                <TableHead>{t("notices.colType")}</TableHead>
                <TableHead className="w-28">{t("notices.colDate")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((n) => (
                <TableRow
                  key={n.id}
                  className="cursor-pointer"
                  onClick={() => setEditing(n)}
                >
                  <TableCell className="font-medium" dir="auto">
                    {n.notice_number}
                  </TableCell>
                  <TableCell className="font-medium" dir="auto">
                    {n.student_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground" dir="auto">
                    {n.cpr || "—"}
                  </TableCell>
                  <TableCell dir="auto">{n.employees?.name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground" dir="auto">
                    {n.school_name || "—"}
                  </TableCell>
                  <TableCell dir="auto">{n.problem_type || "—"}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(n.notice_date)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add */}
      <NoticeDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        problemTypes={problemTypes}
      />

      {/* Edit / delete */}
      <NoticeDialog
        key={editing?.id ?? "none"}
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        notice={editing ?? undefined}
        problemTypes={problemTypes}
      />
    </div>
  );
}
