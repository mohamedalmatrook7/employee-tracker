import Image from "next/image";
import Link from "next/link";
import {
  ClipboardList,
  Users,
  Bell,
  ArrowRight,
  Plus,
  Mail,
  Phone,
} from "lucide-react";

import { requireUser } from "@/lib/auth";
import { formatDate, truncate } from "@/lib/format";
import { getT } from "@/lib/i18n/server";
import { SUPERVISOR_EMAIL, SUPERVISOR_PHONE } from "@/lib/single-user";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { ManagementBreakdown } from "./management-breakdown";

export const metadata = { title: "Dashboard" };

type AppRow = {
  id: string;
  content: string;
  application_date: string;
  status: "pending" | "done";
  management_name: string | null;
  employee_id: string;
  employees: { name: string } | null;
};

export default async function DashboardPage() {
  const { supabase } = await requireUser();
  const t = getT();

  const [{ data: apps }, { count: employeeCount }, { count: noticeCount }] =
    await Promise.all([
      supabase
        .from("applications")
        .select(
          "id, content, application_date, status, management_name, employee_id, employees(name)"
        )
        .order("application_date", { ascending: false }),
      supabase.from("employees").select("id", { count: "exact", head: true }),
      supabase.from("notices").select("id", { count: "exact", head: true }),
    ]);

  const applications = (apps ?? []) as unknown as AppRow[];
  const total = applications.length;
  const pending = applications.filter((a) => a.status === "pending").length;

  const recentPending = applications
    .filter((a) => a.status === "pending")
    .slice(0, 5);

  // Per-management breakdown.
  const byManagement = new Map<
    string,
    { name: string; pending: number; done: number; total: number }
  >();
  for (const a of applications) {
    const name = a.management_name || t("dashboard.unassigned");
    const row =
      byManagement.get(name) ?? { name, pending: 0, done: 0, total: 0 };
    row.total += 1;
    if (a.status === "pending") row.pending += 1;
    else row.done += 1;
    byManagement.set(name, row);
  }
  const breakdown = Array.from(byManagement.values()).sort(
    (a, b) => b.total - a.total
  );

  return (
    <div className="space-y-6">
      {/* Ministry logo */}
      <div className="flex justify-center">
        <Image
          src="/logo_moe.png"
          alt={t("profile.group")}
          width={3192}
          height={493}
          priority
          className="h-12 w-auto sm:h-16"
        />
      </div>

      {/* Supervisor header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("dashboard.welcome", { name: t("profile.name") })}
          </h1>
          <div className="mt-2 space-y-0.5 text-sm text-muted-foreground">
            <p>{t("profile.title")}</p>
            <p>{t("profile.group")}</p>
            <p className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span dir="ltr">{SUPERVISOR_EMAIL}</span>
            </p>
            <p className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              <span dir="ltr">{SUPERVISOR_PHONE}</span>
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/applications/new">
            <Plus className="h-4 w-4" />
            {t("dashboard.newApplication")}
          </Link>
        </Button>
      </div>

      {/* Stat cards — each links to a filtered view */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("dashboard.totalApplications")}
          value={total}
          icon={ClipboardList}
          href="/applications"
        />
        <StatCard
          label={t("dashboard.totalNotices")}
          value={noticeCount ?? 0}
          icon={Bell}
          href="/notices"
        />
        <StatCard
          label={t("dashboard.employees")}
          value={employeeCount ?? 0}
          icon={Users}
          href="/employees"
        />
      </div>

      {total === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={t("dashboard.empty.title")}
          description={t("dashboard.empty.desc")}
          action={
            <Button asChild>
              <Link href="/employees">
                <Users className="h-4 w-4" />
                {t("dashboard.goToEmployees")}
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Recent pending */}
          <Card className="lg:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">
                {t("dashboard.recentPending")}
              </CardTitle>
              {pending > recentPending.length && (
                <Link
                  href="/applications?status=pending"
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  {t("dashboard.viewAll")}
                  <ArrowRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
                </Link>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {recentPending.length === 0 ? (
                <p className="px-6 pb-6 text-sm text-muted-foreground">
                  {t("dashboard.caughtUp")}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("common.employee")}</TableHead>
                      <TableHead>{t("common.content")}</TableHead>
                      <TableHead className="w-28">{t("common.date")}</TableHead>
                      <TableHead className="w-24">
                        {t("common.status")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentPending.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/applications/${a.id}`}
                            className="hover:underline"
                          >
                            {a.employees?.name ?? "—"}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground" dir="auto">
                          {truncate(a.content, 40)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {formatDate(a.application_date)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={a.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Per-management breakdown */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">
                {t("dashboard.byManagement")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ManagementBreakdown data={breakdown} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  href,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  accent?: string;
  href: string;
}) {
  return (
    <Link href={href} className="group block">
      <Card className="transition-colors group-hover:border-primary/40 group-hover:bg-muted/40">
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className={`mt-1 text-3xl font-bold ${accent ?? ""}`}>{value}</p>
          </div>
          <Icon className={`h-8 w-8 ${accent ?? "text-muted-foreground"}`} />
        </CardContent>
      </Card>
    </Link>
  );
}
