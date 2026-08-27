import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/page-header";
import { NoticesList } from "./notices-list";

export const metadata = { title: "Notices" };

// The list fetches its own data on the client (live + no stale Router Cache
// snapshot on navigation), so this page only renders the header shell.
export default function NoticesPage() {
  const t = getT();

  return (
    <div>
      <PageHeader
        title={t("notices.title")}
        description={t("notices.subtitle")}
      />
      <NoticesList />
    </div>
  );
}
