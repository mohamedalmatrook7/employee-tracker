import { requireUser } from "@/lib/auth";
import { AppNav } from "@/components/app-nav";
import { RealtimeRefresher } from "@/components/realtime-refresher";
import { LocaleProvider } from "@/lib/i18n/provider";
import { getLocale } from "@/lib/i18n/server";

// Data is read fresh on every request (service-role queries, no request cookies
// to make this implicitly dynamic), so opt the whole app segment out of static
// prerendering — otherwise pages would serve stale build-time data.
export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();
  const locale = getLocale();

  return (
    <LocaleProvider locale={locale}>
      <div className="min-h-screen bg-muted/20">
        <RealtimeRefresher />
        <AppNav />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </div>
    </LocaleProvider>
  );
}
