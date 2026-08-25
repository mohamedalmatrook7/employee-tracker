import { requireUser } from "@/lib/auth";
import { AppNav } from "@/components/app-nav";
import { RealtimeRefresher } from "@/components/realtime-refresher";

// Data is read fresh on every request (service-role queries, no request cookies
// to make this implicitly dynamic), so opt the whole app segment out of static
// prerendering — otherwise pages would serve stale build-time data.
export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, user } = await requireUser();

  return (
    <div className="min-h-screen bg-muted/20">
      <RealtimeRefresher />
      <AppNav
        fullName={profile.full_name || "Supervisor"}
        email={profile.email || user.email || ""}
      />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
