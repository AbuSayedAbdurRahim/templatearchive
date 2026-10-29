-- Manual RLS verification. Run in the SQL editor AFTER the migration. Every query should return 0 rows / error.
set local role anon;
select count(*) from public.templates;      -- expect: permission denied
reset role;

-- Simulate a signed-in user who is NOT in app_admins (replace with a real non-admin user id, or skip):
-- set local role authenticated;
-- select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000000"}', true);
-- select count(*) from public.templates;   -- expect: 0 rows
-- insert into public.templates(title) values ('x'); -- expect: RLS violation
