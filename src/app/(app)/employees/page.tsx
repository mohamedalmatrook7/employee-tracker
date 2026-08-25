import { requireUser } from "@/lib/auth";
import { EmployeesList } from "./employees-list";

export const metadata = { title: "Employees" };

export default async function EmployeesPage() {
  const { supabase } = await requireUser();

  const [{ data: employees }, { data: apps }] = await Promise.all([
    supabase.from("employees").select("*").order("name"),
    supabase.from("applications").select("employee_id, status"),
  ]);

  const counts = new Map<string, { total: number; pending: number }>();
  for (const a of apps ?? []) {
    const c = counts.get(a.employee_id) ?? { total: 0, pending: 0 };
    c.total += 1;
    if (a.status === "pending") c.pending += 1;
    counts.set(a.employee_id, c);
  }

  const rows = (employees ?? []).map((e) => ({
    ...e,
    total: counts.get(e.id)?.total ?? 0,
    pending: counts.get(e.id)?.pending ?? 0,
  }));

  return (
    <div>
      <EmployeesList employees={rows} />
    </div>
  );
}
