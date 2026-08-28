/**
 * Date/text helpers. Application/feedback dates are stored as `date`
 * (YYYY-MM-DD) strings, so we format them without timezone shifting by
 * parsing the parts manually.
 */

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** "2026-08-24" -> "24 Aug 2026". Returns "—" for null/empty. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return value;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

const MONTHS_FULL = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** "2026-08" -> "August 2026". Returns the input unchanged if unparseable. */
export function formatMonthLabel(month: string): string {
  const [y, m] = month.slice(0, 7).split("-").map(Number);
  if (!y || !m || m < 1 || m > 12) return month;
  return `${MONTHS_FULL[m - 1]} ${y}`;
}

// Arabic (Gregorian) month names, for fully-Arabic PDF reports.
const MONTHS_AR = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

/** "2026-08-24" -> "24 أغسطس 2026". Returns "—" for null/empty. */
export function formatDateAr(value: string | null | undefined): string {
  if (!value) return "—";
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return value;
  return `${d} ${MONTHS_AR[m - 1]} ${y}`;
}

/** "2026-08" -> "أغسطس 2026". Returns the input unchanged if unparseable. */
export function formatMonthLabelAr(month: string): string {
  const [y, m] = month.slice(0, 7).split("-").map(Number);
  if (!y || !m || m < 1 || m > 12) return month;
  return `${MONTHS_AR[m - 1]} ${y}`;
}

/** The current year-month as "YYYY-MM" (local), for month-picker defaults. */
export function currentMonthISO(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 7);
}

/** Full timestamp for "generated on" footers. */
export function formatDateTime(value: string | Date): string {
  const dt = typeof value === "string" ? new Date(value) : value;
  return dt.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Today's date as YYYY-MM-DD (local), for sensible form defaults. */
export function todayISO(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

/** Truncate long content for table cells. */
export function truncate(text: string, max = 80): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "…";
}
