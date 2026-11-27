-- Phase 0 schema review fixes (see docs/adr/0003-database-migrations-and-testing.md).

-- ---------------------------------------------------------------------------
-- 1. Composite foreign keys with ON DELETE SET NULL
--
-- In 0001 these FKs were declared on (x_id, family_id) with plain
-- "on delete set null", which nulls BOTH columns. family_id is NOT NULL, so
-- deleting a student/application/college that a task or award pointed at
-- failed. PostgreSQL 15+ lets us null only the referencing id column.
-- ---------------------------------------------------------------------------
alter table public.tasks
  drop constraint tasks_student_id_family_id_fkey,
  drop constraint tasks_related_application_id_family_id_fkey,
  drop constraint tasks_related_scholarship_application_id_family_id_fkey;

alter table public.tasks
  add constraint tasks_student_fk foreign key (student_id, family_id)
    references public.students (id, family_id) on delete set null (student_id),
  add constraint tasks_application_fk foreign key (related_application_id, family_id)
    references public.applications (id, family_id) on delete set null (related_application_id),
  add constraint tasks_scholarship_application_fk foreign key (related_scholarship_application_id, family_id)
    references public.scholarship_applications (id, family_id) on delete set null (related_scholarship_application_id);

alter table public.awards
  drop constraint awards_college_id_family_id_fkey,
  drop constraint awards_scholarship_application_id_family_id_fkey;

alter table public.awards
  add constraint awards_college_fk foreign key (college_id, family_id)
    references public.colleges (id, family_id) on delete set null (college_id),
  add constraint awards_scholarship_application_fk foreign key (scholarship_application_id, family_id)
    references public.scholarship_applications (id, family_id) on delete set null (scholarship_application_id);

-- ---------------------------------------------------------------------------
-- 2. Consistent, automatically maintained updated_at timestamps
-- ---------------------------------------------------------------------------
alter table public.families add column updated_at timestamptz not null default now();
alter table public.family_members add column updated_at timestamptz not null default now();
alter table public.colleges add column updated_at timestamptz not null default now();
alter table public.college_interests add column updated_at timestamptz not null default now();
alter table public.application_requirements add column updated_at timestamptz not null default now();
alter table public.awards add column updated_at timestamptz not null default now();

create or replace function public.set_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'families', 'family_members', 'students', 'colleges', 'college_interests',
    'applications', 'application_requirements', 'scholarships',
    'scholarship_applications', 'tasks', 'awards'
  ] loop
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      t
    );
  end loop;
end
$$;

-- ---------------------------------------------------------------------------
-- 3. Archive instead of delete for long-lived directory records
-- ---------------------------------------------------------------------------
alter table public.students add column archived_at timestamptz;
alter table public.colleges add column archived_at timestamptz;
alter table public.scholarships add column archived_at timestamptz;

-- ---------------------------------------------------------------------------
-- 4. Family time zone so date-only deadlines are compared against the
--    family's local "today" rather than the server's (UTC on Vercel).
-- ---------------------------------------------------------------------------
alter table public.families
  add column time_zone text not null default 'America/New_York'
  check (time_zone ~ '^[A-Za-z_]+(/[A-Za-z0-9_+-]+)*$');

-- ---------------------------------------------------------------------------
-- 5. Data integrity checks missed in 0001
-- ---------------------------------------------------------------------------
alter table public.colleges add constraint colleges_cost_nonnegative check (estimated_annual_cost >= 0);
alter table public.scholarships add constraint scholarships_amount_nonnegative check (award_amount >= 0);
alter table public.scholarship_applications add constraint scholarship_apps_amount_nonnegative check (awarded_amount >= 0);
alter table public.families add constraint families_name_not_blank check (length(btrim(name)) > 0);
alter table public.students add constraint students_name_not_blank check (length(btrim(display_name)) > 0);
alter table public.colleges add constraint colleges_name_not_blank check (length(btrim(name)) > 0);
alter table public.scholarships add constraint scholarships_name_not_blank check (length(btrim(name)) > 0);
alter table public.tasks add constraint tasks_title_not_blank check (length(btrim(title)) > 0);

create index college_interests_family_idx on public.college_interests (family_id);
create index application_requirements_app_idx on public.application_requirements (application_id);
create index awards_family_student_idx on public.awards (family_id, student_id);
create index family_members_user_idx on public.family_members (user_id);

-- ---------------------------------------------------------------------------
-- 6. Anonymous visitors never need direct table access. RLS already blocks
--    them, but removing the grants is cheap defense in depth.
-- ---------------------------------------------------------------------------
revoke all on all tables in schema public from anon;
