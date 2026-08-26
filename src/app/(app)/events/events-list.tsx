"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { deleteEvent } from "@/lib/actions/events";
import { useI18n } from "@/lib/i18n/provider";
import { truncate } from "@/lib/format";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { EventDialog, type EmployeeOption } from "@/components/event-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { Event } from "@/lib/database.types";

export type EventRow = {
  id: string;
  name: string;
  month: string | null;
  period: string | null;
  target_group: string | null;
  notes: string | null;
  employee_id: string | null;
  employees: { name: string } | null;
};

export function EventsList({
  events,
  employees,
}: {
  events: EventRow[];
  employees: EmployeeOption[];
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<EventRow | null>(null);
  const [deleting, setDeleting] = useState<EventRow | null>(null);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return events;
    return events.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        (e.month ?? "").toLowerCase().includes(q) ||
        (e.target_group ?? "").toLowerCase().includes(q) ||
        (e.employees?.name ?? "").toLowerCase().includes(q)
    );
  }, [events, search]);

  return (
    <div>
      <PageHeader
        title={t("events.title")}
        description={t("events.subtitle")}
        action={
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            {t("events.add")}
          </Button>
        }
      />

      {events.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={t("events.none.title")}
          description={t("events.none.desc")}
          action={
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" />
              {t("events.addFirst")}
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("events.searchPlaceholder")}
              className="h-9 w-[240px] ps-8"
              dir="auto"
            />
          </div>

          {visible.length === 0 ? (
            <EmptyState
              title={t("events.noMatch.title")}
              description={t("events.noMatch.desc")}
            />
          ) : (
            <div className="rounded-lg border bg-background">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-28">
                      {t("events.colMonth")}
                    </TableHead>
                    <TableHead>{t("events.colProgram")}</TableHead>
                    <TableHead className="w-40">
                      {t("events.colPeriod")}
                    </TableHead>
                    <TableHead>{t("events.colTarget")}</TableHead>
                    <TableHead className="w-40">
                      {t("events.colResponsible")}
                    </TableHead>
                    <TableHead className="w-16 text-end">
                      {t("common.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((ev) => (
                    <TableRow
                      key={ev.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/events/${ev.id}`)}
                    >
                      <TableCell
                        className="whitespace-nowrap text-muted-foreground"
                        dir="auto"
                      >
                        {ev.month || "—"}
                      </TableCell>
                      <TableCell className="font-medium" dir="auto">
                        <Link
                          href={`/events/${ev.id}`}
                          className="inline-flex items-center gap-1 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {truncate(ev.name, 70)}
                          <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground rtl:-scale-x-100" />
                        </Link>
                      </TableCell>
                      <TableCell
                        className="whitespace-nowrap text-muted-foreground"
                        dir="auto"
                      >
                        {ev.period || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground" dir="auto">
                        {ev.target_group || "—"}
                      </TableCell>
                      <TableCell dir="auto">
                        {ev.employees?.name || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell
                        className="text-end"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">
                                {t("common.actions")}
                              </span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => setEditing(ev)}>
                              <Pencil className="h-4 w-4" />
                              {t("common.edit")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onSelect={() => setDeleting(ev)}
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
        </div>
      )}

      <EventDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        employees={employees}
      />
      <EventDialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        employees={employees}
        event={(editing as unknown as Event) ?? undefined}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t("events.deleteTitle")}
        description={t("events.deleteDesc")}
        confirmLabel={t("common.delete")}
        onConfirm={async () => {
          if (!deleting) return;
          const res = await deleteEvent(deleting.id);
          if (res.error) {
            toast.error(res.error);
            throw new Error(res.error);
          }
          toast.success(t("events.deleted"));
        }}
      />
    </div>
  );
}
