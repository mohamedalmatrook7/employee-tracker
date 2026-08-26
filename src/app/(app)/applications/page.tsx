import Link from "next/link";
import { Plus } from "lucide-react";

import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { ApplicationsList } from "./applications-list";

export const metadata = { title: "Applications" };

type StatusParam = "pending" | "done" | "all";

// The list fetches its own data on the client (live + no stale Router Cache
// snapshot on navigation), so this page only renders the header shell.
export default function ApplicationsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const t = getT();

  const status: StatusParam =
    searchParams.status === "pending"
      ? "pending"
      : searchParams.status === "done"
        ? "done"
        : "all";

  const subtitle =
    status === "pending"
      ? t("applications.subtitlePending")
      : status === "done"
        ? t("applications.subtitleDone")
        : t("applications.subtitle");

  return (
    <div>
      <PageHeader
        title={t("applications.title")}
        description={subtitle}
        action={
          <Button asChild>
            <Link href="/applications/new">
              <Plus className="h-4 w-4" />
              {t("dashboard.newApplication")}
            </Link>
          </Button>
        }
      />
      <ApplicationsList initialStatus={status} />
    </div>
  );
}
