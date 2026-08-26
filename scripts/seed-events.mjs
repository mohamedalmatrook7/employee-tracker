/**
 * Seed the Events feature from the two Word documents.
 *
 *   node --env-file=.env.local scripts/seed-events.mjs
 *
 * Idempotent & non-destructive:
 *   - Employees: matches the 15 specialists against existing employees by
 *     normalized Arabic name; only the missing ones are created.
 *   - visit_schedules (master جدول الزيارات): inserted once per employee
 *     (skipped if that employee already has schedule rows).
 *   - events: inserted once per (name + month + period); the responsible
 *     employee is resolved from the "الملاحظات" column.
 *
 * Source data: scripts/events-seed-data.json (generated from the .docx files).
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const SUPERVISOR_ID = "00000000-0000-0000-0000-000000000001";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Run with:  node --env-file=.env.local scripts/seed-events.mjs"
  );
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const __dirname = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(
  readFileSync(join(__dirname, "events-seed-data.json"), "utf8")
);

/** Normalize Arabic text for fuzzy name matching. */
function normalize(s) {
  return (s || "")
    .replace(/ـ/g, "") // tatweel
    .replace(/[أإآ]/g, "ا") // أإآ -> ا
    .replace(/ى/g, "ي") // ى -> ي
    .replace(/ة/g, "ه") // ة -> ه
    .replace(/ؤ/g, "و") // ؤ -> و
    .replace(/ئ/g, "ي") // ئ -> ي
    .replace(/[ً-ْ]/g, "") // diacritics
    .replace(/\s+/g, " ")
    .trim();
}

/** Significant tokens (drops honorifics / single letters). */
function tokens(s) {
  return normalize((s || "").replace(/[.،,]/g, " "))
    .split(" ")
    .map((tk) => tk.trim())
    .filter((tk) => tk.length > 1);
}

function isSubset(sub, sup) {
  const set = new Set(sup);
  return sub.length > 0 && sub.every((tk) => set.has(tk));
}

async function main() {
  // 1) Existing employees ------------------------------------------------
  const { data: existing, error: empErr } = await supabase
    .from("employees")
    .select("id, name, position")
    .eq("supervisor_id", SUPERVISOR_ID);
  if (empErr) throw empErr;

  const byNorm = new Map(); // normalized name -> {id, name}
  const withTokens = []; // {id, name, tokens}
  for (const e of existing ?? []) {
    byNorm.set(normalize(e.name), e);
    withTokens.push({ ...e, tokens: tokens(e.name) });
  }

  function findEmployee(name) {
    const norm = normalize(name);
    if (byNorm.has(norm)) return byNorm.get(norm);
    const tks = tokens(name);
    // token-subset either direction (handles missing middle names both ways)
    const hit = withTokens.find(
      (e) => isSubset(tks, e.tokens) || isSubset(e.tokens, tks)
    );
    return hit ?? null;
  }

  // 2) Match / create the 15 specialists --------------------------------
  const nameToId = new Map(); // seed employee name -> id
  let created = 0,
    matched = 0;
  for (const spec of data.employees) {
    let emp = findEmployee(spec.name);
    if (!emp) {
      const { data: ins, error } = await supabase
        .from("employees")
        .insert({
          supervisor_id: SUPERVISOR_ID,
          name: spec.name,
          position: spec.position ?? null,
        })
        .select("id, name, position")
        .single();
      if (error) throw error;
      emp = ins;
      byNorm.set(normalize(emp.name), emp);
      withTokens.push({ ...emp, tokens: tokens(emp.name) });
      created++;
      console.log(`  + created employee: ${spec.name}`);
    } else {
      matched++;
      console.log(`  = matched employee:  ${spec.name}  ->  ${emp.name}`);
    }
    nameToId.set(spec.name, emp.id);
  }
  console.log(`Employees: ${matched} matched, ${created} created.\n`);

  // 3) Master visit_schedules (skip employees that already have rows) ----
  let schedInserted = 0,
    schedSkipped = 0;
  for (const spec of data.employees) {
    const empId = nameToId.get(spec.name);
    const rows = data.schedules[spec.name] ?? [];
    const { count } = await supabase
      .from("visit_schedules")
      .select("id", { count: "exact", head: true })
      .eq("employee_id", empId);
    if ((count ?? 0) > 0) {
      schedSkipped += rows.length;
      continue;
    }
    const payload = rows.map((r, i) => ({
      supervisor_id: SUPERVISOR_ID,
      employee_id: empId,
      school_name: r.school,
      visit_date: r.date ?? null,
      sort_order: i + 1,
    }));
    if (payload.length) {
      const { error } = await supabase.from("visit_schedules").insert(payload);
      if (error) throw error;
      schedInserted += payload.length;
    }
  }
  console.log(
    `Visit schedules: ${schedInserted} inserted, ${schedSkipped} skipped (already present).\n`
  );

  // 4) Events (dedup by name+month+period) -------------------------------
  const { data: existingEvents, error: evErr } = await supabase
    .from("events")
    .select("name, month, period")
    .eq("supervisor_id", SUPERVISOR_ID);
  if (evErr) throw evErr;
  const eventKey = (name, month, period) =>
    `${normalize(name)}|${normalize(month)}|${normalize(period)}`;
  const seen = new Set(
    (existingEvents ?? []).map((e) => eventKey(e.name, e.month, e.period))
  );

  function resolveResponsible(notes) {
    const tks = tokens(notes);
    if (!tks.length) return null;
    for (const spec of data.employees) {
      if (isSubset(tks, tokens(spec.name))) return nameToId.get(spec.name);
    }
    return null;
  }

  let evInserted = 0,
    evSkipped = 0;
  for (let i = 0; i < data.events.length; i++) {
    const ev = data.events[i];
    const key = eventKey(ev.name, ev.month, ev.period);
    if (seen.has(key)) {
      evSkipped++;
      continue;
    }
    seen.add(key);
    const { error } = await supabase.from("events").insert({
      supervisor_id: SUPERVISOR_ID,
      name: ev.name,
      month: ev.month || null,
      period: ev.period || null,
      target_group: ev.target_group || null,
      notes: ev.notes || null,
      employee_id: resolveResponsible(ev.notes),
      sort_order: i + 1,
    });
    if (error) throw error;
    evInserted++;
  }
  console.log(`Events: ${evInserted} inserted, ${evSkipped} skipped.\n`);
  console.log("Done.");
}

main().catch((e) => {
  console.error("Seed failed:", e.message ?? e);
  process.exit(1);
});
