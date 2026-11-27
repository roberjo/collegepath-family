-- Phase 1: role-aware access, member lifecycle, family creation, and invitations.
-- Permission model: docs/adr/0004-role-based-permissions.md
-- Invitation design: docs/adr/0005-family-invitations.md

-- ---------------------------------------------------------------------------
-- Members: status, linked student profile, cached email for display
-- ---------------------------------------------------------------------------
create type public.member_status as enum ('active', 'removed');

alter table public.family_members
  add column status public.member_status not null default 'active',
  add column student_id uuid,
  add column email text,
  add constraint family_members_student_role check (student_id is null or role = 'student'),
  add constraint family_members_display_name_not_blank check (length(btrim(display_name)) > 0),
  add constraint family_members_student_fk foreign key (student_id, family_id)
    references public.students (id, family_id) on delete set null (student_id);

create unique index family_members_one_account_per_student
  on public.family_members (family_id, student_id)
  where student_id is not null and status = 'active';

alter table public.tasks
  add column created_by uuid default auth.uid() references auth.users (id) on delete set null;

-- ---------------------------------------------------------------------------
-- Authorization helpers. SECURITY DEFINER so policies can consult
-- family_members without recursing through its own RLS policies.
-- ---------------------------------------------------------------------------
create or replace function public.is_family_member(target_family_id uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.family_members fm
    where fm.family_id = target_family_id
      and fm.user_id = (select auth.uid())
      and fm.status = 'active'
  )
$$;

create or replace function public.is_family_parent(target_family_id uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.family_members fm
    where fm.family_id = target_family_id
      and fm.user_id = (select auth.uid())
      and fm.status = 'active'
      and fm.role = 'parent'
  )
$$;

-- The student profile linked to the caller's account in this family (null for parents).
create or replace function public.my_student_id(target_family_id uuid) returns uuid
language sql stable security definer set search_path = ''
as $$
  select fm.student_id from public.family_members fm
  where fm.family_id = target_family_id
    and fm.user_id = (select auth.uid())
    and fm.status = 'active'
    and fm.role = 'student'
$$;

-- Parents can access every student in their family; a student only their own profile.
create or replace function public.can_access_student(target_family_id uuid, target_student_id uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select public.is_family_parent(target_family_id)
    or (target_student_id is not null and target_student_id = public.my_student_id(target_family_id))
$$;

create or replace function public.can_access_application(target_family_id uuid, target_application_id uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.applications a
    where a.id = target_application_id
      and a.family_id = target_family_id
      and public.can_access_student(a.family_id, a.student_id)
  )
$$;

create or replace function public.can_access_scholarship_application(target_family_id uuid, target_id uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.scholarship_applications sa
    where sa.id = target_id
      and sa.family_id = target_family_id
      and public.can_access_student(sa.family_id, sa.student_id)
  )
$$;

create or replace function public.is_active_member_user(target_family_id uuid, target_user_id uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.family_members fm
    where fm.family_id = target_family_id
      and fm.user_id = target_user_id
      and fm.status = 'active'
  )
$$;

-- Tasks: parents see all; students see family-wide tasks, their own student's
-- tasks, and anything assigned to or created by them.
create or replace function public.can_see_task(
  target_family_id uuid, target_student_id uuid, target_assigned_to uuid, target_created_by uuid
) returns boolean
language sql stable security definer set search_path = ''
as $$
  select public.is_family_parent(target_family_id)
    or (
      public.is_family_member(target_family_id)
      and (
        target_student_id is null
        or target_student_id = public.my_student_id(target_family_id)
        or target_assigned_to = (select auth.uid())
        or target_created_by = (select auth.uid())
      )
    )
$$;

do $$
declare
  f text;
begin
  foreach f in array array[
    'is_family_member(uuid)', 'is_family_parent(uuid)', 'my_student_id(uuid)',
    'can_access_student(uuid, uuid)', 'can_access_application(uuid, uuid)',
    'can_access_scholarship_application(uuid, uuid)', 'is_active_member_user(uuid, uuid)',
    'can_see_task(uuid, uuid, uuid, uuid)'
  ] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end
$$;

-- ---------------------------------------------------------------------------
-- Guard: membership rows cannot be moved between users/families, and a family
-- always keeps at least one active parent.
-- ---------------------------------------------------------------------------
create or replace function public.guard_family_member_update() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.family_id <> old.family_id or new.user_id <> old.user_id then
    raise exception 'A membership cannot be moved to another family or user';
  end if;
  if new.email is distinct from old.email and (select auth.uid()) is not null then
    raise exception 'Member email is managed by the system';
  end if;
  if new.role <> 'student' then
    new.student_id := null;
  end if;
  if old.role = 'parent' and old.status = 'active'
     and (new.role <> 'parent' or new.status <> 'active')
     and not exists (
       select 1 from public.family_members fm
       where fm.family_id = old.family_id and fm.id <> old.id
         and fm.role = 'parent' and fm.status = 'active'
     ) then
    raise exception 'A family must keep at least one active parent';
  end if;
  return new;
end
$$;

create trigger guard_family_member_update
  before update on public.family_members
  for each row execute function public.guard_family_member_update();

-- ---------------------------------------------------------------------------
-- Invitations
-- ---------------------------------------------------------------------------
create table public.family_invitations (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  email text not null check (email = lower(btrim(email)) and email like '%_@_%'),
  role public.family_role not null,
  student_id uuid,
  display_name text,
  token_hash text not null unique,
  invited_by uuid references auth.users (id) on delete set null,
  expires_at timestamptz not null default now() + interval '14 days',
  accepted_at timestamptz,
  accepted_by uuid references auth.users (id) on delete set null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check (student_id is null or role = 'student'),
  foreign key (student_id, family_id) references public.students (id, family_id) on delete set null (student_id)
);

create index family_invitations_family_idx on public.family_invitations (family_id, created_at desc);

alter table public.family_invitations enable row level security;

create policy "Parents read invitations" on public.family_invitations
  for select to authenticated using (public.is_family_parent(family_id));
create policy "Parents revoke invitations" on public.family_invitations
  for update to authenticated
  using (public.is_family_parent(family_id))
  with check (public.is_family_parent(family_id));
create policy "Parents delete invitations" on public.family_invitations
  for delete to authenticated using (public.is_family_parent(family_id));
-- Inserts go through create_invitation() so the raw token never touches the table.

revoke all on public.family_invitations from anon;

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------
create or replace function public.hash_invitation_token(p_token text) returns text
language sql immutable set search_path = ''
as $$
  select encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
$$;

create or replace function public.current_user_email() returns text
language sql stable security definer set search_path = ''
as $$
  select lower(u.email) from auth.users u where u.id = (select auth.uid())
$$;

create or replace function public.create_family(
  p_name text,
  p_display_name text,
  p_time_zone text default 'America/New_York'
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_family uuid;
begin
  if v_user is null then
    raise exception 'Not signed in' using errcode = '28000';
  end if;
  insert into public.families (name, time_zone)
    values (btrim(p_name), coalesce(nullif(btrim(p_time_zone), ''), 'America/New_York'))
    returning id into v_family;
  insert into public.family_members (family_id, user_id, role, display_name, email)
    values (v_family, v_user, 'parent', btrim(p_display_name), public.current_user_email());
  return v_family;
end
$$;

-- Returns the raw token exactly once; only its SHA-256 hash is stored.
create or replace function public.create_invitation(
  p_family_id uuid,
  p_email text,
  p_role public.family_role,
  p_student_id uuid default null,
  p_display_name text default null
) returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_email text := lower(btrim(p_email));
  v_token text;
begin
  if not public.is_family_parent(p_family_id) then
    raise exception 'Only a parent can invite family members' using errcode = '42501';
  end if;
  if p_role <> 'student' and p_student_id is not null then
    raise exception 'Only student invitations can be linked to a student profile';
  end if;
  if exists (
    select 1 from public.family_members fm
    where fm.family_id = p_family_id and fm.status = 'active' and lower(fm.email) = v_email
  ) then
    raise exception 'That person is already a member of this family';
  end if;

  -- Any earlier pending invitation for the same address is superseded.
  update public.family_invitations
     set revoked_at = now()
   where family_id = p_family_id and email = v_email
     and accepted_at is null and revoked_at is null;

  v_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');

  insert into public.family_invitations (family_id, email, role, student_id, display_name, token_hash, invited_by)
    values (p_family_id, v_email, p_role, p_student_id, nullif(btrim(p_display_name), ''),
            public.hash_invitation_token(v_token), (select auth.uid()));
  return v_token;
end
$$;

-- Public preview of an invitation for the landing page. Reveals only the
-- family name, invited email, and role to someone who holds the token.
create or replace function public.get_invitation(p_token text)
returns table (family_name text, email text, role public.family_role, display_name text, status text)
language sql stable security definer set search_path = ''
as $$
  select f.name, i.email, i.role, i.display_name,
    case
      when i.revoked_at is not null then 'revoked'
      when i.accepted_at is not null then 'accepted'
      when i.expires_at < now() then 'expired'
      else 'pending'
    end
  from public.family_invitations i
  join public.families f on f.id = i.family_id
  where i.token_hash = public.hash_invitation_token(p_token)
$$;

create or replace function public.accept_invitation(p_token text, p_display_name text) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_email text := public.current_user_email();
  v_invite public.family_invitations;
begin
  if v_user is null then
    raise exception 'Not signed in' using errcode = '28000';
  end if;

  select * into v_invite from public.family_invitations
   where token_hash = public.hash_invitation_token(p_token)
   for update;

  if not found or v_invite.revoked_at is not null then
    raise exception 'This invitation is not valid';
  elsif v_invite.accepted_at is not null then
    raise exception 'This invitation has already been used';
  elsif v_invite.expires_at < now() then
    raise exception 'This invitation has expired';
  elsif v_email is distinct from v_invite.email then
    raise exception 'This invitation was sent to a different email address';
  end if;

  if v_invite.student_id is not null and exists (
    select 1 from public.family_members fm
    where fm.family_id = v_invite.family_id and fm.student_id = v_invite.student_id
      and fm.status = 'active' and fm.user_id <> v_user
  ) then
    raise exception 'That student profile is already linked to another account';
  end if;

  insert into public.family_members (family_id, user_id, role, display_name, email, student_id, status)
    values (v_invite.family_id, v_user, v_invite.role,
            coalesce(nullif(btrim(p_display_name), ''), v_invite.display_name, split_part(v_email, '@', 1)),
            v_email, v_invite.student_id, 'active')
  on conflict (family_id, user_id) do update
    set role = excluded.role,
        display_name = excluded.display_name,
        student_id = excluded.student_id,
        status = 'active';

  update public.family_invitations
     set accepted_at = now(), accepted_by = v_user
   where id = v_invite.id;

  return v_invite.family_id;
end
$$;

revoke all on function public.create_family(text, text, text) from public, anon;
revoke all on function public.create_invitation(uuid, text, public.family_role, uuid, text) from public, anon;
revoke all on function public.accept_invitation(text, text) from public, anon;
revoke all on function public.current_user_email() from public, anon;
revoke all on function public.get_invitation(text) from public;
grant execute on function public.create_family(text, text, text) to authenticated;
grant execute on function public.create_invitation(uuid, text, public.family_role, uuid, text) to authenticated;
grant execute on function public.accept_invitation(text, text) to authenticated;
grant execute on function public.current_user_email() to authenticated;
grant execute on function public.get_invitation(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Replace the membership-only policies from 0001 with role-aware policies.
-- ---------------------------------------------------------------------------
drop policy "Members can read their families" on public.families;
drop policy "Members can read family membership" on public.family_members;
drop policy "Family members manage students" on public.students;
drop policy "Family members manage colleges" on public.colleges;
drop policy "Family members manage college interests" on public.college_interests;
drop policy "Family members manage applications" on public.applications;
drop policy "Family members manage application requirements" on public.application_requirements;
drop policy "Family members manage scholarships" on public.scholarships;
drop policy "Family members manage scholarship applications" on public.scholarship_applications;
drop policy "Family members manage tasks" on public.tasks;
drop policy "Family members manage awards" on public.awards;

-- families
create policy "Members read their family" on public.families
  for select to authenticated using (public.is_family_member(id));
create policy "Parents update their family" on public.families
  for update to authenticated using (public.is_family_parent(id)) with check (public.is_family_parent(id));

-- family_members (inserts happen through create_family / accept_invitation)
create policy "Members read family membership" on public.family_members
  for select to authenticated using (public.is_family_member(family_id));
create policy "Parents manage membership" on public.family_members
  for update to authenticated
  using (public.is_family_parent(family_id))
  with check (public.is_family_parent(family_id));

-- students
create policy "Read accessible students" on public.students
  for select to authenticated using (public.can_access_student(family_id, id));
create policy "Parents add students" on public.students
  for insert to authenticated with check (public.is_family_parent(family_id));
create policy "Update accessible students" on public.students
  for update to authenticated
  using (public.can_access_student(family_id, id))
  with check (public.can_access_student(family_id, id));
create policy "Parents delete students" on public.students
  for delete to authenticated using (public.is_family_parent(family_id));

-- Shared family directories: colleges and scholarships
create policy "Members read colleges" on public.colleges
  for select to authenticated using (public.is_family_member(family_id));
create policy "Members add colleges" on public.colleges
  for insert to authenticated with check (public.is_family_member(family_id));
create policy "Members update colleges" on public.colleges
  for update to authenticated
  using (public.is_family_member(family_id)) with check (public.is_family_member(family_id));
create policy "Parents delete colleges" on public.colleges
  for delete to authenticated using (public.is_family_parent(family_id));

create policy "Members read scholarships" on public.scholarships
  for select to authenticated using (public.is_family_member(family_id));
create policy "Members add scholarships" on public.scholarships
  for insert to authenticated with check (public.is_family_member(family_id));
create policy "Members update scholarships" on public.scholarships
  for update to authenticated
  using (public.is_family_member(family_id)) with check (public.is_family_member(family_id));
create policy "Parents delete scholarships" on public.scholarships
  for delete to authenticated using (public.is_family_parent(family_id));

-- Student-scoped records
create policy "Access own student's college interests" on public.college_interests
  for all to authenticated
  using (public.can_access_student(family_id, student_id))
  with check (public.can_access_student(family_id, student_id));

create policy "Read accessible applications" on public.applications
  for select to authenticated using (public.can_access_student(family_id, student_id));
create policy "Add accessible applications" on public.applications
  for insert to authenticated with check (public.can_access_student(family_id, student_id));
create policy "Update accessible applications" on public.applications
  for update to authenticated
  using (public.can_access_student(family_id, student_id))
  with check (public.can_access_student(family_id, student_id));
create policy "Parents delete applications" on public.applications
  for delete to authenticated using (public.is_family_parent(family_id));

create policy "Access requirements of accessible applications" on public.application_requirements
  for all to authenticated
  using (public.can_access_application(family_id, application_id))
  with check (public.can_access_application(family_id, application_id));

create policy "Read accessible scholarship applications" on public.scholarship_applications
  for select to authenticated using (public.can_access_student(family_id, student_id));
create policy "Add accessible scholarship applications" on public.scholarship_applications
  for insert to authenticated with check (public.can_access_student(family_id, student_id));
create policy "Update accessible scholarship applications" on public.scholarship_applications
  for update to authenticated
  using (public.can_access_student(family_id, student_id))
  with check (public.can_access_student(family_id, student_id));
create policy "Parents delete scholarship applications" on public.scholarship_applications
  for delete to authenticated using (public.is_family_parent(family_id));

-- Awards: visible to the student they belong to; recorded by parents only.
create policy "Read accessible awards" on public.awards
  for select to authenticated using (public.can_access_student(family_id, student_id));
create policy "Parents add awards" on public.awards
  for insert to authenticated with check (public.is_family_parent(family_id));
create policy "Parents update awards" on public.awards
  for update to authenticated
  using (public.is_family_parent(family_id)) with check (public.is_family_parent(family_id));
create policy "Parents delete awards" on public.awards
  for delete to authenticated using (public.is_family_parent(family_id));

-- Tasks
create policy "Read visible tasks" on public.tasks
  for select to authenticated
  using (public.can_see_task(family_id, student_id, assigned_to, created_by));
create policy "Add tasks" on public.tasks
  for insert to authenticated
  with check (
    public.is_family_member(family_id)
    and created_by = (select auth.uid())
    and (public.is_family_parent(family_id) or student_id is null or student_id = public.my_student_id(family_id))
    and (assigned_to is null or public.is_active_member_user(family_id, assigned_to))
    and (related_application_id is null or public.can_access_application(family_id, related_application_id))
    and (related_scholarship_application_id is null
         or public.can_access_scholarship_application(family_id, related_scholarship_application_id))
  );
create policy "Update visible tasks" on public.tasks
  for update to authenticated
  using (public.can_see_task(family_id, student_id, assigned_to, created_by))
  with check (
    public.is_family_member(family_id)
    and (public.is_family_parent(family_id) or student_id is null or student_id = public.my_student_id(family_id))
    and (assigned_to is null or public.is_active_member_user(family_id, assigned_to))
    and (related_application_id is null or public.can_access_application(family_id, related_application_id))
    and (related_scholarship_application_id is null
         or public.can_access_scholarship_application(family_id, related_scholarship_application_id))
  );
create policy "Delete own or any task as parent" on public.tasks
  for delete to authenticated
  using (public.is_family_parent(family_id) or created_by = (select auth.uid()));

create index tasks_assigned_idx on public.tasks (assigned_to) where assigned_to is not null;
create index family_members_family_idx on public.family_members (family_id, status);
