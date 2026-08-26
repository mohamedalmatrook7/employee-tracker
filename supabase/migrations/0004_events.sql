-- =====================================================================
-- Events (الفعاليات) — annual plan activities, plus the visit schedule
-- (جدول الزيارات) they draw from.
--
--   events           — one row per program/activity (seeded from the plan).
--   visit_schedules  — the master per-employee school-visit schedule
--                      (seeded once from جدول الزيارات); the reusable template.
--   event_visits     — a per-event editable COPY of an employee's schedule,
--                      cloned from visit_schedules the first time an event +
--                      employee are opened. Carries attendance + done status,
--                      tracked independently per event.
--
-- Same model as the rest of the app: single-user, writes go through the
-- service role server-side, the browser only subscribes to Realtime.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  supervisor_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  month text,                                        -- الشهر (free text, e.g. "سبتمبر")
  period text,                                       -- الفترة الزمنية
  target_group text,                                 -- الفئة المستهدفة
  notes text,                                        -- الملاحظات (raw snapshot)
  employee_id uuid references public.employees (id) on delete set null, -- responsible
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.visit_schedules (
  id uuid primary key default gen_random_uuid(),
  supervisor_id uuid not null references public.profiles (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete cascade,
  school_name text not null,
  visit_date date,                                   -- nullable: some rows have no parseable date
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.event_visits (
  id uuid primary key default gen_random_uuid(),
  supervisor_id uuid not null references public.profiles (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete cascade,
  school_name text not null,
  visit_date date,
  attendance_count integer,                          -- عدد الحضور (nullable until recorded)
  status text not null default 'pending',            -- 'pending' | 'done'
  sort_order integer not null default 0,
  source_schedule_id uuid references public.visit_schedules (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------
create index if not exists events_supervisor_id_idx on public.events (supervisor_id);
create index if not exists events_employee_id_idx on public.events (employee_id);
create index if not exists visit_schedules_supervisor_id_idx on public.visit_schedules (supervisor_id);
create index if not exists visit_schedules_employee_id_idx on public.visit_schedules (employee_id);
create index if not exists event_visits_supervisor_id_idx on public.event_visits (supervisor_id);
create index if not exists event_visits_event_id_idx on public.event_visits (event_id);
create index if not exists event_visits_event_employee_idx on public.event_visits (event_id, employee_id);

-- ---------------------------------------------------------------------
-- updated_at triggers (reuse public.set_updated_at from 0001)
-- ---------------------------------------------------------------------
drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

drop trigger if exists visit_schedules_set_updated_at on public.visit_schedules;
create trigger visit_schedules_set_updated_at
  before update on public.visit_schedules
  for each row execute function public.set_updated_at();

drop trigger if exists event_visits_set_updated_at on public.event_visits;
create trigger event_visits_set_updated_at
  before update on public.event_visits
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Row Level Security (scoped to supervisor_id = auth.uid(), like the rest)
-- ---------------------------------------------------------------------
alter table public.events         enable row level security;
alter table public.visit_schedules enable row level security;
alter table public.event_visits   enable row level security;

drop policy if exists "events_all_own" on public.events;
create policy "events_all_own" on public.events
  for all using (supervisor_id = auth.uid()) with check (supervisor_id = auth.uid());

drop policy if exists "visit_schedules_all_own" on public.visit_schedules;
create policy "visit_schedules_all_own" on public.visit_schedules
  for all using (supervisor_id = auth.uid()) with check (supervisor_id = auth.uid());

drop policy if exists "event_visits_all_own" on public.event_visits;
create policy "event_visits_all_own" on public.event_visits
  for all using (supervisor_id = auth.uid()) with check (supervisor_id = auth.uid());

-- ---------------------------------------------------------------------
-- Table privileges (service role runs the app server-side; authenticated
-- kept consistent with 0001)
-- ---------------------------------------------------------------------
grant select, insert, update, delete
  on public.events, public.visit_schedules, public.event_visits
  to authenticated, service_role;

-- ---------------------------------------------------------------------
-- Realtime — browser subscribes so the UI stays live (mirrors 0003).
-- ---------------------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table public.events;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.visit_schedules;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.event_visits;
exception when duplicate_object then null; end $$;

grant select on public.events, public.visit_schedules, public.event_visits to anon;

drop policy if exists "events_anon_read" on public.events;
create policy "events_anon_read" on public.events
  for select to anon using (true);

drop policy if exists "visit_schedules_anon_read" on public.visit_schedules;
create policy "visit_schedules_anon_read" on public.visit_schedules
  for select to anon using (true);

drop policy if exists "event_visits_anon_read" on public.event_visits;
create policy "event_visits_anon_read" on public.event_visits
  for select to anon using (true);
