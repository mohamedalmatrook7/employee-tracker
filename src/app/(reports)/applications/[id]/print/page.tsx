import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { formatDate, formatDateTime } from "@/lib/format";
import { PrintToolbar } from "@/components/print-toolbar";
import type { Application } from "@/lib/database.types";

type AppWithEmployee = Application & {
  employees: { name: string; position: string | null } | null;
};

export const metadata = { title: "Application report" };

export default async function ApplicationPrintPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data } = await supabase
    .from("applications")
    .select("*, employees(name, position)")
    .eq("id", params.id)
    .maybeSingle();

  const application = data as AppWithEmployee | null;
  if (!application) notFound();

  const employee = application.employees;

  return (
    <div>
      <PrintToolbar pdfHref={`/api/reports/application/${params.id}`} />

      <header className="mb-8 border-b pb-4">
        <h1 className="text-2xl font-bold">Application Report</h1>
        <p className="mt-1 text-sm text-gray-500">
          Generated {formatDateTime(new Date())}
        </p>
      </header>

      <section className="space-y-5">
        <Row label="Employee">
          {employee?.name ?? "—"}
          {employee?.position ? ` · ${employee.position}` : ""}
        </Row>
        <Row label="Management / Department">
          {application.management_name || "—"}
        </Row>
        <Row label="Application date">
          {formatDate(application.application_date)}
        </Row>
        <Row label="Status">
          {application.status === "done" ? "Done" : "Pending"}
        </Row>
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Content
          </p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {application.content}
          </p>
        </div>

        <div className="border-t pt-5">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Feedback
          </p>
          {application.feedback_text ? (
            <>
              <p className="mb-2 text-xs text-gray-500">
                Recorded {formatDate(application.feedback_date)}
              </p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {application.feedback_text}
              </p>
            </>
          ) : (
            <p className="text-sm italic text-gray-500">
              No feedback recorded yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-3 gap-4 text-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="col-span-2">{children}</div>
    </div>
  );
}
