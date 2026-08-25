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
