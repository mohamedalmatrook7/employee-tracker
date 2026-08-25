import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { ManagementDetail, type ManagementAppRow } from "./management-detail";

export const metadata = { title: "Management" };

export default async function ManagementDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { supabase } = await requireUser();

  const { data: management } = await supabase
    .from("managements")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!management) notFound();

  const { data: applications } = await supabase
    .from("applications")
    .select("*, employees(id, name)")
    .eq("management_id", params.id)
    .order("application_date", { ascending: false });

  return (
    <ManagementDetail
      management={management}
      applications={(applications ?? []) as unknown as ManagementAppRow[]}
    />
  );
}
