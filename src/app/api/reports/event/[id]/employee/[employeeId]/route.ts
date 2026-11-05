import { NextResponse, type NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";

import { createClient } from "@/lib/supabase/server";
import { formatDateTimeAr } from "@/lib/format";
import { EventReport } from "@/lib/pdf/documents";
import { groupEventVisits, type EventVisitJoin } from "@/lib/pdf/event-groups";
import { pdfDisposition, excelDisposition } from "@/lib/pdf/filename";
import { buildEventWorkbook } from "@/lib/excel/workbooks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VISIT_COLS =
  "school_name, attendance_count, visit_date, sort_order, employee_id, employees(name, position)";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; employeeId: string } }
) {
  const supabase = createClient();

  const [{ data: event }, { data: employee }] = await Promise.all([
    supabase
      .from("events")
      .select("id, name, month, period")
      .eq("id", params.id)
      .maybeSingle(),
    supabase
      .from("employees")
      .select("name, position")
      .eq("id", params.employeeId)
      .maybeSingle(),
  ]);

  if (!event || !employee) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: visits } = await supabase
    .from("event_visits")
    .select(VISIT_COLS)
    .eq("event_id", params.id)
    .eq("employee_id", params.employeeId)
    .eq("status", "done")
    .order("sort_order");

  const groups = groupEventVisits(
    (visits ?? []) as unknown as EventVisitJoin[]
  );

  const generatedOn = formatDateTimeAr(new Date());
  const format = request.nextUrl.searchParams.get("format") === "xlsx" ? "xlsx" : "pdf";

  if (format === "xlsx") {
    const workbook = buildEventWorkbook({
      eventName: event.name,
      eventMonth: event.month,
      eventPeriod: event.period,
      scopeLabel: employee.name,
      groups,
      generatedOn,
    });
    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": excelDisposition(`${event.name} - ${employee.name}`),
        "Cache-Control": "no-store",
      },
    });
  }

  const buffer = await renderToBuffer(
    EventReport({
      eventName: event.name,
      eventMonth: event.month,
      eventPeriod: event.period,
      scopeLabel: employee.name,
      groups,
      generatedOn,
    })
  );

  const disposition = pdfDisposition(`${event.name} - ${employee.name}`);

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": disposition,
      "Cache-Control": "no-store",
    },
  });
}
