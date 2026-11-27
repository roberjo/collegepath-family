-- Schema-level behaviour: constraints, cascades, and triggers.
begin;

do $$
declare
  fam uuid;
  other_fam uuid;
  stu uuid;
  other_stu uuid;
  col uuid;
  app uuid;
  sch uuid;
  sapp uuid;
  task uuid;
  award uuid;
  before_ts timestamptz;
begin
  insert into public.families (name) values ('Test family') returning id into fam;
  insert into public.families (name) values ('Other family') returning id into other_fam;
  insert into public.students (family_id, display_name, graduation_year) values (fam, 'Student A', 2028) returning id into stu;
  insert into public.students (family_id, display_name, graduation_year) values (other_fam, 'Student X', 2028) returning id into other_stu;
  insert into public.colleges (family_id, name) values (fam, 'Example College') returning id into col;
  insert into public.applications (family_id, student_id, college_id) values (fam, stu, col) returning id into app;
  insert into public.scholarships (family_id, name) values (fam, 'Example Scholarship') returning id into sch;
  insert into public.scholarship_applications (family_id, scholarship_id, student_id) values (fam, sch, stu) returning id into sapp;

  -- Cross-family references are rejected by the composite FKs.
  perform tests.assert_fails(
    format('insert into public.applications (family_id, student_id, college_id) values (%L, %L, %L)', fam, other_stu, col),
    'application cannot reference a student from another family'
  );

  -- Deleting referenced rows nulls only the reference, not family_id.
  insert into public.tasks (family_id, student_id, title, related_application_id, related_scholarship_application_id)
    values (fam, stu, 'Task', app, sapp) returning id into task;
  insert into public.awards (family_id, student_id, college_id, scholarship_application_id, award_name, amount)
    values (fam, stu, col, sapp, 'Award', 1000) returning id into award;

  delete from public.applications where id = app;
  perform tests.assert((select related_application_id is null and family_id = fam from public.tasks where id = task),
    'deleting an application clears the task link only');
  delete from public.scholarship_applications where id = sapp;
  perform tests.assert((select related_scholarship_application_id is null from public.tasks where id = task),
    'deleting a scholarship application clears the task link');
  perform tests.assert((select scholarship_application_id is null from public.awards where id = award),
    'deleting a scholarship application clears the award link');
  delete from public.colleges where id = col;
  perform tests.assert((select college_id is null from public.awards where id = award),
    'deleting a college clears the award link');

  -- Student deletion: tasks keep existing (family-wide), awards cascade.
  delete from public.students where id = stu;
  perform tests.assert((select student_id is null and family_id = fam from public.tasks where id = task),
    'deleting a student keeps the task as a family task');
  perform tests.assert(not exists (select 1 from public.awards where id = award), 'student awards cascade');

  -- updated_at trigger
  select updated_at into before_ts from public.families where id = fam;
  perform pg_sleep(0.01);
  -- now() is fixed within a transaction, so compare against clock time via a forced value.
  update public.families set updated_at = '2000-01-01', name = 'Renamed' where id = fam;
  perform tests.assert((select updated_at > '2000-01-02' from public.families where id = fam),
    'updated_at is maintained by trigger');

  -- Check constraints
  perform tests.assert_fails(
    format('insert into public.colleges (family_id, name, estimated_annual_cost) values (%L, %L, -1)', fam, 'Bad'),
    'negative cost rejected'
  );
  perform tests.assert_fails(
    format('insert into public.students (family_id, display_name, graduation_year) values (%L, %L, 2028)', fam, '   '),
    'blank student name rejected'
  );
  perform tests.assert_fails(
    format('update public.families set time_zone = %L where id = %L', 'not a zone; drop', fam),
    'malformed time zone rejected'
  );
end
$$;

rollback;
