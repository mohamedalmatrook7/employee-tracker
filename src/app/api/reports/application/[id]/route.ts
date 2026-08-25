import { NextResponse, type NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";

import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";
import { ApplicationReport } from "@/lib/pdf/documents";
import type { Application } from "@/lib/database.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();

  const { data: application } = await supabase
    .from("applications")
    .select("*, employees(name, position)")
    .eq("id", params.id)
    .maybeSingle();

  if (!application) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const employee = (application as unknown as {
    employees: { name: string; position: string | null } | null;
  }).employees;

  const buffer = await renderToBuffer(
    ApplicationReport({
      app: application as unknown as Application,
      employeeName: employee?.name ?? "Unknown",
      employeePosition: employee?.position ?? null,
      generatedOn: formatDateTime(new Date()),
    })
  );

  const filename = `application-${params.id.slice(0, 8)}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
