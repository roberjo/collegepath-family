-- Phase 4: scholarship, task, and award integrity.

alter table public.scholarships
  add constraint scholarships_dates_ordered check (opens_on is null or deadline is null or opens_on <= deadline),
  add constraint scholarships_urls_http check (
    (application_url is null or application_url ~* '^https?://')
    and (source_url is null or source_url ~* '^https?://')
  );

alter table public.awards
  add constraint awards_name_not_blank check (length(btrim(award_name)) > 0),
  add constraint awards_academic_year_format check (academic_year is null or academic_year ~ '^\d{4}-\d{2}$');

alter table public.tasks add column completed_at timestamptz;

-- Linked records must belong to the same student, not merely the same family.
create or replace function public.check_award_links() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.scholarship_application_id is not null and not exists (
    select 1 from public.scholarship_applications sa
    where sa.id = new.scholarship_application_id and sa.student_id = new.student_id
  ) then
    raise exception 'That scholarship application belongs to a different student';
  end if;
  return new;
end
$$;

create trigger check_award_links
  before insert or update on public.awards
  for each row execute function public.check_award_links();

create or replace function public.check_task_links() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.student_id is not null and new.related_application_id is not null and not exists (
    select 1 from public.applications a
    where a.id = new.related_application_id and a.student_id = new.student_id
  ) then
    raise exception 'That application belongs to a different student';
  end if;
  if new.student_id is not null and new.related_scholarship_application_id is not null and not exists (
    select 1 from public.scholarship_applications sa
    where sa.id = new.related_scholarship_application_id and sa.student_id = new.student_id
  ) then
    raise exception 'That scholarship application belongs to a different student';
  end if;
  if new.status = 'done' and (tg_op = 'INSERT' or old.status <> 'done') then
    new.completed_at := coalesce(new.completed_at, now());
  elsif new.status <> 'done' then
    new.completed_at := null;
  end if;
  return new;
end
$$;

create trigger check_task_links
  before insert or update on public.tasks
  for each row execute function public.check_task_links();

create index scholarship_apps_family_idx on public.scholarship_applications (family_id, scholarship_id);
create index tasks_family_status_idx on public.tasks (family_id, status, due_date);
