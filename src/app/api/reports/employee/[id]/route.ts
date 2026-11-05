import { NextResponse, type NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";

import { createClient } from "@/lib/supabase/server";
import { formatDateTimeAr } from "@/lib/format";
import { EmployeeReport } from "@/lib/pdf/documents";
import { pdfDisposition, excelDisposition } from "@/lib/pdf/filename";
import { buildEmployeeWorkbook } from "@/lib/excel/workbooks";
import type { Application } from "@/lib/database.types";

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

  const { data: applications } = await supabase
    .from("applications")
    .select("*")
    .eq("employee_id", params.id)
    .order("application_date", { ascending: false });

  const apps = (applications ?? []) as Application[];
  const generatedOn = formatDateTimeAr(new Date());
  const format = request.nextUrl.searchParams.get("format") === "xlsx" ? "xlsx" : "pdf";

  if (format === "xlsx") {
    const workbook = buildEmployeeWorkbook({
      employeeName: employee.name,
      position: employee.position,
      email: employee.email,
      heading: "كل الفترات",
      apps,
      generatedOn,
    });
    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": excelDisposition(`${employee.name} - All Applications`),
        "Cache-Control": "no-store",
      },
    });
  }

  const buffer = await renderToBuffer(
    EmployeeReport({
      employeeName: employee.name,
      position: employee.position,
      email: employee.email,
      apps,
      generatedOn,
    })
  );

  const disposition = pdfDisposition(`${employee.name} - All Applications`);

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": disposition,
      "Cache-Control": "no-store",
    },
  });
}
