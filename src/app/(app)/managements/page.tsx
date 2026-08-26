import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/page-header";
import { ManagementsManager } from "./managements-manager";

export const metadata = { title: "Managements" };

// The list fetches its own data on the client (live + no stale Router Cache
// snapshot on navigation), so this page only renders the header shell.
export default function ManagementsPage() {
  const t = getT();

  return (
    <div>
      <PageHeader
        title={t("managements.title")}
        description={t("managements.subtitle")}
      />
      <ManagementsManager />
    </div>
  );
}
