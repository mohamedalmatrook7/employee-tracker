-- =====================================================================
-- Incoming cases (الحالات الواردة) — student cases/letters received for an
-- employee to handle. Same shape as applications (employee, school,
-- management/department, student, a request/letter number and date) but
-- shown grouped by employee with a read-only detail page (no status
-- workflow) plus an optional free-text notes field.
--
-- Same model as the rest of the app: single-user, writes go through the
-- service role server-side, the browser only subscribes to Realtime.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------
create table if not exists public.incoming_cases (
  id uuid primary key default gen_random_uuid(),
  supervisor_id uuid not null references public.profiles (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete cascade,
  management_id uuid references public.managements (id) on delete set null,
  management_name text,                              -- denormalized snapshot
  school_name text,                                  -- المدرسة (snapshot)
  student_name text,                                 -- اسم الطالب
  student_cpr text,                                  -- الرقم الشخصي للطالب
  case_number text not null,                          -- رقم الطلب/الخطاب (free text)
  case_date date not null,                            -- تاريخ الطلب
  notes text,                                         -- الملاحظات (optional)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------
create index if not exists incoming_cases_supervisor_id_idx on public.incoming_cases (supervisor_id);
create index if not exists incoming_cases_employee_id_idx on public.incoming_cases (employee_id);
create index if not exists incoming_cases_management_id_idx on public.incoming_cases (management_id);

-- ---------------------------------------------------------------------
-- updated_at trigger (reuse public.set_updated_at from 0001)
-- ---------------------------------------------------------------------
drop trigger if exists incoming_cases_set_updated_at on public.incoming_cases;
create trigger incoming_cases_set_updated_at
  before update on public.incoming_cases
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Row Level Security (scoped to supervisor_id = auth.uid(), like the rest)
-- ---------------------------------------------------------------------
alter table public.incoming_cases enable row level security;

drop policy if exists "incoming_cases_all_own" on public.incoming_cases;
create policy "incoming_cases_all_own" on public.incoming_cases
  for all using (supervisor_id = auth.uid()) with check (supervisor_id = auth.uid());

-- ---------------------------------------------------------------------
-- Table privileges (service role runs the app server-side; authenticated
-- kept consistent with the other tables)
-- ---------------------------------------------------------------------
grant select, insert, update, delete
  on public.incoming_cases
  to authenticated, service_role;

-- ---------------------------------------------------------------------
-- Realtime — browser subscribes so the UI stays live (mirrors 0003/0004/0005).
-- ---------------------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table public.incoming_cases;
exception when duplicate_object then null; end $$;

grant select on public.incoming_cases to anon;

drop policy if exists "incoming_cases_anon_read" on public.incoming_cases;
create policy "incoming_cases_anon_read" on public.incoming_cases
  for select to anon using (true);
