-- Scholarships, tasks, and awards integrity.
begin;

do $$
declare
  parent uuid := tests.create_user('parent@example.test');
  kid uuid := tests.create_user('kid@example.test');
  fam uuid;
  stu_a uuid;
  stu_b uuid;
  col uuid;
  app_b uuid;
  sch uuid;
  sa_a uuid;
  sa_b uuid;
  task uuid;
begin
  perform tests.as_user(parent);
  fam := public.create_family('Phase4', 'Parent');
  insert into public.students (family_id, display_name, graduation_year) values (fam, 'A', 2028) returning id into stu_a;
  insert into public.students (family_id, display_name, graduation_year) values (fam, 'B', 2030) returning id into stu_b;
  insert into public.colleges (family_id, name) values (fam, 'C') returning id into col;
  insert into public.applications (family_id, student_id, college_id) values (fam, stu_b, col) returning id into app_b;
  insert into public.scholarships (family_id, name, award_amount, deadline) values (fam, 'Shared', 1000, '2027-01-15') returning id into sch;
  insert into public.scholarship_applications (family_id, scholarship_id, student_id) values (fam, sch, stu_a) returning id into sa_a;
  insert into public.scholarship_applications (family_id, scholarship_id, student_id) values (fam, sch, stu_b) returning id into sa_b;

  perform tests.assert_fails(
    format('insert into public.scholarship_applications (family_id, scholarship_id, student_id) values (%L, %L, %L)', fam, sch, stu_a),
    'one scholarship application per student and scholarship');
  perform tests.assert_fails(
    format('insert into public.scholarships (family_id, name, opens_on, deadline) values (%L, %L, %L, %L)', fam, 'Bad', '2027-02-01', '2027-01-01'),
    'opening date after deadline rejected');

  -- Awards must link to the same student's scholarship application.
  perform tests.assert_fails(
    format('insert into public.awards (family_id, student_id, scholarship_application_id, award_name, amount) values (%L, %L, %L, %L, 500)', fam, stu_a, sa_b, 'Wrong'),
    'award cannot link to sibling scholarship application');
  insert into public.awards (family_id, student_id, scholarship_application_id, award_name, amount, academic_year)
    values (fam, stu_a, sa_a, 'Right', 500, '2028-29');
  perform tests.assert_fails(
    format('insert into public.awards (family_id, student_id, award_name, amount, academic_year) values (%L, %L, %L, 1, %L)', fam, stu_a, 'Year', '2028'),
    'academic year must look like 2028-29');

  -- Task links must match the task's student; family-wide tasks may link anything accessible.
  perform tests.assert_fails(
    format('insert into public.tasks (family_id, student_id, title, related_application_id) values (%L, %L, %L, %L)', fam, stu_a, 'Mismatch', app_b),
    'task cannot link to another student''s application');
  insert into public.tasks (family_id, title, related_application_id) values (fam, 'Family task', app_b) returning id into task;
  update public.tasks set status = 'done' where id = task;
  perform tests.assert((select completed_at is not null from public.tasks where id = task), 'task completion stamped');
  update public.tasks set status = 'todo' where id = task;
  perform tests.assert((select completed_at is null from public.tasks where id = task), 'reopened task clears stamp');

  -- Student view: shared scholarship visible, sibling's scholarship application is not.
  perform tests.as_superuser();
  insert into public.family_members (family_id, user_id, role, display_name, email, student_id)
    values (fam, kid, 'student', 'Kid', 'kid@example.test', stu_a);
  perform tests.as_user(kid);
  perform tests.assert(tests.visible('select 1 from public.scholarships') = 1, 'student sees shared scholarship');
  perform tests.assert(tests.visible('select 1 from public.scholarship_applications') = 1, 'student sees only own scholarship application');
  perform tests.assert(tests.visible('select 1 from public.awards') = 1, 'student sees own award');
  update public.scholarship_applications set status = 'submitted', submitted_on = '2027-01-10' where id = sa_a;
  perform tests.assert((select status from public.scholarship_applications where id = sa_a) = 'submitted', 'student updates own status');
  perform tests.assert_fails(
    format('insert into public.scholarship_applications (family_id, scholarship_id, student_id) values (%L, %L, %L)', fam, sch, stu_b),
    'student cannot track a scholarship for a sibling');
  delete from public.scholarships where id = sch;
  perform tests.as_superuser();
  perform tests.assert(exists (select 1 from public.scholarships where id = sch), 'student cannot delete scholarships');
end
$$;

rollback;
