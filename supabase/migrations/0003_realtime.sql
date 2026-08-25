-- =====================================================================
-- Realtime — live UI updates when applications / employees / managements
-- change (status flips, new rows, edits, deletes).
--
-- Writes still go through server actions (service role). The browser only
-- SUBSCRIBES, so the anon role needs SELECT + a permissive read policy for
-- Realtime to deliver change events. This matches the app's existing model:
-- it is single-user with no login, so the data is already served without auth.
-- =====================================================================

-- Add the tables to the Realtime publication (idempotent).
do $$
begin
  alter publication supabase_realtime add table public.applications;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.employees;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.managements;
exception when duplicate_object then null;
end $$;

-- Let the browser (anon) read, so Realtime can deliver change payloads.
grant select on public.applications, public.employees, public.managements to anon;

drop policy if exists "applications_anon_read" on public.applications;
create policy "applications_anon_read" on public.applications
  for select to anon using (true);

drop policy if exists "employees_anon_read" on public.employees;
create policy "employees_anon_read" on public.employees
  for select to anon using (true);

drop policy if exists "managements_anon_read" on public.managements;
create policy "managements_anon_read" on public.managements
  for select to anon using (true);
