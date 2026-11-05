import { NextResponse, type NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";

import { createClient } from "@/lib/supabase/server";
import { formatDateTimeAr } from "@/lib/format";
import { ApplicationReport } from "@/lib/pdf/documents";
import { pdfDisposition, excelDisposition } from "@/lib/pdf/filename";
import { buildApplicationWorkbook } from "@/lib/excel/workbooks";
import type { Application } from "@/lib/database.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
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

  const app = application as unknown as Application;
  const employeeName = employee?.name ?? "Employee";
  const employeePosition = employee?.position ?? null;
  const generatedOn = formatDateTimeAr(new Date());
  const format = request.nextUrl.searchParams.get("format") === "xlsx" ? "xlsx" : "pdf";
  const date = app.application_date;

  if (format === "xlsx") {
    const workbook = buildApplicationWorkbook({
      app,
      employeeName,
      employeePosition,
      generatedOn,
    });
    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": excelDisposition(`${employeeName} - Application ${date}`),
        "Cache-Control": "no-store",
      },
    });
  }

  const buffer = await renderToBuffer(
    ApplicationReport({
      app,
      employeeName,
      employeePosition,
      generatedOn,
    })
  );

  const disposition = pdfDisposition(`${employeeName} - Application ${date}`);

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": disposition,
      "Cache-Control": "no-store",
    },
  });
}
