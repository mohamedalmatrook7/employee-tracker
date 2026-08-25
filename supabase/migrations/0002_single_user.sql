-- =====================================================================
-- Single-user mode — no login / registration.
-- The app is used only by Sanaa Shaker, so we drop the Supabase-Auth
-- coupling and seed one fixed profile that owns all data. All data access
-- happens server-side with the service role, so RLS is no longer the gate.
-- =====================================================================

-- No more sign-ups: remove the auth trigger + helper.
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- profiles.id used to reference auth.users(id); with auth removed the profile
-- must be able to stand on its own.
alter table public.profiles
  drop constraint if exists profiles_id_fkey;

-- The single supervisor. Keep this UUID in sync with SUPERVISOR_ID in
-- src/lib/single-user.ts.
insert into public.profiles (id, full_name, email)
values (
  '00000000-0000-0000-0000-000000000001',
  'Sanaa Shaker',
  null
)
on conflict (id) do update set full_name = excluded.full_name;
