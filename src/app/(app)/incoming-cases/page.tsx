import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/page-header";
import { IncomingCasesList } from "./incoming-cases-list";

export const metadata = { title: "Incoming cases" };

// The list fetches its own data on the client (live + no stale Router Cache
// snapshot on navigation), so this page only renders the header shell.
export default function IncomingCasesPage({
  searchParams,
}: {
  searchParams: { management?: string };
}) {
  const t = getT();

  return (
    <div>
      <PageHeader
        title={t("incomingCases.title")}
        description={t("incomingCases.subtitle")}
      />
      <IncomingCasesList initialSearch={searchParams.management} />
    </div>
  );
}
