// End-to-end smoke test against the LOCAL Supabase stack (`npx supabase start`).
// Exercises real Auth, PostgREST, RPCs, and RLS with four family accounts.
// Usage: SUPABASE_SECRET_KEY=<from `supabase status`> node scripts/smoke-local.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
const publishable = process.env.SUPABASE_PUBLISHABLE_KEY;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!/^http:\/\/(127\.0\.0\.1|localhost)/.test(url)) {
  throw new Error("smoke-local only runs against a local Supabase stack");
}
if (!publishable || !secret)
  throw new Error("Set SUPABASE_PUBLISHABLE_KEY and SUPABASE_SECRET_KEY");

const admin = createClient(url, secret, { auth: { persistSession: false } });
const run = Date.now();
const password = "correct-horse-battery";
let failures = 0;

function check(cond, label) {
  console.log(`${cond ? "ok  " : "FAIL"}  ${label}`);
  if (!cond) failures++;
}

async function account(name) {
  const email = `${name}.${run}@example.test`;
  const { error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  const client = createClient(url, publishable, { auth: { persistSession: false } });
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;
  return { email, client };
}

const parent = await account("parent");
const parent2 = await account("parent2");
const kid = await account("kid");
const outsider = await account("outsider");

const { data: familyId, error: famErr } = await parent.client.rpc("create_family", {
  p_name: "Smoke Family",
  p_display_name: "Parent One",
  p_time_zone: "America/Chicago",
});
check(!famErr && familyId, "parent creates family");

const { data: students } = await parent.client
  .from("students")
  .insert([
    { family_id: familyId, display_name: "Student A", graduation_year: 2028 },
    { family_id: familyId, display_name: "Student B", graduation_year: 2030 },
  ])
  .select();
check(students?.length === 2, "parent adds two students");
const [stuA, stuB] = students;

const { data: parentToken } = await parent.client.rpc("create_invitation", {
  p_family_id: familyId,
  p_email: parent2.email,
  p_role: "parent",
});
const { data: kidToken } = await parent.client.rpc("create_invitation", {
  p_family_id: familyId,
  p_email: kid.email,
  p_role: "student",
  p_student_id: stuA.id,
});
check(
  typeof parentToken === "string" && typeof kidToken === "string",
  "parent creates invitations",
);

const anon = createClient(url, publishable, { auth: { persistSession: false } });
const { data: preview } = await anon.rpc("get_invitation", { p_token: kidToken });
check(preview?.[0]?.family_name === "Smoke Family", "anonymous invitation preview");
const { error: anonRead } = await anon.from("students").select("id");
check(Boolean(anonRead), "anonymous cannot read tables");

const { error: wrongEmail } = await outsider.client.rpc("accept_invitation", {
  p_token: kidToken,
  p_display_name: "Imposter",
});
check(Boolean(wrongEmail), "invitation rejects a different account");

const { error: acc1 } = await parent2.client.rpc("accept_invitation", {
  p_token: parentToken,
  p_display_name: "Parent Two",
});
const { error: acc2 } = await kid.client.rpc("accept_invitation", {
  p_token: kidToken,
  p_display_name: "Kid A",
});
check(!acc1 && !acc2, "invitees accept");

const { data: kidStudents } = await kid.client.from("students").select("id");
check(kidStudents?.length === 1 && kidStudents[0].id === stuA.id, "student sees only own profile");
const { data: p2Students } = await parent2.client.from("students").select("id");
check(p2Students?.length === 2, "second parent sees both students");
const { data: outsiderStudents } = await outsider.client.from("students").select("id");
check(outsiderStudents?.length === 0, "outsider sees no students");
const { data: byUuid } = await outsider.client.from("students").select("id").eq("id", stuA.id);
check(byUuid?.length === 0, "outsider cannot read by known UUID");

const { error: kidAddStudent } = await kid.client
  .from("students")
  .insert({ family_id: familyId, display_name: "Nope", graduation_year: 2029 });
check(Boolean(kidAddStudent), "student cannot add students");

const { data: college } = await kid.client
  .from("colleges")
  .insert({ family_id: familyId, name: "Kid's College" })
  .select()
  .single();
check(Boolean(college), "student adds a shared college");
const { error: kidSiblingApp } = await kid.client
  .from("applications")
  .insert({ family_id: familyId, student_id: stuB.id, college_id: college.id });
check(Boolean(kidSiblingApp), "student cannot create sibling application");
const { error: kidOwnApp } = await kid.client
  .from("applications")
  .insert({ family_id: familyId, student_id: stuA.id, college_id: college.id });
check(!kidOwnApp, "student creates own application");

const { data: members } = await parent.client
  .from("family_members")
  .select("id, user_id, role")
  .eq("family_id", familyId);
const kidMember = members.find((m) => m.role === "student");
const { error: removeErr } = await parent.client
  .from("family_members")
  .update({ status: "removed" })
  .eq("id", kidMember.id);
check(!removeErr, "parent removes student access");
const { data: afterRemoval } = await kid.client.from("colleges").select("id");
check(afterRemoval?.length === 0, "removed member immediately loses access");

const { data: me } = await parent.client.auth.getUser();
const { error: lastParent } = await parent.client
  .from("family_members")
  .update({ role: "student" })
  .eq("user_id", me.user.id)
  .eq("family_id", familyId);
check(!lastParent, "parent can step down while another parent exists");

console.log(failures ? `\n${failures} check(s) failed` : "\nall checks passed");
process.exit(failures ? 1 : 0);
