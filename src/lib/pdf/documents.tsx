import fs from "fs";
import path from "path";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

import { formatDate } from "@/lib/format";
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

// ── Arabic / RTL helpers ───────────────────────────────────────────
// Arabic + Supplement + Extended-A + Presentation Forms A/B.
const ARABIC_RE =
  /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;

function isArabic(text?: string | null): boolean {
  return !!text && ARABIC_RE.test(text);
}

/**
 * Text that auto-aligns right when its content is Arabic, so RTL descriptions
 * read correctly. Latin content stays left-aligned.
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
  title: { fontSize: 18, fontWeight: 700 },
  subtitle: { fontSize: 9, color: "#6b7280", marginTop: 2 },
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
  },
  row: { flexDirection: "row", marginBottom: 6 },
  label: {
    width: 130,
    fontSize: 8,
    color: "#6b7280",
    textTransform: "uppercase",
    fontWeight: 700,
  },
  value: { flex: 1, fontSize: 10 },
  // Single-application field value: sits directly beside its label (left
  // aligned) so label and value read together instead of being split apart.
  fieldValue: { flex: 1, fontSize: 10, textAlign: "left" },
  labelCol: { width: 130 },
  labelText: {
    fontSize: 8,
    color: "#6b7280",
    textTransform: "uppercase",
    fontWeight: 700,
  },
  recordedCaption: { fontSize: 8, color: "#9ca3af", marginTop: 3 },
  block: { marginBottom: 10 },
  blockLabel: {
    fontSize: 8,
    color: "#6b7280",
    textTransform: "uppercase",
    fontWeight: 700,
    marginBottom: 3,
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
    alignSelf: "flex-start",
  },
  badgeDone: { backgroundColor: "#dcfce7", color: "#166534" },
  badgePending: { backgroundColor: "#fef3c7", color: "#92400e" },
  statsRow: { flexDirection: "row", gap: 24, marginTop: 8, marginBottom: 4 },
  stat: { fontSize: 10 },
  statNum: { fontWeight: 700 },
  // table
  tHead: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#111827",
    paddingBottom: 4,
    marginTop: 8,
  },
  tRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 5,
  },
  cell: { paddingHorizontal: 4 },
  th: { fontSize: 8, fontWeight: 700, color: "#374151", textAlign: "center" },
  td: { fontSize: 9, textAlign: "center" },
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
  groupSummary: { fontSize: 8, color: "#6b7280", marginTop: 4 },
  appendixItem: {
    borderLeftWidth: 2,
    borderLeftColor: "#d1d5db",
    paddingLeft: 8,
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
  cover: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
  },
  coverKicker: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 3,
    textTransform: "uppercase",
    color: "#6b7280",
  },
  coverMonth: {
    fontSize: 30,
    fontWeight: 700,
    marginTop: 8,
    color: "#111827",
  },
  coverName: { fontSize: 20, fontWeight: 700, marginTop: 28, marginBottom: 5 },
  coverMeta: { fontSize: 11, color: "#6b7280", marginTop: 3 },
  coverStats: {
    flexDirection: "row",
    gap: 28,
    marginTop: 28,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  coverStat: { alignItems: "center" },
  coverStatNum: { fontSize: 22, fontWeight: 700, marginBottom: 4 },
  coverStatLabel: {
    fontSize: 9,
    color: "#6b7280",
    textTransform: "uppercase",
  },
  coverPrepared: { fontSize: 10, color: "#6b7280", marginTop: 36 },
  // Notice detail blocks (spaced, no table)
  noticeItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 12,
    marginBottom: 16,
  },
  noticeHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  noticeTitle: { fontSize: 13, fontWeight: 700 },
  noticeMeta: { fontSize: 9, color: "#6b7280" },
});

function StatusBadge({ status }: { status: "pending" | "done" }) {
  return (
    <Text
      style={[
        styles.badge,
        status === "done" ? styles.badgeDone : styles.badgePending,
      ]}
    >
      {status === "done" ? "Done" : "Pending"}
    </Text>
  );
}

function Footer({ generatedOn }: { generatedOn: string }) {
  return (
    <Text
      style={styles.footer}
      render={({ pageNumber, totalPages }) =>
        `Generated ${generatedOn}  ·  Page ${pageNumber} of ${totalPages}`
      }
      fixed
    />
  );
}

function ApplicationsTable({ apps }: { apps: Application[] }) {
  return (
    <>
      <View style={styles.tHead}>
        <View style={[styles.cell, styles.cDate]}>
          <Text style={styles.th}>Date</Text>
        </View>
        <View style={[styles.cell, styles.cMgmt]}>
          <Text style={styles.th}>Management</Text>
        </View>
        <View style={[styles.cell, styles.cContent]}>
          <Text style={styles.th}>Content</Text>
        </View>
        <View style={[styles.cell, styles.cStatus]}>
          <Text style={styles.th}>Status</Text>
        </View>
        <View style={[styles.cell, styles.cFb]}>
          <Text style={styles.th}>Feedback</Text>
        </View>
      </View>
      {apps.map((a) => (
        <View style={styles.tRow} key={a.id} wrap={false}>
          <View style={[styles.cell, styles.cDate]}>
            <Text style={styles.td}>{formatDate(a.application_date)}</Text>
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
            <Text style={styles.td}>
              {a.status === "done" ? "Done" : "Pending"}
            </Text>
          </View>
          <View style={[styles.cell, styles.cFb]}>
            <Text style={styles.td}>{formatDate(a.feedback_date)}</Text>
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
        Feedback appendix
      </Text>
      {withFeedback.map((a) => (
        <View style={styles.appendixItem} key={a.id} wrap={false}>
          <Text style={styles.bold}>
            {formatDate(a.application_date)}
            {a.management_name ? ` · ${a.management_name}` : ""}
          </Text>
          <Text style={styles.subtitle}>
            Feedback recorded {formatDate(a.feedback_date)}
          </Text>
          {/* Left aligned so the feedback sits directly under its header,
              instead of Arabic being pushed to the right edge. */}
          <Text style={{ marginTop: 3, fontSize: 10, textAlign: "left" }}>
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
    <Document title="Application Report">
      <Page size="A4" style={[styles.page, fontsAvailable ? styles.cairo : undefined]}>
        <View style={styles.headerRule}>
          <Text style={[styles.title, { marginBottom: 6 }]}>
            Application Report
          </Text>
          <Text style={styles.subtitle}>Generated {generatedOn}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Employee</Text>
          <Text style={styles.fieldValue}>
            {employeeName + (employeePosition ? ` · ${employeePosition}` : "")}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Management</Text>
          <Text style={styles.fieldValue}>{app.management_name || "—"}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Application date</Text>
          <Text style={styles.fieldValue}>
            {formatDate(app.application_date)}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Status</Text>
          <View style={styles.fieldValue}>
            <StatusBadge status={app.status} />
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>Content</Text>
          <Text style={styles.fieldValue}>{app.content}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <View style={styles.labelCol}>
            <Text style={styles.labelText}>Feedback</Text>
            {app.feedback_text ? (
              <Text style={styles.recordedCaption}>
                Recorded {formatDate(app.feedback_date)}
              </Text>
            ) : null}
          </View>
          <Text
            style={[
              styles.fieldValue,
              app.feedback_text ? undefined : { color: "#6b7280" },
            ]}
          >
            {app.feedback_text ? app.feedback_text : "No feedback recorded yet."}
          </Text>
        </View>

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
  preparedBy,
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
  preparedBy: string;
  generatedOn: string;
  emptyMessage: string;
}) {
  ensureFonts();
  const total = apps.length;

  return (
    <Document title={docTitle}>
      {/* Cover page */}
      <Page size="A4" style={[styles.page, fontsAvailable ? styles.cairo : undefined]}>
        <View style={styles.cover}>
          <Text style={styles.coverKicker}>{kicker}</Text>
          <Text style={styles.coverMonth}>{heading}</Text>

          <AutoText style={styles.coverName}>{employeeName}</AutoText>
          {position ? (
            <AutoText style={styles.coverMeta}>{position}</AutoText>
          ) : null}
          {email ? <Text style={styles.coverMeta}>{email}</Text> : null}

          <Text style={styles.coverPrepared}>Prepared by {preparedBy}</Text>
        </View>
        <Footer generatedOn={generatedOn} />
      </Page>

      {/* Applications page */}
      <Page size="A4" style={[styles.page, fontsAvailable ? styles.cairo : undefined]}>
        <View style={styles.headerRule}>
          <AutoText style={styles.title}>{employeeName}</AutoText>
        </View>

        {total === 0 ? (
          <Text style={{ marginTop: 8, color: "#6b7280" }}>{emptyMessage}</Text>
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
          <Text style={styles.th}>School</Text>
        </View>
        <View style={[styles.cell, styles.cAtt]}>
          <Text style={styles.th}>Attendance</Text>
        </View>
        <View style={[styles.cell, styles.cEvDate]}>
          <Text style={styles.th}>Date</Text>
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
            <Text style={styles.td}>{formatDate(r.date)}</Text>
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
  preparedBy,
  generatedOn,
}: {
  eventName: string;
  eventMonth: string | null;
  eventPeriod: string | null;
  scopeLabel?: string | null;
  groups: EventReportGroup[];
  preparedBy: string;
  generatedOn: string;
}) {
  ensureFonts();
  const totalSchools = groups.reduce((s, g) => s + g.rows.length, 0);

  // Month and period are rendered on separate lines so the Arabic month and the
  // numeric date range each keep their own text direction and never overlap.
  const month = eventMonth?.trim() || null;
  const period = eventPeriod?.trim() || null;

  return (
    <Document title={`Event Report — ${eventName}`}>
      {/* Cover page */}
      <Page
        size="A4"
        style={[styles.page, fontsAvailable ? styles.cairo : undefined]}
      >
        <View style={styles.cover}>
          <Text style={styles.coverKicker}>Event Report</Text>
          <AutoText style={styles.coverName}>{eventName}</AutoText>
          {month ? <AutoText style={styles.coverMeta}>{month}</AutoText> : null}
          {period ? (
            <AutoText style={styles.coverMeta}>{period}</AutoText>
          ) : null}
          {scopeLabel ? (
            <AutoText style={styles.coverMeta}>{scopeLabel}</AutoText>
          ) : null}

          <Text style={styles.coverPrepared}>Prepared by {preparedBy}</Text>
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
          {month ? <AutoText style={styles.subtitle}>{month}</AutoText> : null}
          {period ? (
            <AutoText style={styles.subtitle}>{period}</AutoText>
          ) : null}
        </View>

        {totalSchools === 0 ? (
          <Text style={{ marginTop: 8, color: "#6b7280" }}>
            No finished schools recorded for this event yet.
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
                  {g.rows.length} schools · {sumAttendance(g.rows)} attendance
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
      <View style={styles.noticeHead}>
        <AutoText style={styles.noticeTitle}>{notice.student_name}</AutoText>
        <Text style={styles.noticeMeta}>
          #{notice.notice_number} · {formatDate(notice.notice_date)}
        </Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>CPR</Text>
        <AutoText style={styles.fieldValue}>{notice.cpr || "—"}</AutoText>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>School</Text>
        <AutoText style={styles.fieldValue}>{notice.school_name || "—"}</AutoText>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Employee</Text>
        <AutoText style={styles.fieldValue}>
          {notice.employee_name || "—"}
        </AutoText>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Problem type</Text>
        <AutoText style={styles.fieldValue}>
          {notice.problem_type || "—"}
        </AutoText>
      </View>
    </View>
  );
}

export function NoticesMonthlyReport({
  monthLabel,
  notices,
  preparedBy,
  generatedOn,
}: {
  monthLabel: string;
  notices: NoticeReportRow[];
  preparedBy: string;
  generatedOn: string;
}) {
  ensureFonts();

  return (
    <Document title={`Notices — ${monthLabel}`}>
      {/* Cover page */}
      <Page
        size="A4"
        style={[styles.page, fontsAvailable ? styles.cairo : undefined]}
      >
        <View style={styles.cover}>
          <Text style={styles.coverKicker}>Monthly Notices Report</Text>
          <Text style={styles.coverMonth}>{monthLabel}</Text>
          <Text style={styles.coverPrepared}>Prepared by {preparedBy}</Text>
        </View>
        <Footer generatedOn={generatedOn} />
      </Page>

      {/* Detail page */}
      <Page
        size="A4"
        style={[styles.page, fontsAvailable ? styles.cairo : undefined]}
      >
        <View style={styles.headerRule}>
          <Text style={styles.title}>Notices</Text>
          <Text style={styles.subtitle}>{monthLabel}</Text>
        </View>

        {notices.length === 0 ? (
          <Text style={{ marginTop: 8, color: "#6b7280" }}>
            No notices recorded for this month.
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
  preparedBy,
  generatedOn,
}: {
  employeeName: string;
  position: string | null;
  email: string | null;
  apps: Application[];
  preparedBy: string;
  generatedOn: string;
}) {
  return (
    <EmployeeReportDocument
      docTitle={`Report — ${employeeName}`}
      kicker="Application Report"
      heading="All Time"
      employeeName={employeeName}
      position={position}
      email={email}
      apps={apps}
      preparedBy={preparedBy}
      generatedOn={generatedOn}
      emptyMessage="This employee has no applications."
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
  preparedBy,
  generatedOn,
}: {
  employeeName: string;
  position: string | null;
  email: string | null;
  monthLabel: string;
  apps: Application[];
  preparedBy: string;
  generatedOn: string;
}) {
  return (
    <EmployeeReportDocument
      docTitle={`${employeeName} — ${monthLabel}`}
      kicker="Monthly Application Report"
      heading={monthLabel}
      employeeName={employeeName}
      position={position}
      email={email}
      apps={apps}
      preparedBy={preparedBy}
      generatedOn={generatedOn}
      emptyMessage="No applications recorded for this month."
    />
  );
}
