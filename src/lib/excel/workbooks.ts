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

  // Column order (right → left, matching the RTL sheet): التاريخ، الرقم
  // الشخصي، اسم الطالب، المدرسة، نوع المشكلة، الموظف المسؤول، رقم الإشعار.
  const headers = [
    "التاريخ",
    "الرقم الشخصي",
    "اسم الطالب",
    "المدرسة",
    "نوع المشكلة",
    "الموظف المسؤول",
    "رقم الإشعار",
  ];
  sheet.columns = [
    { width: 16 },
    { width: 18 },
    { width: 28 },
    { width: 32 },
    { width: 24 },
    { width: 24 },
    { width: 14 },
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
      formatDateAr(n.notice_date),
      n.cpr,
      n.student_name,
      n.school_name,
      n.problem_type,
      n.employee_name,
      n.notice_number,
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

  // Column order (right → left): تاريخ الطلب، الرقم الشخصي للطالب، اسم
  // الطالب، المدرسة، الإدارة، المحتوى، الحالة، تاريخ الملاحظة، نص الملاحظة.
  const headers = [
    "تاريخ الطلب",
    "الرقم الشخصي للطالب",
    "اسم الطالب",
    "المدرسة",
    "الإدارة",
    "المحتوى",
    "الحالة",
    "تاريخ الملاحظة",
    "نص الملاحظة",
  ];
  sheet.columns = [
    { width: 14 },
    { width: 18 },
    { width: 24 },
    { width: 26 },
    { width: 22 },
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
      a.student_cpr,
      a.student_name,
      a.school_name,
      a.management_name,
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

  // Column order (right → left): تاريخ الطلب، الرقم الشخصي للطالب، اسم
  // الطالب، المدرسة، الإدارة، المحتوى، الحالة، تاريخ الملاحظة، نص الملاحظة،
  // الموظف، المسمى الوظيفي.
  const headers = [
    "تاريخ الطلب",
    "الرقم الشخصي للطالب",
    "اسم الطالب",
    "المدرسة",
    "الإدارة",
    "المحتوى",
    "الحالة",
    "تاريخ الملاحظة",
    "نص الملاحظة",
    "الموظف",
    "المسمى الوظيفي",
  ];
  sheet.columns = [
    { width: 14 },
    { width: 18 },
    { width: 24 },
    { width: 26 },
    { width: 22 },
    { width: 50 },
    { width: 14 },
    { width: 14 },
    { width: 50 },
    { width: 22 },
    { width: 20 },
  ];

  const headerRow = writeTitleBlock(sheet, headers.length, "تقرير الطلب", [
    `تاريخ الإنشاء: ${generatedOn}`,
  ]);
  writeHeaderRow(sheet, headerRow, headers);
  writeDataRows(sheet, headerRow + 1, [
    [
      formatDateAr(app.application_date),
      app.student_cpr,
      app.student_name,
      app.school_name,
      app.management_name,
      app.content,
      STATUS_AR[app.status],
      formatDateAr(app.feedback_date),
      app.feedback_text,
      employeeName,
      employeePosition,
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

  // Column order (right → left): تاريخ الزيارة، المدرسة، الحضور، الموظف،
  // المسمى الوظيفي.
  const headers = ["تاريخ الزيارة", "المدرسة", "الحضور", "الموظف", "المسمى الوظيفي"];
  sheet.columns = [
    { width: 16 },
    { width: 32 },
    { width: 12 },
    { width: 24 },
    { width: 20 },
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
        formatDateAr(r.date),
        r.school,
        r.attendance,
        g.employeeName,
        g.position,
      ]);
    }
  }
  writeDataRows(sheet, headerRow + 1, rows);
  finalizeSheet(sheet, headerRow, headers.length);
  return wb;
}
