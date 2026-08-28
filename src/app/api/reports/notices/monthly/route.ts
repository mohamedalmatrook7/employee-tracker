import { NextResponse, type NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";

import { createClient } from "@/lib/supabase/server";
import { formatDateAr, formatMonthLabelAr, currentMonthISO } from "@/lib/format";
import { NoticesMonthlyReport, type NoticeReportRow } from "@/lib/pdf/documents";
import { pdfDisposition } from "@/lib/pdf/filename";
import { SUPERVISOR_NAME } from "@/lib/single-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Returns [firstDay, firstDayOfNextMonth) as YYYY-MM-DD strings.
function monthRange(month: string): { start: string; endExclusive: string } {
  const [y, m] = month.split("-").map(Number);
  const pad = (n: number) => String(n).padStart(2, "0");
  const start = `${y}-${pad(m)}-01`;
  const ny = m === 12 ? y + 1 : y;
  const nm = m === 12 ? 1 : m + 1;
  const endExclusive = `${ny}-${pad(nm)}-01`;
  return { start, endExclusive };
}

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

  // Validate the requested month; fall back to the current month.
  const raw = request.nextUrl.searchParams.get("month") ?? "";
  const month = /^\d{4}-\d{2}$/.test(raw) ? raw : currentMonthISO();
  const { start, endExclusive } = monthRange(month);

  // Fetch all notices, then narrow to the selected month in JS. As with the
  // monthly employee report, we avoid a chained .gte()/.lt() range filter on
  // notice_date under the service-role client, which can silently drop matching
  // rows. notice_date is an ISO "YYYY-MM-DD" string, so lexical comparison
  // against start/endExclusive is an exact date comparison.
  const { data: allNotices } = await supabase
    .from("notices")
    .select(
      "id, notice_number, student_name, cpr, school_name, problem_type, notice_date, employees(name)"
    )
    .order("notice_date", { ascending: true })
    .order("created_at", { ascending: true });

  const notices: NoticeReportRow[] = ((allNotices ?? []) as unknown as NoticeJoin[])
    .filter(
      (n) =>
        n.notice_date != null &&
        n.notice_date >= start &&
        n.notice_date < endExclusive
    )
    .map((n) => ({
      id: n.id,
      notice_number: n.notice_number,
      student_name: n.student_name,
      cpr: n.cpr,
      school_name: n.school_name,
      employee_name: n.employees?.name ?? null,
      problem_type: n.problem_type,
      notice_date: n.notice_date,
    }));

  const monthLabel = formatMonthLabelAr(month);

  // Arabic "generated on" stamp: Arabic date + 24h local time.
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const generatedOn = `${formatDateAr(today)} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const buffer = await renderToBuffer(
    NoticesMonthlyReport({
      monthLabel,
      notices,
      preparedBy: SUPERVISOR_NAME,
      generatedOn,
    })
  );

  const disposition = pdfDisposition(`الاشعارات - ${monthLabel}`);

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": disposition,
      "Cache-Control": "no-store",
    },
  });
}
