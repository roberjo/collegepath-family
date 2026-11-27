-- Minimal stand-in for the parts of a Supabase database that our migrations
-- and RLS policies depend on. Used ONLY by scripts/test-db.sh against a
-- throwaway local/CI Postgres. Never run this against a real Supabase project.

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
end
$$;

create schema if not exists auth;
create schema if not exists extensions;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  created_at timestamptz not null default now()
);

-- Supabase reads the caller from the JWT claims that PostgREST puts in settings.
create or replace function auth.uid() returns uuid
language sql stable
as $$
  select nullif(
    coalesce(
      current_setting('request.jwt.claim.sub', true),
      current_setting('request.jwt.claims', true)::jsonb ->> 'sub'
    ),
    ''
  )::uuid
$$;

create or replace function auth.jwt() returns jsonb
language sql stable
as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
$$;

grant usage on schema auth to anon, authenticated, service_role;
grant execute on all functions in schema auth to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;

-- Supabase's default privileges on the public schema.
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Test helpers
-- ---------------------------------------------------------------------------
create schema if not exists tests;
grant usage on schema tests to anon, authenticated;

create or replace function tests.create_user(p_email text) returns uuid
language sql
as $$
  insert into auth.users (email) values (p_email) returning id
$$;

-- Switch the current transaction to act as an authenticated Supabase user.
create or replace function tests.as_user(p_user uuid) returns void
language plpgsql
as $$
begin
  -- Reset first so the auth.users lookup runs with full privileges.
  perform set_config('role', 'none', true);
  perform set_config(
    'request.jwt.claims',
    jsonb_build_object('sub', p_user, 'email', (select email from auth.users where id = p_user), 'role', 'authenticated')::text,
    true
  );
  perform set_config('request.jwt.claim.sub', p_user::text, true);
  perform set_config('role', 'authenticated', true);
end
$$;

create or replace function tests.as_anon() returns void
language plpgsql
as $$
begin
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
end
$$;

create or replace function tests.as_superuser() returns void
language plpgsql
as $$
begin
  perform set_config('role', 'none', true);
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '', true);
end
$$;

create or replace function tests.assert(p_condition boolean, p_message text) returns void
language plpgsql
as $$
begin
  if p_condition is distinct from true then
    raise exception 'ASSERTION FAILED: %', p_message;
  end if;
end
$$;

-- Assert that a statement fails (RLS violation, constraint, or custom error).
create or replace function tests.assert_fails(p_sql text, p_message text) returns void
language plpgsql
as $$
begin
  begin
    execute p_sql;
  exception when others then
    return;
  end;
  raise exception 'ASSERTION FAILED (expected error): %', p_message;
end
$$;

-- Count rows visible to the current role for a query.
create or replace function tests.visible(p_sql text) returns bigint
language plpgsql
as $$
declare
  n bigint;
begin
  execute format('select count(*) from (%s) q', p_sql) into n;
  return n;
end
$$;

grant execute on all functions in schema tests to anon, authenticated;
