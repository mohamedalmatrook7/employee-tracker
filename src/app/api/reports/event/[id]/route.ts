import { NextResponse, type NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";

import { createClient } from "@/lib/supabase/server";
import { formatDateTimeAr } from "@/lib/format";
import { EventReport } from "@/lib/pdf/documents";
import { groupEventVisits, type EventVisitJoin } from "@/lib/pdf/event-groups";
import { pdfDisposition } from "@/lib/pdf/filename";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VISIT_COLS =
  "school_name, attendance_count, visit_date, sort_order, employee_id, employees(name, position)";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, name, month, period")
    .eq("id", params.id)
    .maybeSingle();

  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Only finished (done) schools go in the report.
  const { data: visits } = await supabase
    .from("event_visits")
    .select(VISIT_COLS)
    .eq("event_id", params.id)
    .eq("status", "done")
    .order("sort_order");

  const groups = groupEventVisits(
    (visits ?? []) as unknown as EventVisitJoin[]
  );

  const buffer = await renderToBuffer(
    EventReport({
      eventName: event.name,
      eventMonth: event.month,
      eventPeriod: event.period,
      groups,
      generatedOn: formatDateTimeAr(new Date()),
    })
  );

  const disposition = pdfDisposition(`${event.name} - Event Report`);

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": disposition,
      "Cache-Control": "no-store",
    },
  });
}
