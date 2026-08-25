import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { ApplicationDetail } from "./application-detail";

export const metadata = { title: "Application" };

export default async function ApplicationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { supabase } = await requireUser();

  const { data: application } = await supabase
    .from("applications")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!application) notFound();

  const [{ data: employee }, { data: employees }, { data: managements }] =
    await Promise.all([
      supabase
        .from("employees")
        .select("*")
        .eq("id", application.employee_id)
        .maybeSingle(),
      supabase.from("employees").select("id, name").order("name"),
      supabase.from("managements").select("id, name").order("name"),
    ]);

  return (
    <ApplicationDetail
      application={application}
      employee={employee ?? null}
      employees={employees ?? []}
      managements={managements ?? []}
    />
  );
}
