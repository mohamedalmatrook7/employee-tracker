import ExcelJS from "exceljs";

import { formatDateAr } from "@/lib/format";
import type { Application } from "@/lib/database.types";
import type {
  NoticeReportRow,
  EventReportGroup,
} from "@/lib/pdf/documents";

const STATUS_AR: Record<"done" | "pending", string> = {
  done: "منجز",
  pending: "قيد التنفيذ",
};

// ── Shared styling ──────────────────────────────────────────────────
const TITLE_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  size: 16,
  color: { argb: "FF111827" },
};
const SUBTITLE_FONT: Partial<ExcelJS.Font> = {
  size: 11,
  color: { argb: "FF6B7280" },
};
const HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  size: 11,
  color: { argb: "FFFFFFFF" },
};
const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1F2937" },
};
const STRIPE_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFF9FAFB" },
};
const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FFE5E7EB" } },
  bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
  left: { style: "thin", color: { argb: "FFE5E7EB" } },
  right: { style: "thin", color: { argb: "FFE5E7EB" } },
};

function newWorkbook(): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook();
  wb.creator = "نظام متابعة الموظفين";
  wb.created = new Date();
  return wb;
}

/** Title row + centered subtitle rows, merged across every column. Returns
 * the row number the header row should start at (one blank row below). */
function writeTitleBlock(
  sheet: ExcelJS.Worksheet,
  columnCount: number,
  title: string,
  subtitleLines: string[]
): number {
  let row = 1;

  sheet.mergeCells(row, 1, row, columnCount);
  const titleCell = sheet.getCell(row, 1);
  titleCell.value = title;
  titleCell.font = TITLE_FONT;
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(row).height = 28;
  row++;

  for (const line of subtitleLines) {
    sheet.mergeCells(row, 1, row, columnCount);
    const cell = sheet.getCell(row, 1);
    cell.value = line;
    cell.font = SUBTITLE_FONT;
    cell.alignment = { horizontal: "center", vertical: "middle" };
    sheet.getRow(row).height = 18;
    row++;
  }

  row++; // blank spacer row
  return row;
}

function writeHeaderRow(
  sheet: ExcelJS.Worksheet,
  headerRowIndex: number,
  headers: string[]
) {
  const row = sheet.getRow(headerRowIndex);
  headers.forEach((h, i) => {
    const cell = row.getCell(i + 1);
    cell.value = h;
    cell.font = HEADER_FONT;
    cell.fill = HEADER_FILL;
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = THIN_BORDER;
  });
  row.height = 22;
}

function writeDataRows(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  rows: (string | number | null)[][]
) {
  rows.forEach((values, i) => {
    const row = sheet.getRow(startRow + i);
    values.forEach((v, c) => {
      const cell = row.getCell(c + 1);
      cell.value = v === null || v === "" ? "—" : v;
      cell.alignment = { horizontal: "right", vertical: "middle", wrapText: true };
      cell.border = THIN_BORDER;
      if (i % 2 === 1) cell.fill = STRIPE_FILL;
    });
    row.height = 20;
  });
}

/** Autofilter + frozen header row + RTL sheet direction. Call once the
 * header and data rows are in place. */
function finalizeSheet(
  sheet: ExcelJS.Worksheet,
  headerRowIndex: number,
  columnCount: number
) {
  sheet.autoFilter = {
    from: { row: headerRowIndex, column: 1 },
    to: { row: headerRowIndex, column: columnCount },
  };
  sheet.views = [{ rightToLeft: true, state: "frozen", ySplit: headerRowIndex }];
}

// ── Notices monthly workbook ────────────────────────────────────────
export function buildNoticesMonthlyWorkbook({
  monthLabel,
  notices,
  generatedOn,
}: {
  monthLabel: string;
  notices: NoticeReportRow[];
  generatedOn: string;
}): ExcelJS.Workbook {
  const wb = newWorkbook();
  const sheet = wb.addWorksheet("الإشعارات");

  const headers = [
    "رقم الإشعار",
    "اسم الطالب",
    "الرقم الشخصي",
    "المدرسة",
    "الموظف المسؤول",
    "نوع المشكلة",
    "التاريخ",
  ];
  sheet.columns = [
    { width: 14 },
    { width: 28 },
    { width: 18 },
    { width: 32 },
    { width: 24 },
    { width: 24 },
    { width: 16 },
  ];

  const headerRow = writeTitleBlock(
    sheet,
    headers.length,
    `التقرير الشهري للإشعارات — ${monthLabel}`,
    [`عدد الإشعارات: ${notices.length}`, `تاريخ الإنشاء: ${generatedOn}`]
  );
  writeHeaderRow(sheet, headerRow, headers);
  writeDataRows(
    sheet,
    headerRow + 1,
    notices.map((n) => [
      n.notice_number,
      n.student_name,
      n.cpr,
      n.school_name,
      n.employee_name,
      n.problem_type,
      formatDateAr(n.notice_date),
    ])
  );
  finalizeSheet(sheet, headerRow, headers.length);
  return wb;
}

// ── Employee applications workbook (all-time and monthly) ──────────
export function buildEmployeeWorkbook({
  employeeName,
  position,
  email,
  heading,
  apps,
  generatedOn,
}: {
  employeeName: string;
  position: string | null;
  email: string | null;
  heading: string;
  apps: Application[];
  generatedOn: string;
}): ExcelJS.Workbook {
  const wb = newWorkbook();
  const sheet = wb.addWorksheet("الطلبات");

  const headers = [
    "تاريخ الطلب",
    "الإدارة",
    "اسم الطالب",
    "الرقم الشخصي للطالب",
    "المدرسة",
    "المحتوى",
    "الحالة",
    "تاريخ الملاحظة",
    "نص الملاحظة",
  ];
  sheet.columns = [
    { width: 14 },
    { width: 22 },
    { width: 24 },
    { width: 18 },
    { width: 26 },
    { width: 50 },
    { width: 14 },
    { width: 14 },
    { width: 50 },
  ];

  const subtitleLines = [
    [employeeName, position].filter(Boolean).join(" · "),
    email ?? undefined,
    `${heading} · عدد الطلبات: ${apps.length}`,
    `تاريخ الإنشاء: ${generatedOn}`,
  ].filter((l): l is string => !!l);

  const headerRow = writeTitleBlock(
    sheet,
    headers.length,
    `تقرير الطلبات — ${employeeName}`,
    subtitleLines
  );
  writeHeaderRow(sheet, headerRow, headers);
  writeDataRows(
    sheet,
    headerRow + 1,
    apps.map((a) => [
      formatDateAr(a.application_date),
      a.management_name,
      a.student_name,
      a.student_cpr,
      a.school_name,
      a.content,
      STATUS_AR[a.status],
      formatDateAr(a.feedback_date),
      a.feedback_text,
    ])
  );
  finalizeSheet(sheet, headerRow, headers.length);
  return wb;
}

// ── Single application workbook ─────────────────────────────────────
export function buildApplicationWorkbook({
  app,
  employeeName,
  employeePosition,
  generatedOn,
}: {
  app: Application;
  employeeName: string;
  employeePosition: string | null;
  generatedOn: string;
}): ExcelJS.Workbook {
  const wb = newWorkbook();
  const sheet = wb.addWorksheet("الطلب");

  const headers = [
    "الموظف",
    "المسمى الوظيفي",
    "الإدارة",
    "اسم الطالب",
    "الرقم الشخصي للطالب",
    "المدرسة",
    "تاريخ الطلب",
    "الحالة",
    "المحتوى",
    "تاريخ الملاحظة",
    "نص الملاحظة",
  ];
  sheet.columns = [
    { width: 22 },
    { width: 20 },
    { width: 22 },
    { width: 24 },
    { width: 18 },
    { width: 26 },
    { width: 14 },
    { width: 14 },
    { width: 50 },
    { width: 14 },
    { width: 50 },
  ];

  const headerRow = writeTitleBlock(sheet, headers.length, "تقرير الطلب", [
    `تاريخ الإنشاء: ${generatedOn}`,
  ]);
  writeHeaderRow(sheet, headerRow, headers);
  writeDataRows(sheet, headerRow + 1, [
    [
      employeeName,
      employeePosition,
      app.management_name,
      app.student_name,
      app.student_cpr,
      app.school_name,
      formatDateAr(app.application_date),
      STATUS_AR[app.status],
      app.content,
      formatDateAr(app.feedback_date),
      app.feedback_text,
    ],
  ]);
  finalizeSheet(sheet, headerRow, headers.length);
  return wb;
}

// ── Event report workbook (finished schools, grouped by employee) ──
export function buildEventWorkbook({
  eventName,
  eventMonth,
  eventPeriod,
  scopeLabel,
  groups,
  generatedOn,
}: {
  eventName: string;
  eventMonth: string | null;
  eventPeriod: string | null;
  scopeLabel?: string | null;
  groups: EventReportGroup[];
  generatedOn: string;
}): ExcelJS.Workbook {
  const wb = newWorkbook();
  const sheet = wb.addWorksheet("الفعالية");

  const headers = ["الموظف", "المسمى الوظيفي", "المدرسة", "الحضور", "تاريخ الزيارة"];
  sheet.columns = [
    { width: 24 },
    { width: 20 },
    { width: 32 },
    { width: 12 },
    { width: 16 },
  ];

  const totalSchools = groups.reduce((s, g) => s + g.rows.length, 0);
  const totalAttendance = groups.reduce(
    (s, g) => s + g.rows.reduce((rs, r) => rs + (r.attendance ?? 0), 0),
    0
  );

  const subtitleLines = [
    eventMonth ?? undefined,
    eventPeriod ?? undefined,
    scopeLabel ?? undefined,
    `عدد المدارس: ${totalSchools} · إجمالي الحضور: ${totalAttendance}`,
    `تاريخ الإنشاء: ${generatedOn}`,
  ].filter((l): l is string => !!l);

  const headerRow = writeTitleBlock(
    sheet,
    headers.length,
    `تقرير الفعالية — ${eventName}`,
    subtitleLines
  );
  writeHeaderRow(sheet, headerRow, headers);

  const rows: (string | number | null)[][] = [];
  for (const g of groups) {
    for (const r of g.rows) {
      rows.push([
        g.employeeName,
        g.position,
        r.school,
        r.attendance,
        formatDateAr(r.date),
      ]);
    }
  }
  writeDataRows(sheet, headerRow + 1, rows);
  finalizeSheet(sheet, headerRow, headers.length);
  return wb;
}
