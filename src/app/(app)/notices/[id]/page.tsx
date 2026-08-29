import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { NoticeDetail } from "./notice-detail";

export const metadata = { title: "Notice" };

export default async function NoticeDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { supabase } = await requireUser();

  const { data: notice } = await supabase
    .from("notices")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!notice) notFound();

  const { data: employee } = notice.employee_id
    ? await supabase
        .from("employees")
        .select("*")
        .eq("id", notice.employee_id)
        .maybeSingle()
    : { data: null };

  return <NoticeDetail notice={notice} employee={employee ?? null} />;
}
