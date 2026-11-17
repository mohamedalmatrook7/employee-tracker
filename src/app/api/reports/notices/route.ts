import { NextResponse, type NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";

import { createClient } from "@/lib/supabase/server";
import { formatDateTimeAr } from "@/lib/format";
import { NoticesAllReport, type NoticeReportRow } from "@/lib/pdf/documents";
import { pdfDisposition, excelDisposition } from "@/lib/pdf/filename";
import { buildNoticesAllWorkbook } from "@/lib/excel/workbooks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type NoticeJoin = {
  id: string;
  notice_number: string;
  student_name: string;
  cpr: string | null;
  school_name: string | null;
  problem_type: string | null;
  notice_date: string | null;
  employees: { name: string } | null;
};

export async function GET(request: NextRequest) {
  const supabase = createClient();

  const { data: allNotices } = await supabase
    .from("notices")
    .select(
      "id, notice_number, student_name, cpr, school_name, problem_type, notice_date, employees(name)"
    )
    .order("notice_date", { ascending: true })
    .order("created_at", { ascending: true });

  const notices: NoticeReportRow[] = ((allNotices ?? []) as unknown as NoticeJoin[]).map(
    (n) => ({
      id: n.id,
      notice_number: n.notice_number,
      student_name: n.student_name,
      cpr: n.cpr,
      school_name: n.school_name,
      employee_name: n.employees?.name ?? null,
      problem_type: n.problem_type,
      notice_date: n.notice_date,
    })
  );

  const generatedOn = formatDateTimeAr(new Date());
  const format = request.nextUrl.searchParams.get("format") === "xlsx" ? "xlsx" : "pdf";

  if (format === "xlsx") {
    const workbook = buildNoticesAllWorkbook({ notices, generatedOn });
    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": excelDisposition("الاشعارات - التقرير الشامل"),
        "Cache-Control": "no-store",
      },
    });
  }

  const buffer = await renderToBuffer(NoticesAllReport({ notices, generatedOn }));

  const disposition = pdfDisposition("الاشعارات - التقرير الشامل");

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": disposition,
      "Cache-Control": "no-store",
    },
  });
}
