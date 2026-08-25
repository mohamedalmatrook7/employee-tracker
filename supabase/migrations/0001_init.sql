-- =====================================================================
-- Employee Application & Feedback Tracker — initial schema
-- Multi-tenant, per-supervisor isolation enforced entirely by RLS.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

-- Supervisors (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  created_at timestamptz not null default now()
);

-- Employees belonging to a supervisor
create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  supervisor_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  position text,
  email text,
  created_at timestamptz not null default now()
);

-- Reusable, per-supervisor list of managements / departments
create table if not exists public.managements (
  id uuid primary key default gen_random_uuid(),
  supervisor_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (supervisor_id, name)
);

-- Applications assigned to an employee
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  supervisor_id uuid not null references public.profiles (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete cascade,
  management_id uuid references public.managements (id) on delete set null,
  management_name text, -- denormalized snapshot; survives rename/delete of the management
  content text not null,
  application_date date not null,
  feedback_text text, -- NULL = pending, non-null = done
  feedback_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Status is DERIVED, never stored independently, so it cannot drift.
  status text generated always as (
    case when feedback_text is null then 'pending' else 'done' end
  ) stored
);

-- ---------------------------------------------------------------------
-- Indexes (foreign keys + common filters)
-- ---------------------------------------------------------------------
create index if not exists employees_supervisor_id_idx on public.employees (supervisor_id);
create index if not exists managements_supervisor_id_idx on public.managements (supervisor_id);
create index if not exists applications_supervisor_id_idx on public.applications (supervisor_id);
create index if not exists applications_employee_id_idx on public.applications (employee_id);
create index if not exists applications_management_id_idx on public.applications (management_id);
create index if not exists applications_status_idx on public.applications (status);

-- ---------------------------------------------------------------------
-- updated_at trigger on applications
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists applications_set_updated_at on public.applications;
create trigger applications_set_updated_at
  before update on public.applications
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Auto-create a profile row when a new auth user signs up
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.profiles    enable row level security;
alter table public.employees   enable row level security;
alter table public.managements enable row level security;
alter table public.applications enable row level security;

-- profiles: a supervisor can only see / edit their own profile row
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- employees / managements / applications: scoped to supervisor_id = auth.uid()
drop policy if exists "employees_all_own" on public.employees;
create policy "employees_all_own" on public.employees
  for all using (supervisor_id = auth.uid()) with check (supervisor_id = auth.uid());

drop policy if exists "managements_all_own" on public.managements;
create policy "managements_all_own" on public.managements
  for all using (supervisor_id = auth.uid()) with check (supervisor_id = auth.uid());

drop policy if exists "applications_all_own" on public.applications;
create policy "applications_all_own" on public.applications
  for all using (supervisor_id = auth.uid()) with check (supervisor_id = auth.uid());

-- ---------------------------------------------------------------------
-- Table privileges
-- RLS restricts WHICH rows a role sees; it does not grant table access.
-- The API roles still need explicit table privileges. (Hosted Supabase
-- auto-grants these via default privileges; making them explicit here keeps
-- local `supabase db reset` and any fresh database consistent.)
-- ---------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete
  on public.profiles, public.employees, public.managements, public.applications
  to authenticated;

-- The app runs single-user with the service role server-side, so it needs
-- full table access. (service_role also bypasses RLS.)
grant select, insert, update, delete
  on public.profiles, public.employees, public.managements, public.applications
  to service_role;
