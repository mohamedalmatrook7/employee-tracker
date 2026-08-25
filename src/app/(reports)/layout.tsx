import { requireUser } from "@/lib/auth";

/**
 * Minimal, nav-free layout for on-screen printable report views.
 * Auth is still enforced via requireUser().
 */
export default async function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();
  return (
    <div className="min-h-screen bg-white text-black">
      <div className="print-container mx-auto max-w-3xl px-8 py-10">
        {children}
      </div>
    </div>
  );
}
