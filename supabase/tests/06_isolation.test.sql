-- Cross-family isolation for EVERY family-owned table: a member of another
-- family can neither read, update, nor delete rows, even by UUID.
begin;

do $$
declare
  owner_user uuid := tests.create_user('owner@example.test');
  other_user uuid := tests.create_user('other@example.test');
  fam uuid;
  stu uuid;
  col uuid;
  app uuid;
  sch uuid;
  sa uuid;
  t text;
  n bigint;
begin
  perform tests.as_user(owner_user);
  fam := public.create_family('Owner family', 'Owner');
  insert into public.students (family_id, display_name, graduation_year) values (fam, 'S', 2028) returning id into stu;
  insert into public.colleges (family_id, name) values (fam, 'C') returning id into col;
  insert into public.college_interests (family_id, student_id, college_id) values (fam, stu, col);
  insert into public.applications (family_id, student_id, college_id) values (fam, stu, col) returning id into app;
  insert into public.application_requirements (family_id, application_id, title) values (fam, app, 'Essay');
  insert into public.scholarships (family_id, name) values (fam, 'Sch') returning id into sch;
  insert into public.scholarship_applications (family_id, scholarship_id, student_id) values (fam, sch, stu) returning id into sa;
  insert into public.tasks (family_id, title, student_id) values (fam, 'T', stu);
  insert into public.awards (family_id, student_id, award_name, amount) values (fam, stu, 'A', 1);
  perform public.create_invitation(fam, 'someone@example.test', 'student');

  perform tests.as_user(other_user);
  perform public.create_family('Other family', 'Other');

  foreach t in array array[
    'students', 'colleges', 'college_interests', 'applications', 'application_requirements',
    'scholarships', 'scholarship_applications', 'tasks', 'awards', 'family_invitations', 'family_members'
  ] loop
    execute format('select count(*) from public.%I where family_id = %L', t, fam) into n;
    perform tests.assert(n = 0, format('outsider cannot read %s', t));
    execute format('with u as (update public.%I set family_id = family_id where family_id = %L returning 1) select count(*) from u', t, fam) into n;
    perform tests.assert(n = 0, format('outsider cannot update %s', t));
    execute format('with d as (delete from public.%I where family_id = %L returning 1) select count(*) from d', t, fam) into n;
    perform tests.assert(n = 0, format('outsider cannot delete %s', t));
  end loop;

  select count(*) into n from public.families where id = fam;
  perform tests.assert(n = 0, 'outsider cannot read the family');
  perform tests.assert(not public.is_family_member(fam), 'outsider is not a member');

  -- Owner's data is intact.
  perform tests.as_user(owner_user);
  foreach t in array array[
    'students', 'colleges', 'college_interests', 'applications', 'application_requirements',
    'scholarships', 'scholarship_applications', 'tasks', 'awards', 'family_invitations'
  ] loop
    execute format('select count(*) from public.%I where family_id = %L', t, fam) into n;
    perform tests.assert(n = 1, format('owner still has their %s row', t));
  end loop;
end
$$;

rollback;
