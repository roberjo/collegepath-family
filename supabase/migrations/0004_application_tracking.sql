-- Phase 3: application and requirement tracking refinements.

-- Submission is a calendar fact ("submitted Nov 1"), not an instant. Store it
-- as a date like the other deadlines (ADR 0006). No production data exists yet.
alter table public.applications rename column submitted_at to submitted_on;
alter table public.applications
  alter column submitted_on type date using (submitted_on at time zone 'UTC')::date;

alter table public.scholarship_applications rename column submitted_at to submitted_on;
alter table public.scholarship_applications
  alter column submitted_on type date using (submitted_on at time zone 'UTC')::date;

alter table public.applications
  add constraint applications_type_not_blank check (length(btrim(application_type)) > 0),
  add constraint applications_portal_url_http check (portal_url is null or portal_url ~* '^https?://');

alter table public.application_requirements
  add constraint application_requirements_title_not_blank check (length(btrim(title)) > 0);

-- Keep completed_at consistent with is_complete regardless of which client writes.
create or replace function public.sync_requirement_completion() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.is_complete and (tg_op = 'INSERT' or not old.is_complete) then
    new.completed_at := coalesce(new.completed_at, now());
  elsif not new.is_complete then
    new.completed_at := null;
  end if;
  return new;
end
$$;

create trigger sync_requirement_completion
  before insert or update on public.application_requirements
  for each row execute function public.sync_requirement_completion();

create index application_requirements_family_due_idx
  on public.application_requirements (family_id, due_date) where not is_complete;
create index applications_student_idx on public.applications (student_id, status);
