import { NextResponse, type NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";

import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";
import { EmployeeReport } from "@/lib/pdf/documents";
import { SUPERVISOR_NAME } from "@/lib/single-user";
import type { Application } from "@/lib/database.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "employee"
  );
}

export async function GET(
  _request: NextRequest,
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

  const buffer = await renderToBuffer(
    EmployeeReport({
      employeeName: employee.name,
      position: employee.position,
      email: employee.email,
      apps: (applications ?? []) as Application[],
      preparedBy: SUPERVISOR_NAME,
      generatedOn: formatDateTime(new Date()),
    })
  );

  const filename = `${slugify(employee.name)}-report.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
