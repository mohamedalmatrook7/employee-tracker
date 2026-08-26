"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Download,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import {
  loadEventSchedule,
  updateEventVisit,
  addEventVisit,
  deleteEventVisit,
  type EventVisitRow,
} from "@/lib/actions/event-visits";
import { deleteEvent } from "@/lib/actions/events";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import type { Event, VisitStatus } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EventDialog, type EmployeeOption } from "@/components/event-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { EventDetailData, EventStats } from "./page";

export function EventDetail({
  event,
  employees,
  stats,
}: {
  event: EventDetailData;
  employees: EmployeeOption[];
  stats: EventStats;
}) {
  const router = useRouter();
  const { t } = useI18n();

  const [employeeId, setEmployeeId] = useState("");
  const [rows, setRows] = useState<EventVisitRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState(false);
  const [deletingRow, setDeletingRow] = useState<EventVisitRow | null>(null);

  async function onSelectEmployee(id: string) {
    setEmployeeId(id);
    setRows(null);
    setLoading(true);
    const res = await loadEventSchedule(event.id, id);
    setLoading(false);
    if (res.error) {
      toast.error(res.error);
      setRows([]);
      return;
    }
    setRows(res.rows ?? []);
  }

  /** Optimistically patch a row locally, then persist. */
  async function persist(
    id: string,
    patch: Partial<Pick<EventVisitRow, "school_name" | "visit_date" | "attendance_count" | "status">>
  ) {
    setRows((prev) =>
      prev ? prev.map((r) => (r.id === id ? { ...r, ...patch } : r)) : prev
    );
    const res = await updateEventVisit(id, patch);
    if (res.error) toast.error(res.error);
  }

  function setLocal(id: string, patch: Partial<EventVisitRow>) {
    setRows((prev) =>
      prev ? prev.map((r) => (r.id === id ? { ...r, ...patch } : r)) : prev
    );
  }

  async function toggleStatus(row: EventVisitRow) {
    const next: VisitStatus = row.status === "done" ? "pending" : "done";
    await persist(row.id, { status: next });
  }

  async function addRow() {
    if (!employeeId) return;
    const res = await addEventVisit(event.id, employeeId);
    if (res.error || !res.row) {
      toast.error(res.error ?? "Error");
      return;
    }
    setRows((prev) => (prev ? [...prev, res.row!] : [res.row!]));
  }

  async function removeRow(row: EventVisitRow) {
    const res = await deleteEventVisit(row.id);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    setRows((prev) => (prev ? prev.filter((r) => r.id !== row.id) : prev));
  }

  const doneCount = rows?.filter((r) => r.status === "done").length ?? 0;
  const totalCount = rows?.length ?? 0;

  return (
    <div className="space-y-6">
      <Link
        href="/events"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" />
        {t("eventDetail.back")}
      </Link>

      {/* Event header */}
      <div className="rounded-lg border bg-background p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight" dir="auto">
              {event.name}
            </h1>
            {event.month && (
              <p className="text-sm text-muted-foreground" dir="auto">
                {event.month}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={`/api/reports/event/${event.id}`} download>
                <Download className="h-4 w-4" />
                {t("eventDetail.downloadReport")}
              </a>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" />
              {t("eventDetail.editEvent")}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-destructive hover:text-destructive"
              onClick={() => setDeletingEvent(true)}
              aria-label={t("eventDetail.deleteEvent")}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          <Field label={t("eventDetail.period")} value={event.period} />
          <Field label={t("eventDetail.target")} value={event.target_group} />
          <Field
            label={t("eventDetail.responsible")}
            value={event.employees?.name ?? null}
            fallback={t("eventDetail.unassigned")}
          />
          <Field label={t("eventDetail.notes")} value={event.notes} />
        </dl>
      </div>

      {/* Event statistics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={t("eventDetail.stats.employees")} value={stats.employees} />
        <StatCard
          label={t("eventDetail.stats.schoolsDone")}
          value={
            stats.schoolsTotal > 0
              ? `${stats.schoolsDone} / ${stats.schoolsTotal}`
              : String(stats.schoolsDone)
          }
        />
        <StatCard
          label={t("eventDetail.stats.attendance")}
          value={stats.attendance}
        />
        <StatCard
          label={t("eventDetail.stats.completion")}
          value={
            stats.schoolsTotal > 0
              ? `${Math.round((stats.schoolsDone / stats.schoolsTotal) * 100)}%`
              : "—"
          }
        />
      </div>

      {/* Schedule + attendance */}
      <div className="rounded-lg border bg-background p-5">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">
            {t("eventDetail.scheduleTitle")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("eventDetail.scheduleDesc")}
          </p>
        </div>

        <div className="max-w-sm space-y-2">
          <Label htmlFor="employee-picker">
            {t("eventDetail.selectEmployee")}
          </Label>
          <Select value={employeeId} onValueChange={onSelectEmployee}>
            <SelectTrigger id="employee-picker">
              <SelectValue placeholder={t("eventDetail.selectEmployee")} />
            </SelectTrigger>
            <SelectContent>
              {employees.map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-5">
          {!employeeId ? (
            <p className="text-sm text-muted-foreground">
              {t("eventDetail.pickEmployeePrompt")}
            </p>
          ) : loading ? (
            <p className="text-sm text-muted-foreground">
              {t("eventDetail.loading")}
            </p>
          ) : (
            <div className="space-y-4">
              {totalCount > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={doneCount === totalCount ? "done" : "pending"}>
                    {t("eventDetail.rowsDoneOfTotal", {
                      done: doneCount,
                      total: totalCount,
                    })}
                  </Badge>
                  {doneCount > 0 && (
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={`/api/reports/event/${event.id}/employee/${employeeId}`}
                        download
                      >
                        <Download className="h-4 w-4" />
                        {t("eventDetail.downloadEmployeeReport")}
                      </a>
                    </Button>
                  )}
                </div>
              )}

              {totalCount === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("eventDetail.emptySchedule")}
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10 text-center">#</TableHead>
                        <TableHead className="min-w-[220px]">
                          {t("eventDetail.colSchool")}
                        </TableHead>
                        <TableHead className="w-40">
                          {t("eventDetail.colDate")}
                        </TableHead>
                        <TableHead className="w-28">
                          {t("eventDetail.colAttendance")}
                        </TableHead>
                        <TableHead className="w-32">
                          {t("eventDetail.colStatus")}
                        </TableHead>
                        <TableHead className="w-12" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows!.map((row, i) => (
                        <TableRow
                          key={row.id}
                          className={cn(
                            row.status === "done" &&
                              "bg-green-50/70 hover:bg-green-50"
                          )}
                        >
                          <TableCell className="text-center text-muted-foreground">
                            {i + 1}
                          </TableCell>
                          <TableCell>
                            <Input
                              value={row.school_name}
                              dir="auto"
                              placeholder={t("eventDetail.schoolPlaceholder")}
                              onChange={(e) =>
                                setLocal(row.id, { school_name: e.target.value })
                              }
                              onBlur={(e) => {
                                const v = e.target.value.trim();
                                if (v) persist(row.id, { school_name: v });
                              }}
                              className="h-10 leading-normal"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="date"
                              value={row.visit_date ?? ""}
                              onChange={(e) =>
                                persist(row.id, {
                                  visit_date: e.target.value || null,
                                })
                              }
                              className="h-10 w-fit"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              inputMode="numeric"
                              value={
                                row.attendance_count === null
                                  ? ""
                                  : row.attendance_count
                              }
                              onChange={(e) =>
                                setLocal(row.id, {
                                  attendance_count:
                                    e.target.value === ""
                                      ? null
                                      : Number(e.target.value),
                                })
                              }
                              onBlur={(e) =>
                                persist(row.id, {
                                  attendance_count:
                                    e.target.value === ""
                                      ? null
                                      : Math.max(0, Number(e.target.value)),
                                })
                              }
                              className="h-10"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant={
                                row.status === "done" ? "default" : "outline"
                              }
                              size="sm"
                              className={cn(
                                "h-8 gap-1",
                                row.status === "done" &&
                                  "bg-green-600 text-white hover:bg-green-700"
                              )}
                              onClick={() => toggleStatus(row)}
                            >
                              {row.status === "done" ? (
                                <CheckCircle2 className="h-4 w-4" />
                              ) : (
                                <Circle className="h-4 w-4" />
                              )}
                              {row.status === "done"
                                ? t("common.done")
                                : t("common.pending")}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeletingRow(row)}
                              aria-label={t("eventDetail.deleteRow")}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <Button type="button" variant="outline" size="sm" onClick={addRow}>
                <Plus className="h-4 w-4" />
                {t("eventDetail.addRow")}
              </Button>
            </div>
          )}
        </div>
      </div>

      <EventDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        employees={employees}
        event={event as unknown as Event}
      />

      <ConfirmDialog
        open={deletingEvent}
        onOpenChange={setDeletingEvent}
        title={t("events.deleteTitle")}
        description={t("events.deleteDesc")}
        confirmLabel={t("common.delete")}
        onConfirm={async () => {
          const res = await deleteEvent(event.id);
          if (res.error) {
            toast.error(res.error);
            throw new Error(res.error);
          }
          toast.success(t("events.deleted"));
          router.push("/events");
        }}
      />

      <ConfirmDialog
        open={!!deletingRow}
        onOpenChange={(open) => !open && setDeletingRow(null)}
        title={t("eventDetail.deleteRowTitle")}
        description={t("eventDetail.deleteRowDesc")}
        confirmLabel={t("eventDetail.deleteRow")}
        onConfirm={async () => {
          if (deletingRow) await removeRow(deletingRow);
        }}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function Field({
  label,
  value,
  fallback = "—",
}: {
  label: string;
  value: string | null;
  fallback?: string;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm" dir="auto">
        {value || (
          <span className="text-muted-foreground">{fallback}</span>
        )}
      </dd>
    </div>
  );
}
