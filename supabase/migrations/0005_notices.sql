-- =====================================================================
-- Notices (الاشعارات) — student issue notices raised to a responsible
-- employee about a specific school.
--
--   notices — one row per notice. `notice_number` (رقم الاشعار) is typed by
--   the supervisor and must be unique, so the same notice can't be added
--   twice. `problem_type` (نوع المشكلة) is free text; the UI offers the
--   distinct values already used as a reusable dropdown.
--
-- Same model as the rest of the app: single-user, writes go through the
-- service role server-side, the browser only subscribes to Realtime.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------
create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  supervisor_id uuid not null references public.profiles (id) on delete cascade,
  notice_number text not null,                       -- رقم الاشعار (unique per supervisor)
  student_name text not null,                        -- اسم الطالب
  cpr text,                                          -- الرقم الشخصي
  school_name text,                                  -- المدرسة (snapshot)
  employee_id uuid references public.employees (id) on delete set null, -- الموظف المسؤول
  problem_type text,                                 -- نوع المشكلة (free text, reused)
  notice_date date,                                  -- التاريخ
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notices_number_unique unique (supervisor_id, notice_number)
);

-- ---------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------
create index if not exists notices_supervisor_id_idx on public.notices (supervisor_id);
create index if not exists notices_employee_id_idx on public.notices (employee_id);

-- ---------------------------------------------------------------------
-- updated_at trigger (reuse public.set_updated_at from 0001)
-- ---------------------------------------------------------------------
drop trigger if exists notices_set_updated_at on public.notices;
create trigger notices_set_updated_at
  before update on public.notices
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Row Level Security (scoped to supervisor_id = auth.uid(), like the rest)
-- ---------------------------------------------------------------------
alter table public.notices enable row level security;

drop policy if exists "notices_all_own" on public.notices;
create policy "notices_all_own" on public.notices
  for all using (supervisor_id = auth.uid()) with check (supervisor_id = auth.uid());

-- ---------------------------------------------------------------------
-- Table privileges (service role runs the app server-side; authenticated
-- kept consistent with the other tables)
-- ---------------------------------------------------------------------
grant select, insert, update, delete
  on public.notices
  to authenticated, service_role;

-- ---------------------------------------------------------------------
-- Realtime — browser subscribes so the UI stays live (mirrors 0003/0004).
-- ---------------------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table public.notices;
exception when duplicate_object then null; end $$;

grant select on public.notices to anon;

drop policy if exists "notices_anon_read" on public.notices;
create policy "notices_anon_read" on public.notices
  for select to anon using (true);
