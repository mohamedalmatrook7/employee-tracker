/**
 * Build a Content-Disposition header value for a report download.
 *
 * `baseName` is the human title (may contain spaces or non-ASCII, e.g. Arabic
 * employee names). We emit both a safe ASCII `filename` fallback and an
 * RFC 5987 `filename*` with the real UTF-8 name, so every browser downloads
 * the file with a sensible title instead of the raw route id.
 */
function buildDisposition(baseName: string, ext: "pdf" | "xlsx"): string {
  const clean = baseName.trim().replace(/\s+/g, " ") || "report";
  // ASCII-only fallback: drop anything outside printable ASCII, strip quotes.
  const ascii =
    clean
      .replace(/[^\x20-\x7E]/g, "")
      .replace(/["\\]/g, "")
      .trim() || "report";
  const encoded = encodeURIComponent(clean);
  return `attachment; filename="${ascii}.${ext}"; filename*=UTF-8''${encoded}.${ext}`;
}

export function pdfDisposition(baseName: string): string {
  return buildDisposition(baseName, "pdf");
}

export function excelDisposition(baseName: string): string {
  return buildDisposition(baseName, "xlsx");
}
