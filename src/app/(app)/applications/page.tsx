import { requireUser } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/page-header";
import { ApplicationsList, type ApplicationRow } from "./applications-list";

export const metadata = { title: "Applications" };

type StatusParam = "pending" | "done" | "all";

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const { supabase } = await requireUser();
  const t = getT();

  const status: StatusParam =
    searchParams.status === "pending"
      ? "pending"
      : searchParams.status === "done"
        ? "done"
        : "all";

  const { data } = await supabase
    .from("applications")
    .select(
      "id, content, application_date, status, management_name, employee_id, employees(name)"
    )
    .order("application_date", { ascending: false });

  const applications = (data ?? []) as unknown as ApplicationRow[];

  const subtitle =
    status === "pending"
      ? t("applications.subtitlePending")
      : status === "done"
        ? t("applications.subtitleDone")
        : t("applications.subtitle");

  return (
    <div>
      <PageHeader title={t("applications.title")} description={subtitle} />
      <ApplicationsList applications={applications} initialStatus={status} />
    </div>
  );
}
