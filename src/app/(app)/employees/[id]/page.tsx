import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { EmployeeDetail } from "./employee-detail";

export const metadata = { title: "Employee" };

export default async function EmployeeDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { supabase } = await requireUser();

  const { data: employee } = await supabase
    .from("employees")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!employee) notFound();

  const [{ data: applications }, { data: managements }] = await Promise.all([
    supabase
      .from("applications")
      .select("*")
      .eq("employee_id", params.id)
      .order("application_date", { ascending: false }),
    supabase.from("managements").select("id, name").order("name"),
  ]);

  return (
    <EmployeeDetail
      employee={employee}
      applications={applications ?? []}
      managements={managements ?? []}
    />
  );
}
