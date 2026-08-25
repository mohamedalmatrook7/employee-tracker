import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { formatDate, formatDateTime, truncate } from "@/lib/format";
import { PrintToolbar } from "@/components/print-toolbar";

export const metadata = { title: "Employee report" };

export default async function EmployeePrintPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: employee } = await supabase
    .from("employees")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!employee) notFound();

  const { data: applications } = await supabase
    .from("applications")
    .select("*")
    .eq("employee_id", params.id)
    .order("application_date", { ascending: false });

  const apps = applications ?? [];
  const total = apps.length;
  const done = apps.filter((a) => a.status === "done").length;
  const pending = total - done;
  const withFeedback = apps.filter((a) => a.feedback_text);

  return (
    <div>
      <PrintToolbar pdfHref={`/api/reports/employee/${params.id}`} />

      <header className="mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold">Employee Application Report</h1>
        <p className="mt-1 text-sm text-gray-500">
          Generated {formatDateTime(new Date())}
        </p>
      </header>

      <section className="mb-6">
        <h2 className="text-lg font-semibold">{employee.name}</h2>
        {employee.position && (
          <p className="text-sm text-gray-600">{employee.position}</p>
        )}
        {employee.email && (
          <p className="text-sm text-gray-600">{employee.email}</p>
        )}
        <div className="mt-3 flex gap-6 text-sm">
          <span>
            Total: <strong>{total}</strong>
          </span>
          <span>
            Done: <strong>{done}</strong>
          </span>
          <span>
            Pending: <strong>{pending}</strong>
          </span>
        </div>
      </section>

      {total === 0 ? (
        <p className="text-sm italic text-gray-500">
          This employee has no applications.
        </p>
      ) : (
        <>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-center">
                <th className="px-3 py-2 font-semibold">Date</th>
                <th className="px-3 py-2 font-semibold">Management</th>
                <th className="px-3 py-2 font-semibold">Content</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Feedback date</th>
              </tr>
            </thead>
            <tbody>
              {apps.map((a) => (
                <tr key={a.id} className="border-b text-center align-top">
                  <td className="whitespace-nowrap px-3 py-2">
                    {formatDate(a.application_date)}
                  </td>
                  <td className="px-3 py-2" dir="auto">
                    {a.management_name || "—"}
                  </td>
                  <td className="px-3 py-2" dir="auto">
                    {truncate(a.content, 60)}
                  </td>
                  <td className="px-3 py-2">
                    {a.status === "done" ? "Done" : "Pending"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {formatDate(a.feedback_date)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {withFeedback.length > 0 && (
            <section className="mt-8">
              <h3 className="mb-3 text-base font-semibold">
                Feedback appendix
              </h3>
              <div className="space-y-4">
                {withFeedback.map((a) => (
                  <div
                    key={a.id}
                    className="break-inside-avoid border-l-2 border-gray-300 pl-3"
                  >
                    <p className="text-sm font-medium">
                      {formatDate(a.application_date)}
                      {a.management_name ? ` · ${a.management_name}` : ""}
                    </p>
                    <p className="text-xs text-gray-500">
                      Feedback recorded {formatDate(a.feedback_date)}
                    </p>
                    <p
                      className="mt-1 whitespace-pre-wrap text-sm leading-relaxed"
                      dir="auto"
                    >
                      {a.feedback_text}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
