import { requireUser } from "@/lib/auth";
import { NewApplicationClient } from "./new-application-client";

export const metadata = { title: "New application" };

export default async function NewApplicationPage({
  searchParams,
}: {
  searchParams: { employee?: string };
}) {
  const { supabase } = await requireUser();

  // Only the employee count is needed here — to gate the "add an employee
  // first" empty state. The dialog fetches its own live options.
  const { data: employees } = await supabase
    .from("employees")
    .select("id, name")
    .order("name");

  return (
    <NewApplicationClient
      employees={employees ?? []}
      preselectedEmployeeId={searchParams.employee}
    />
  );
}
