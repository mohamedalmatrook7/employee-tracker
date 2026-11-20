import { NextResponse, type NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";

import { createClient } from "@/lib/supabase/server";
import { formatDateTimeAr } from "@/lib/format";
import { IncomingCasesReport } from "@/lib/pdf/documents";
import { pdfDisposition, excelDisposition } from "@/lib/pdf/filename";
import { buildIncomingCasesWorkbook } from "@/lib/excel/workbooks";
import type { IncomingCase } from "@/lib/database.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();

  const { data: employee } = await supabase
    .from("employees")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!employee) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: incomingCases } = await supabase
    .from("incoming_cases")
    .select("*")
    .eq("employee_id", params.id)
    .order("case_date", { ascending: false });

  const cases = (incomingCases ?? []) as IncomingCase[];
  const generatedOn = formatDateTimeAr(new Date());
  const format = request.nextUrl.searchParams.get("format") === "xlsx" ? "xlsx" : "pdf";

  if (format === "xlsx") {
    const workbook = buildIncomingCasesWorkbook({
      employeeName: employee.name,
      position: employee.position,
      email: employee.email,
      cases,
      generatedOn,
    });
    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": excelDisposition(`${employee.name} - Incoming Cases`),
        "Cache-Control": "no-store",
      },
    });
  }

  const buffer = await renderToBuffer(
    IncomingCasesReport({
      employeeName: employee.name,
      position: employee.position,
      email: employee.email,
      cases,
      generatedOn,
    })
  );

  const disposition = pdfDisposition(`${employee.name} - Incoming Cases`);

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": disposition,
      "Cache-Control": "no-store",
    },
  });
}
