import { NextResponse, type NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";

import { createClient } from "@/lib/supabase/server";
import { formatDateTime, formatMonthLabel, currentMonthISO } from "@/lib/format";
import { EmployeeMonthlyReport } from "@/lib/pdf/documents";
import { pdfDisposition } from "@/lib/pdf/filename";
import { SUPERVISOR_NAME } from "@/lib/single-user";
import type { Application } from "@/lib/database.types";

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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();

  // Validate the requested month; fall back to the current month.
  const raw = request.nextUrl.searchParams.get("month") ?? "";
  const month = /^\d{4}-\d{2}$/.test(raw) ? raw : currentMonthISO();
  const { start, endExclusive } = monthRange(month);

  const { data: employee } = await supabase
    .from("employees")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!employee) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: applications } = await supabase
    .from("applications")
    .select("*")
    .eq("employee_id", params.id)
    .gte("application_date", start)
    .lt("application_date", endExclusive)
    .order("application_date", { ascending: true });

  const buffer = await renderToBuffer(
    EmployeeMonthlyReport({
      employeeName: employee.name,
      position: employee.position,
      email: employee.email,
      monthLabel: formatMonthLabel(month),
      apps: (applications ?? []) as Application[],
      preparedBy: SUPERVISOR_NAME,
      generatedOn: formatDateTime(new Date()),
    })
  );

  const disposition = pdfDisposition(
    `${employee.name} - ${formatMonthLabel(month)}`
  );

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": disposition,
      "Cache-Control": "no-store",
    },
  });
}
