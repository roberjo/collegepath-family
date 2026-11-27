-- Role-aware RLS: family isolation, parent vs student rights, member lifecycle.
begin;

do $$
declare
  parent uuid := tests.create_user('parent@example.test');
  kid uuid := tests.create_user('kid@example.test');
  outsider uuid := tests.create_user('outsider@example.test');
  fam uuid;
  other_fam uuid;
  stu_a uuid;
  stu_b uuid;
  col uuid;
  app_a uuid;
  app_b uuid;
  sch uuid;
  kid_member uuid;
begin
  -- Parent creates a family through the RPC.
  perform tests.as_user(parent);
  fam := public.create_family('The Family', 'Parent One', 'America/Chicago');
  perform tests.assert((select role = 'parent' and email = 'parent@example.test'
                        from public.family_members where family_id = fam and user_id = parent),
    'creator becomes parent with cached email');
  perform tests.assert((select time_zone from public.families where id = fam) = 'America/Chicago',
    'time zone stored');

  insert into public.students (family_id, display_name, graduation_year) values (fam, 'Student A', 2028) returning id into stu_a;
  insert into public.students (family_id, display_name, graduation_year) values (fam, 'Student B', 2030) returning id into stu_b;
  insert into public.colleges (family_id, name) values (fam, 'Shared College') returning id into col;
  insert into public.applications (family_id, student_id, college_id) values (fam, stu_a, col) returning id into app_a;
  insert into public.applications (family_id, student_id, college_id) values (fam, stu_b, col) returning id into app_b;
  insert into public.scholarships (family_id, name) values (fam, 'Shared Scholarship') returning id into sch;
  insert into public.awards (family_id, student_id, award_name, amount) values (fam, stu_b, 'B award', 500);
  insert into public.tasks (family_id, title) values (fam, 'Family task');
  insert into public.tasks (family_id, student_id, title) values (fam, stu_b, 'Task for B');

  -- Outsider has their own family and must see nothing of ours.
  perform tests.as_user(outsider);
  other_fam := public.create_family('Other', 'Outsider');
  perform tests.assert(tests.visible(format('select 1 from public.families where id = %L', fam)) = 0, 'outsider cannot read family');
  perform tests.assert(tests.visible(format('select 1 from public.students where id = %L', stu_a)) = 0, 'outsider cannot read student by UUID');
  perform tests.assert(tests.visible('select 1 from public.colleges') = 0, 'outsider sees no colleges');
  perform tests.assert(tests.visible('select 1 from public.family_members where family_id <> ' || quote_literal(other_fam)) = 0, 'outsider sees no other memberships');
  perform tests.assert_fails(format('insert into public.students (family_id, display_name, graduation_year) values (%L, %L, 2028)', fam, 'Intruder'),
    'outsider cannot add a student');
  perform tests.assert_fails(format('insert into public.colleges (family_id, name) values (%L, %L)', fam, 'Intruder'),
    'outsider cannot add a college');
  update public.students set notes = 'hacked' where id = stu_a;
  perform tests.as_superuser();
  perform tests.assert((select notes is null from public.students where id = stu_a), 'outsider update is a no-op');

  -- Outsider cannot invite themselves or move data into our family.
  perform tests.as_user(outsider);
  perform tests.assert_fails(format('select public.create_invitation(%L, %L, %L)', fam, 'outsider@example.test', 'parent'),
    'non-parent cannot create invitation');

  -- Anonymous users see nothing.
  perform tests.as_anon();
  perform tests.assert_fails('select count(*) from public.families', 'anon has no table access');

  -- Link a student account directly (invitation flow is tested separately).
  perform tests.as_superuser();
  insert into public.family_members (family_id, user_id, role, display_name, email, student_id)
    values (fam, kid, 'student', 'Kid', 'kid@example.test', stu_a) returning id into kid_member;

  perform tests.as_user(kid);
  perform tests.assert(tests.visible('select 1 from public.students') = 1, 'student sees only own profile');
  perform tests.assert(tests.visible(format('select 1 from public.students where id = %L', stu_b)) = 0, 'student cannot read sibling');
  perform tests.assert(tests.visible('select 1 from public.colleges') = 1, 'student sees shared colleges');
  perform tests.assert(tests.visible('select 1 from public.scholarships') = 1, 'student sees shared scholarships');
  perform tests.assert(tests.visible('select 1 from public.applications') = 1, 'student sees only own applications');
  perform tests.assert(tests.visible('select 1 from public.awards') = 0, 'student cannot see sibling awards');
  perform tests.assert(tests.visible('select 1 from public.tasks') = 1, 'student sees family task but not sibling task');
  perform tests.assert(tests.visible('select 1 from public.family_members') = 2, 'student sees member list');

  update public.students set intended_major = 'Biology' where id = stu_a;
  perform tests.assert((select intended_major from public.students where id = stu_a) = 'Biology', 'student edits own profile');
  perform tests.assert_fails(format('insert into public.students (family_id, display_name, graduation_year) values (%L, %L, 2029)', fam, 'New'),
    'student cannot add students');
  perform tests.assert_fails(format('insert into public.applications (family_id, student_id, college_id) values (%L, %L, %L)', fam, stu_b, col),
    'student cannot create sibling application');
  insert into public.colleges (family_id, name) values (fam, 'Student added college');
  perform tests.assert_fails(format('insert into public.awards (family_id, student_id, award_name, amount) values (%L, %L, %L, 1)', fam, stu_a, 'Self award'),
    'student cannot record awards');
  insert into public.application_requirements (family_id, application_id, title) values (fam, app_a, 'Essay');
  perform tests.assert_fails(format('insert into public.application_requirements (family_id, application_id, title) values (%L, %L, %L)', fam, app_b, 'Essay'),
    'student cannot add requirement to sibling application');
  perform tests.assert_fails(format('insert into public.tasks (family_id, student_id, title) values (%L, %L, %L)', fam, stu_b, 'For sibling'),
    'student cannot create task for sibling');
  insert into public.tasks (family_id, student_id, title, assigned_to) values (fam, stu_a, 'My task', parent);
  perform tests.assert_fails(format('insert into public.tasks (family_id, title, assigned_to) values (%L, %L, %L)', fam, 'Assign outsider', outsider),
    'tasks cannot be assigned outside the family');

  delete from public.applications where id = app_a;
  perform tests.as_superuser();
  perform tests.assert(exists (select 1 from public.applications where id = app_a), 'student cannot delete applications');

  -- Students cannot manage membership.
  perform tests.as_user(kid);
  update public.family_members set role = 'parent' where id = kid_member;
  perform tests.as_superuser();
  perform tests.assert((select role from public.family_members where id = kid_member) = 'student', 'student cannot promote self');

  -- Last-parent guard.
  perform tests.as_user(parent);
  perform tests.assert_fails(format('update public.family_members set status = %L where user_id = %L and family_id = %L', 'removed', parent, fam),
    'last parent cannot be removed');
  perform tests.assert_fails(format('update public.family_members set user_id = %L where id = %L', outsider, kid_member),
    'membership cannot be reassigned to another user');

  -- Removing a member revokes access immediately.
  update public.family_members set status = 'removed' where id = kid_member;
  perform tests.as_user(kid);
  perform tests.assert(tests.visible('select 1 from public.colleges') = 0, 'removed member loses access');
  perform tests.assert(tests.visible('select 1 from public.students') = 0, 'removed member loses student access');
end
$$;

rollback;
