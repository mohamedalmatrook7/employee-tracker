import { requireUser } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/page-header";
import { ManagementsManager } from "./managements-manager";

export const metadata = { title: "Managements" };

export default async function ManagementsPage() {
  const { supabase } = await requireUser();
  const t = getT();

  const [{ data: managements }, { data: apps }] = await Promise.all([
    supabase.from("managements").select("*").order("name"),
    supabase.from("applications").select("management_id"),
  ]);

  const usage = new Map<string, number>();
  for (const a of apps ?? []) {
    if (a.management_id) {
      usage.set(a.management_id, (usage.get(a.management_id) ?? 0) + 1);
    }
  }

  const rows = (managements ?? []).map((m) => ({
    ...m,
    usageCount: usage.get(m.id) ?? 0,
  }));

  return (
    <div>
      <PageHeader
        title={t("managements.title")}
        description={t("managements.subtitle")}
      />
      <ManagementsManager managements={rows} />
    </div>
  );
}
