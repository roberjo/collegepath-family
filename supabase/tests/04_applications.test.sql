-- Application tracking behaviour.
begin;

do $$
declare
  parent uuid := tests.create_user('parent@example.test');
  fam uuid;
  stu uuid;
  col uuid;
  app uuid;
  req uuid;
begin
  perform tests.as_user(parent);
  fam := public.create_family('Apps', 'Parent');
  insert into public.students (family_id, display_name, graduation_year) values (fam, 'S', 2028) returning id into stu;
  insert into public.colleges (family_id, name) values (fam, 'C') returning id into col;
  insert into public.applications (family_id, student_id, college_id, application_type, submitted_on)
    values (fam, stu, col, 'early_action', '2026-11-01') returning id into app;
  perform tests.assert((select submitted_on = date '2026-11-01' from public.applications where id = app),
    'submitted_on is a date');

  -- Same student/college/type is a duplicate; a different type is allowed.
  perform tests.assert_fails(
    format('insert into public.applications (family_id, student_id, college_id, application_type) values (%L, %L, %L, %L)', fam, stu, col, 'early_action'),
    'duplicate application rejected');
  insert into public.applications (family_id, student_id, college_id, application_type) values (fam, stu, col, 'undergraduate');

  perform tests.assert_fails(
    format('update public.applications set portal_url = %L where id = %L', 'javascript:alert(1)', app),
    'portal url must be http(s)');

  insert into public.application_requirements (family_id, application_id, title) values (fam, app, 'Essay') returning id into req;
  perform tests.assert((select completed_at is null from public.application_requirements where id = req), 'incomplete has no timestamp');
  update public.application_requirements set is_complete = true where id = req;
  perform tests.assert((select completed_at is not null from public.application_requirements where id = req), 'completion stamped');
  update public.application_requirements set is_complete = false where id = req;
  perform tests.assert((select completed_at is null from public.application_requirements where id = req), 'reopening clears stamp');

  -- Deleting an application removes its requirements.
  delete from public.applications where id = app;
  perform tests.assert(not exists (select 1 from public.application_requirements where id = req), 'requirements cascade');
end
$$;

rollback;
