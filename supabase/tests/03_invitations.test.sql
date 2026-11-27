-- Invitation lifecycle: create, preview, accept, misuse.
begin;

do $$
declare
  parent uuid := tests.create_user('parent@example.test');
  parent2 uuid := tests.create_user('Parent2@Example.test');
  kid uuid := tests.create_user('kid@example.test');
  stranger uuid := tests.create_user('stranger@example.test');
  fam uuid;
  stu uuid;
  token text;
  token2 text;
  kid_token text;
  fam_back uuid;
  inv record;
begin
  perform tests.as_user(parent);
  fam := public.create_family('Invite Family', 'Parent');
  insert into public.students (family_id, display_name, graduation_year) values (fam, 'Kid', 2028) returning id into stu;

  token := public.create_invitation(fam, '  PARENT2@example.test ', 'parent');
  perform tests.assert(length(token) = 64, 'token has 256 bits of entropy as hex');
  perform tests.assert(not exists (select 1 from public.family_invitations where token_hash = token),
    'raw token is never stored');
  perform tests.assert((select email from public.family_invitations where family_id = fam) = 'parent2@example.test',
    'email normalised');
  perform tests.assert_fails(format('select public.create_invitation(%L, %L, %L, %L)', fam, 'x@example.test', 'parent', stu),
    'only student invites link a student profile');
  perform tests.assert_fails(format('select public.create_invitation(%L, %L, %L)', fam, 'parent@example.test', 'parent'),
    'cannot invite an existing member');

  -- Re-inviting supersedes the earlier pending invite.
  token2 := public.create_invitation(fam, 'parent2@example.test', 'parent');
  perform tests.assert((select status from public.get_invitation(token)) = 'revoked', 'older invite revoked');

  -- Anonymous preview works with the token only.
  perform tests.as_anon();
  select * into inv from public.get_invitation(token2);
  perform tests.assert(inv.family_name = 'Invite Family' and inv.status = 'pending' and inv.role = 'parent', 'anon preview');
  perform tests.assert((select count(*) from public.get_invitation('nonsense')) = 0, 'unknown token reveals nothing');
  perform tests.assert_fails(format('select public.accept_invitation(%L, %L)', token2, 'x'), 'anon cannot accept');

  -- Wrong account cannot accept.
  perform tests.as_user(stranger);
  perform tests.assert_fails(format('select public.accept_invitation(%L, %L)', token2, 'Stranger'),
    'invite is bound to the invited email');
  perform tests.assert_fails(format('select public.accept_invitation(%L, %L)', token, 'Stranger'),
    'revoked invite cannot be accepted');

  -- Right account (email compared case-insensitively) accepts.
  perform tests.as_user(parent2);
  fam_back := public.accept_invitation(token2, 'Parent Two');
  perform tests.assert(fam_back = fam, 'accept returns family id');
  perform tests.assert(public.is_family_parent(fam), 'second parent has parent rights');
  perform tests.assert_fails(format('select public.accept_invitation(%L, %L)', token2, 'Again'), 'invite is single-use');

  -- Student invite linked to a profile.
  kid_token := public.create_invitation(fam, 'kid@example.test', 'student', stu, 'Kiddo');
  perform tests.as_user(kid);
  perform public.accept_invitation(kid_token, '');
  perform tests.assert((select student_id = stu and display_name = 'Kiddo' and role = 'student'
                        from public.family_members where user_id = kid), 'student linked with invite display name');
  perform tests.assert(public.my_student_id(fam) = stu, 'student resolves own profile');
  perform tests.assert_fails(format('select public.create_invitation(%L, %L, %L)', fam, 'x@example.test', 'parent'),
    'students cannot invite');
  perform tests.assert(tests.visible('select 1 from public.family_invitations') = 0, 'students cannot read invitations');

  -- Expired invitations are rejected.
  perform tests.as_user(parent);
  token := public.create_invitation(fam, 'stranger@example.test', 'parent');
  perform tests.as_superuser();
  update public.family_invitations set expires_at = now() - interval '1 minute' where email = 'stranger@example.test' and revoked_at is null;
  perform tests.as_user(stranger);
  perform tests.assert((select status from public.get_invitation(token)) = 'expired', 'expired status');
  perform tests.assert_fails(format('select public.accept_invitation(%L, %L)', token, 'S'), 'expired invite rejected');

  -- Direct inserts are blocked; invitations go through the RPC.
  perform tests.as_user(parent);
  perform tests.assert_fails(
    format('insert into public.family_invitations (family_id, email, role, token_hash) values (%L, %L, %L, %L)', fam, 'y@example.test', 'parent', 'abc'),
    'no direct invitation inserts');
end
$$;

rollback;
