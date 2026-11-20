import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { IncomingCaseDetail } from "./incoming-case-detail";

export const metadata = { title: "Incoming case" };

export default async function IncomingCaseDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { supabase } = await requireUser();

  const { data: incomingCase } = await supabase
    .from("incoming_cases")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!incomingCase) notFound();

  const { data: employee } = incomingCase.employee_id
    ? await supabase
        .from("employees")
        .select("*")
        .eq("id", incomingCase.employee_id)
        .maybeSingle()
    : { data: null };

  return <IncomingCaseDetail incomingCase={incomingCase} employee={employee ?? null} />;
}
