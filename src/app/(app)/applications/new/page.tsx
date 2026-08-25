import { requireUser } from "@/lib/auth";
import { NewApplicationClient } from "./new-application-client";

export const metadata = { title: "New application" };

export default async function NewApplicationPage({
  searchParams,
}: {
  searchParams: { employee?: string };
}) {
  const { supabase } = await requireUser();

  const [{ data: employees }, { data: managements }] = await Promise.all([
    supabase.from("employees").select("id, name").order("name"),
    supabase.from("managements").select("id, name").order("name"),
  ]);

  return (
    <NewApplicationClient
      employees={employees ?? []}
      managements={managements ?? []}
      preselectedEmployeeId={searchParams.employee}
    />
  );
}
