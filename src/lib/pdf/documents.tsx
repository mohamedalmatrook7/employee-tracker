import fs from "fs";
import path from "path";

import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

import { formatDateAr } from "@/lib/format";
import { SUPERVISOR_NAME_AR, SUPERVISOR_TITLE_AR } from "@/lib/single-user";
import type { Application } from "@/lib/database.types";

// ── Fonts ──────────────────────────────────────────────────────────
// Cairo covers both Latin and Arabic, so a single family renders mixed
// (English + Arabic) content. Registered from local static TTFs as data URIs
// so it works regardless of runtime file tracing.
const FONT_DIR = path.join(process.cwd(), "src", "lib", "pdf", "fonts");

function fontDataUri(file: string) {
  const buf = fs.readFileSync(path.join(FONT_DIR, file));
  return `data:font/truetype;base64,${buf.toString("base64")}`;
}

let fontsRegistered = false;
export let fontsAvailable = false;
function ensureFonts() {
  if (fontsRegistered) return;
  fontsRegistered = true;
  try {
    Font.register({
      family: "Cairo",
      fonts: [
        { src: fontDataUri("Cairo-Regular.ttf"), fontWeight: 400 },
        { src: fontDataUri("Cairo-Bold.ttf"), fontWeight: 700 },
      ],
    });
    // Never split words with hyphens (matters for Arabic).
    Font.registerHyphenationCallback((word) => [word]);
    fontsAvailable = true;
  } catch (err) {
    // If the font files aren't present in the deployed bundle, fall back to the
    // built-in font rather than crashing the whole PDF route with a 500.
    // Latin text still renders; Arabic may not until the fonts are bundled.
    fontsAvailable = false;
    console.error("PDF font registration failed, using default font:", err);
  }
}

// ── Logo ───────────────────────────────────────────────────────────
// Ministry of Education banner, shown at the top of every report cover.
// Read from /public as a data URI so it works regardless of file tracing.
const LOGO_PATH = path.join(process.cwd(), "public", "logo_moe.png");
let logoUri: string | null = null;
function getLogo(): string | null {
  if (logoUri !== null) return logoUri || null;
  try {
    logoUri = `data:image/png;base64,${fs
      .readFileSync(LOGO_PATH)
      .toString("base64")}`;
  } catch (err) {
    console.error("PDF logo load failed:", err);
    logoUri = "";
  }
  return logoUri || null;
}

function Logo() {
  const src = getLogo();
  if (!src) return null;
  // eslint-disable-next-line jsx-a11y/alt-text
  return <Image src={src} style={styles.logo} />;
}

// ── Arabic / RTL helpers ───────────────────────────────────────────
// Arabic + Supplement + Extended-A + Presentation Forms A/B.
const ARABIC_RE =
  /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;

function isArabic(text?: string | null): boolean {
  return !!text && ARABIC_RE.test(text);
}

/**
 * Text that auto-aligns for its content: Arabic reads right, Latin (e.g. an
 * email) reads left. Used for data-driven values that may be either.
 */
function AutoText({
  children,
  style,
}: {
  children: string | null | undefined;
  style?: object | object[];
}) {
  const value = children ?? "";
  const rtl = isArabic(value);
  const base = Array.isArray(style) ? style : style ? [style] : [];
  return <Text style={[...base, rtl ? styles.rtl : styles.ltr]}>{value}</Text>;
}

const STATUS_AR: Record<"done" | "pending", string> = {
  done: "منجز",
  pending: "قيد التنفيذ",
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 42,
    paddingBottom: 48,
    paddingHorizontal: 48,
    fontSize: 10,
    color: "#111827",
    lineHeight: 1.5,
  },
  // Applied only when the Cairo fonts registered successfully (see ensureFonts).
  cairo: { fontFamily: "Cairo" },
  ltr: { textAlign: "left" },
  rtl: { textAlign: "right" },
  bold: { fontWeight: 700 },
  // Reports are Arabic → headings/titles align right by default.
  title: { fontSize: 18, fontWeight: 700, textAlign: "right" },
  subtitle: { fontSize: 9, color: "#6b7280", marginTop: 2, textAlign: "right" },
  headerRule: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 6,
    textAlign: "right",
  },
  // Single-application form rows: label sits on the right, value to its left.
  row: { flexDirection: "row-reverse", marginBottom: 6 },
  label: {
    width: 130,
    fontSize: 8,
    color: "#6b7280",
    fontWeight: 700,
    textAlign: "right",
  },
  fieldValue: { flex: 1, fontSize: 10, textAlign: "right" },
  labelCol: { width: 130 },
  labelText: {
    fontSize: 8,
    color: "#6b7280",
    fontWeight: 700,
    textAlign: "right",
  },
  recordedCaption: {
    fontSize: 8,
    color: "#9ca3af",
    marginTop: 3,
    textAlign: "right",
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    marginVertical: 12,
  },
  badge: {
    fontSize: 9,
    fontWeight: 700,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 3,
    alignSelf: "flex-end",
  },
  badgeDone: { backgroundColor: "#dcfce7", color: "#166534" },
  badgePending: { backgroundColor: "#fef3c7", color: "#92400e" },
  // table — RTL: first logical column renders on the right.
  tHead: {
    flexDirection: "row-reverse",
    borderBottomWidth: 1,
    borderBottomColor: "#111827",
    paddingBottom: 4,
    marginTop: 8,
  },
  tRow: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 5,
  },
  cell: { paddingHorizontal: 4 },
  th: { fontSize: 8, fontWeight: 700, color: "#374151", textAlign: "right" },
  td: { fontSize: 9, textAlign: "right" },
  cDate: { width: "15%" },
  cMgmt: { width: "20%" },
  cContent: { width: "34%" },
  cStatus: { width: "13%" },
  cFb: { width: "18%" },
  // Event report columns
  cSchool: { width: "55%" },
  cAtt: { width: "22%" },
  cEvDate: { width: "23%" },
  groupHeading: { fontSize: 12, fontWeight: 700, marginTop: 10 },
  groupSummary: {
    fontSize: 8,
    color: "#6b7280",
    marginTop: 4,
    textAlign: "right",
  },
  appendixItem: {
    borderRightWidth: 2,
    borderRightColor: "#d1d5db",
    paddingRight: 8,
    marginBottom: 10,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    fontSize: 8,
    color: "#9ca3af",
    textAlign: "center",
  },
  // cover page
  logo: { width: 300, marginBottom: 24, alignSelf: "center" },
  cover: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
  },
  // No letter-spacing: Arabic letters must stay joined.
  coverKicker: {
    fontSize: 12,
    fontWeight: 700,
    color: "#6b7280",
    textAlign: "center",
  },
  coverMonth: {
    fontSize: 30,
    fontWeight: 700,
    marginTop: 8,
    color: "#111827",
    textAlign: "center",
  },
  coverName: {
    fontSize: 20,
    fontWeight: 700,
    lineHeight: 1.4,
    marginTop: 30,
    marginBottom: 12,
    textAlign: "center",
  },
  coverMeta: {
    fontSize: 11,
    lineHeight: 1.4,
    color: "#6b7280",
    marginTop: 10,
    textAlign: "center",
  },
  coverPrepared: {
    fontSize: 11,
    fontWeight: 700,
    lineHeight: 1.4,
    color: "#374151",
    marginTop: 40,
    textAlign: "center",
  },
  coverPreparedTitle: {
    fontSize: 10,
    lineHeight: 1.4,
    color: "#6b7280",
    marginTop: 8,
    textAlign: "center",
  },
  // Notice detail blocks (spaced, no table) — fully Arabic / RTL.
  noticeItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 12,
    marginBottom: 16,
  },
  noticeTitle: { fontSize: 13, fontWeight: 700, textAlign: "right", marginBottom: 6 },
  // A single "label: value" line, right-aligned for RTL reading. Shared by the
  // notices and single-application reports.
  fieldLine: { fontSize: 10, textAlign: "right", marginBottom: 6, lineHeight: 1.5 },
  fieldLabel: { color: "#6b7280", fontWeight: 700 },
});

// Credit line shown on every cover: "إعداد: {name}" + job title.
function CoverCredit() {
  return (
    <>
      <Text style={styles.coverPrepared}>إعداد: {SUPERVISOR_NAME_AR}</Text>
      <Text style={styles.coverPreparedTitle}>{SUPERVISOR_TITLE_AR}</Text>
    </>
  );
}

function Footer({ generatedOn }: { generatedOn: string }) {
  return (
    <Text
      style={styles.footer}
      render={({ pageNumber, totalPages }) =>
        `صفحة ${pageNumber} من ${totalPages}  ·  أُنشئ في ${generatedOn}`
      }
      fixed
    />
  );
}

// One right-aligned "التصنيف: القيمة" line. Label and value share a line so it
// reads naturally in Arabic (label on the right, value flows to its left).
// Shared by the notices and single-application reports.
function FieldLine({ label, value }: { label: string; value: string }) {
  return (
    <Text style={styles.fieldLine}>
      <Text style={styles.fieldLabel}>{label}: </Text>
      {value || "—"}
    </Text>
  );
}

function ApplicationsTable({ apps }: { apps: Application[] }) {
  return (
    <>
      <View style={styles.tHead}>
        <View style={[styles.cell, styles.cDate]}>
          <Text style={styles.th}>التاريخ</Text>
        </View>
        <View style={[styles.cell, styles.cMgmt]}>
          <Text style={styles.th}>الإدارة</Text>
        </View>
        <View style={[styles.cell, styles.cContent]}>
          <Text style={styles.th}>المحتوى</Text>
        </View>
        <View style={[styles.cell, styles.cStatus]}>
          <Text style={styles.th}>الحالة</Text>
        </View>
        <View style={[styles.cell, styles.cFb]}>
          <Text style={styles.th}>تاريخ الملاحظة</Text>
        </View>
      </View>
      {apps.map((a) => (
        <View style={styles.tRow} key={a.id} wrap={false}>
          <View style={[styles.cell, styles.cDate]}>
            <Text style={styles.td}>{formatDateAr(a.application_date)}</Text>
          </View>
          <View style={[styles.cell, styles.cMgmt]}>
            <Text style={styles.td}>{a.management_name || "—"}</Text>
          </View>
          <View style={[styles.cell, styles.cContent]}>
            <Text style={styles.td}>
              {a.content.length > 90
                ? a.content.slice(0, 90) + "…"
                : a.content}
            </Text>
          </View>
          <View style={[styles.cell, styles.cStatus]}>
            <Text style={styles.td}>{STATUS_AR[a.status]}</Text>
          </View>
          <View style={[styles.cell, styles.cFb]}>
            <Text style={styles.td}>{formatDateAr(a.feedback_date)}</Text>
          </View>
        </View>
      ))}
    </>
  );
}

function FeedbackAppendix({ apps }: { apps: Application[] }) {
  const withFeedback = apps.filter((a) => a.feedback_text);
  if (withFeedback.length === 0) return null;
  return (
    <View break>
      <Text style={[styles.sectionTitle, { marginTop: 8 }]}>
        ملحق الملاحظات
      </Text>
      {withFeedback.map((a) => (
        <View style={styles.appendixItem} key={a.id} wrap={false}>
          <Text style={[styles.bold, { textAlign: "right" }]}>
            {formatDateAr(a.application_date)}
            {a.management_name ? ` · ${a.management_name}` : ""}
          </Text>
          <Text style={styles.subtitle}>
            سُجّلت الملاحظة في {formatDateAr(a.feedback_date)}
          </Text>
          <Text style={{ marginTop: 3, fontSize: 10, textAlign: "right" }}>
            {a.feedback_text}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ── Single application report ──────────────────────────────────────
export function ApplicationReport({
  app,
  employeeName,
  employeePosition,
  generatedOn,
}: {
  app: Application;
  employeeName: string;
  employeePosition: string | null;
  generatedOn: string;
}) {
  ensureFonts();
  return (
    <Document title="تقرير الطلب">
      <Page
        size="A4"
        style={[styles.page, fontsAvailable ? styles.cairo : undefined]}
      >
        <Logo />
        <View style={styles.headerRule}>
          <Text style={styles.title}>تقرير الطلب</Text>
        </View>

        <FieldLine
          label="الموظف"
          value={
            employeeName + (employeePosition ? ` · ${employeePosition}` : "")
          }
        />
        <FieldLine label="الإدارة" value={app.management_name || "—"} />
        <FieldLine
          label="تاريخ الطلب"
          value={formatDateAr(app.application_date)}
        />
        <FieldLine label="الحالة" value={STATUS_AR[app.status]} />
        <FieldLine label="المحتوى" value={app.content} />
        <FieldLine
          label="الملاحظات"
          value={app.feedback_text || "لا توجد ملاحظات مسجلة بعد."}
        />

        <Footer generatedOn={generatedOn} />
      </Page>
    </Document>
  );
}

// ── Shared employee report document ────────────────────────────────
// Cover page → applications page → feedback appendix (its own page). Used by
// both the all-time and monthly reports; they differ only in cover wording.
function EmployeeReportDocument({
  docTitle,
  kicker,
  heading,
  employeeName,
  position,
  email,
  apps,
  generatedOn,
  emptyMessage,
}: {
  docTitle: string;
  kicker: string;
  heading: string;
  employeeName: string;
  position: string | null;
  email: string | null;
  apps: Application[];
  generatedOn: string;
  emptyMessage: string;
}) {
  ensureFonts();
  const total = apps.length;

  return (
    <Document title={docTitle}>
      {/* Cover page */}
      <Page
        size="A4"
        style={[styles.page, fontsAvailable ? styles.cairo : undefined]}
      >
        <View style={styles.cover}>
          <Logo />
          <Text style={styles.coverKicker}>{kicker}</Text>
          <Text style={styles.coverMonth}>{heading}</Text>

          <AutoText style={styles.coverName}>{employeeName}</AutoText>
          {position ? (
            <AutoText style={styles.coverMeta}>{position}</AutoText>
          ) : null}
          {email ? <Text style={styles.coverMeta}>{email}</Text> : null}

          <CoverCredit />
        </View>
        <Footer generatedOn={generatedOn} />
      </Page>

      {/* Applications page */}
      <Page
        size="A4"
        style={[styles.page, fontsAvailable ? styles.cairo : undefined]}
      >
        <View style={styles.headerRule}>
          <AutoText style={styles.title}>{employeeName}</AutoText>
        </View>

        {total === 0 ? (
          <Text style={{ marginTop: 8, color: "#6b7280", textAlign: "right" }}>
            {emptyMessage}
          </Text>
        ) : (
          <>
            <ApplicationsTable apps={apps} />
            <FeedbackAppendix apps={apps} />
          </>
        )}

        <Footer generatedOn={generatedOn} />
      </Page>
    </Document>
  );
}

// ── Event report (finished schools, grouped by employee) ───────────
export interface EventReportRow {
  school: string;
  attendance: number | null;
  date: string | null; // visit_date, YYYY-MM-DD
}
export interface EventReportGroup {
  employeeName: string;
  position: string | null;
  rows: EventReportRow[];
}

function sumAttendance(rows: EventReportRow[]): number {
  return rows.reduce((s, r) => s + (r.attendance ?? 0), 0);
}

function VisitsTable({ rows }: { rows: EventReportRow[] }) {
  return (
    <>
      <View style={styles.tHead}>
        <View style={[styles.cell, styles.cSchool]}>
          <Text style={styles.th}>المدرسة</Text>
        </View>
        <View style={[styles.cell, styles.cAtt]}>
          <Text style={styles.th}>الحضور</Text>
        </View>
        <View style={[styles.cell, styles.cEvDate]}>
          <Text style={styles.th}>التاريخ</Text>
        </View>
      </View>
      {rows.map((r, i) => (
        <View style={styles.tRow} key={i} wrap={false}>
          <View style={[styles.cell, styles.cSchool]}>
            <AutoText style={styles.td}>{r.school || "—"}</AutoText>
          </View>
          <View style={[styles.cell, styles.cAtt]}>
            <Text style={styles.td}>
              {r.attendance === null ? "—" : String(r.attendance)}
            </Text>
          </View>
          <View style={[styles.cell, styles.cEvDate]}>
            <Text style={styles.td}>{formatDateAr(r.date)}</Text>
          </View>
        </View>
      ))}
    </>
  );
}

export function EventReport({
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
}) {
  ensureFonts();
  const totalSchools = groups.reduce((s, g) => s + g.rows.length, 0);

  // Month and period are rendered on separate lines so the Arabic month and the
  // numeric date range each keep their own text direction and never overlap.
  const month = eventMonth?.trim() || null;
  const period = eventPeriod?.trim() || null;

  return (
    <Document title={`تقرير الفعالية — ${eventName}`}>
      {/* Cover page */}
      <Page
        size="A4"
        style={[styles.page, fontsAvailable ? styles.cairo : undefined]}
      >
        <View style={styles.cover}>
          <Logo />
          <Text style={styles.coverKicker}>تقرير الفعالية</Text>
          <AutoText style={styles.coverName}>{eventName}</AutoText>
          {month ? <AutoText style={styles.coverMeta}>{month}</AutoText> : null}
          {period ? (
            <AutoText style={styles.coverMeta}>{period}</AutoText>
          ) : null}
          {scopeLabel ? (
            <AutoText style={styles.coverMeta}>{scopeLabel}</AutoText>
          ) : null}

          <CoverCredit />
        </View>
        <Footer generatedOn={generatedOn} />
      </Page>

      {/* Detail page */}
      <Page
        size="A4"
        style={[styles.page, fontsAvailable ? styles.cairo : undefined]}
      >
        <View style={styles.headerRule}>
          <AutoText style={styles.title}>{eventName}</AutoText>
        </View>

        {totalSchools === 0 ? (
          <Text style={{ marginTop: 8, color: "#6b7280", textAlign: "right" }}>
            لا توجد مدارس منجزة لهذه الفعالية بعد.
          </Text>
        ) : (
          groups.map((g, gi) => {
            const heading =
              g.employeeName + (g.position ? ` · ${g.position}` : "");
            return (
              <View key={gi} style={{ marginBottom: 12 }}>
                <AutoText style={styles.groupHeading}>{heading}</AutoText>
                <VisitsTable rows={g.rows} />
                <Text style={styles.groupSummary}>
                  عدد المدارس: {g.rows.length} · إجمالي الحضور:{" "}
                  {sumAttendance(g.rows)}
                </Text>
              </View>
            );
          })
        )}

        <Footer generatedOn={generatedOn} />
      </Page>
    </Document>
  );
}

// ── Monthly notices report ─────────────────────────────────────────
// Cover page → one spaced detail block per notice. No statistics, mirroring
// the employee/event reports.
export interface NoticeReportRow {
  id: string;
  notice_number: string;
  student_name: string;
  cpr: string | null;
  school_name: string | null;
  employee_name: string | null;
  problem_type: string | null;
  notice_date: string | null;
}

function NoticeDetail({ notice }: { notice: NoticeReportRow }) {
  return (
    <View style={styles.noticeItem} wrap={false}>
      <Text style={styles.noticeTitle}>
        <Text style={styles.fieldLabel}>الطالب: </Text>
        {notice.student_name}
      </Text>
      <FieldLine label="رقم الإشعار" value={notice.notice_number} />
      <FieldLine label="الرقم الشخصي" value={notice.cpr || "—"} />
      <FieldLine label="المدرسة" value={notice.school_name || "—"} />
      <FieldLine label="الموظف المسؤول" value={notice.employee_name || "—"} />
      <FieldLine label="نوع المشكلة" value={notice.problem_type || "—"} />
      <FieldLine label="التاريخ" value={formatDateAr(notice.notice_date)} />
    </View>
  );
}

export function NoticesMonthlyReport({
  monthLabel,
  notices,
  generatedOn,
}: {
  monthLabel: string;
  notices: NoticeReportRow[];
  generatedOn: string;
}) {
  ensureFonts();

  return (
    <Document title={`الاشعارات — ${monthLabel}`}>
      {/* Cover page */}
      <Page
        size="A4"
        style={[styles.page, fontsAvailable ? styles.cairo : undefined]}
      >
        <View style={styles.cover}>
          <Logo />
          <Text style={styles.coverKicker}>التقرير الشهري للاشعارات</Text>
          <Text style={styles.coverMonth}>{monthLabel}</Text>
          <CoverCredit />
        </View>
        <Footer generatedOn={generatedOn} />
      </Page>

      {/* Detail page — header is just the title, no month. */}
      <Page
        size="A4"
        style={[styles.page, fontsAvailable ? styles.cairo : undefined]}
      >
        <View style={styles.headerRule}>
          <Text style={styles.title}>الاشعارات</Text>
        </View>

        {notices.length === 0 ? (
          <Text style={{ marginTop: 8, color: "#6b7280", textAlign: "right" }}>
            لا توجد اشعارات مسجلة لهذا الشهر.
          </Text>
        ) : (
          notices.map((n) => <NoticeDetail key={n.id} notice={n} />)
        )}

        <Footer generatedOn={generatedOn} />
      </Page>
    </Document>
  );
}

// ── Employee (all applications) report ─────────────────────────────
export function EmployeeReport({
  employeeName,
  position,
  email,
  apps,
  generatedOn,
}: {
  employeeName: string;
  position: string | null;
  email: string | null;
  apps: Application[];
  generatedOn: string;
}) {
  return (
    <EmployeeReportDocument
      docTitle={`تقرير — ${employeeName}`}
      kicker="تقرير الطلبات"
      heading="كل الفترات"
      employeeName={employeeName}
      position={position}
      email={email}
      apps={apps}
      generatedOn={generatedOn}
      emptyMessage="لا توجد طلبات لهذا الموظف."
    />
  );
}

// ── Monthly employee report ────────────────────────────────────────
export function EmployeeMonthlyReport({
  employeeName,
  position,
  email,
  monthLabel,
  apps,
  generatedOn,
}: {
  employeeName: string;
  position: string | null;
  email: string | null;
  monthLabel: string;
  apps: Application[];
  generatedOn: string;
}) {
  return (
    <EmployeeReportDocument
      docTitle={`${employeeName} — ${monthLabel}`}
      kicker="التقرير الشهري للطلبات"
      heading={monthLabel}
      employeeName={employeeName}
      position={position}
      email={email}
      apps={apps}
      generatedOn={generatedOn}
      emptyMessage="لا توجد طلبات مسجلة لهذا الشهر."
    />
  );
}
