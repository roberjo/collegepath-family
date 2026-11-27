#!/usr/bin/env node
/**
 * Read-only checks against a deployed CollegePath Family instance.
 *
 * The repository is public, so this script NEVER prints response bodies,
 * user data, or row contents — only check names, status codes, and counts.
 *
 * Required: BASE_URL, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY
 * Optional:
 *   EXPECTED_VERSION                 commit the deployment must report (waits up to VERSION_WAIT_SECONDS)
 *   VERCEL_AUTOMATION_BYPASS_SECRET  for Vercel-protected deployment URLs
 *   SMOKE_EMAIL, SMOKE_PASSWORD      dedicated read-only smoke-test account (signed-in checks)
 */
import { createServerClient } from "@supabase/ssr";

const env = process.env;
const BASE = (env.BASE_URL ?? "").replace(/\/$/, "");
const SB_URL = (env.SUPABASE_URL ?? "").replace(/\/$/, "");
const SB_KEY = env.SUPABASE_PUBLISHABLE_KEY ?? "";
const WAIT = Number(env.VERSION_WAIT_SECONDS ?? 180);

if (!BASE || !SB_URL || !SB_KEY) {
  console.error("BASE_URL, SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are required.");
  process.exit(2);
}

const failures = [];
async function check(name, fn) {
  try {
    await fn();
    console.log(`✓ ${name}`);
  } catch (err) {
    failures.push(name);
    console.log(`✗ ${name}: ${err instanceof Error ? err.message : String(err)}`);
  }
}
function expect(condition, message) {
  if (!condition) throw new Error(message);
}

/** Request to the app. Redirects are not followed so they can be asserted. */
function app(path, { cookie } = {}) {
  const headers = {};
  if (env.VERCEL_AUTOMATION_BYPASS_SECRET) {
    headers["x-vercel-protection-bypass"] = env.VERCEL_AUTOMATION_BYPASS_SECRET;
  }
  if (cookie) headers.cookie = cookie;
  return fetch(`${BASE}${path}`, {
    headers,
    redirect: "manual",
    signal: AbortSignal.timeout(20000),
  });
}
function rest(path, { token, method = "GET", body } = {}) {
  return fetch(`${SB_URL}${path}`, {
    method,
    headers: {
      apikey: SB_KEY,
      authorization: `Bearer ${token ?? SB_KEY}`,
      "content-type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(20000),
  });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

console.log(`Checking ${new URL(BASE).host}`);

// 1. Health, and that the expected build is the one serving traffic.
await check(
  "health endpoint reports ok" + (env.EXPECTED_VERSION ? " on the expected version" : ""),
  async () => {
    const deadline = Date.now() + WAIT * 1000;
    let last = "";
    for (;;) {
      try {
        const res = await app("/api/health");
        const body = res.headers.get("content-type")?.includes("json") ? await res.json() : null;
        last = `HTTP ${res.status}, supabase=${body?.supabase ?? "?"}, version=${body?.version ?? "?"}`;
        const versionOk = !env.EXPECTED_VERSION || body?.version === env.EXPECTED_VERSION;
        if (res.status === 200 && body?.status === "ok" && versionOk) return;
      } catch (err) {
        last = err instanceof Error ? err.message : String(err);
      }
      if (Date.now() >= deadline) throw new Error(last);
      await sleep(5000);
    }
  },
);

// 2. Public pages, headers, and indexing.
await check("sign-in page loads with security headers and noindex", async () => {
  const res = await app("/login");
  expect(res.status === 200, `HTTP ${res.status}`);
  const h = (n) => res.headers.get(n) ?? "";
  expect(h("x-frame-options") === "DENY", "missing X-Frame-Options: DENY");
  expect(h("x-content-type-options") === "nosniff", "missing nosniff");
  expect(h("referrer-policy") !== "", "missing Referrer-Policy");
  expect(h("permissions-policy") !== "", "missing Permissions-Policy");
  expect((await res.text()).includes("noindex"), "robots noindex meta not found");
});

// 3. Signed-out access is redirected to sign-in.
for (const path of ["/dashboard", "/students", "/settings", "/export/all.json"]) {
  await check(`signed-out ${path} redirects to sign-in`, async () => {
    const res = await app(path);
    expect([307, 308].includes(res.status), `HTTP ${res.status}`);
    expect((res.headers.get("location") ?? "").includes("/login"), "not redirected to /login");
  });
}

// 4. The database refuses anonymous reads of every family table.
const TABLES = [
  "families",
  "family_members",
  "family_invitations",
  "students",
  "colleges",
  "college_interests",
  "applications",
  "application_requirements",
  "scholarships",
  "scholarship_applications",
  "tasks",
  "awards",
];
await check("Supabase Auth is healthy", async () => {
  const res = await rest("/auth/v1/health");
  expect(res.ok, `HTTP ${res.status}`);
});
await check(`anonymous requests cannot read any of ${TABLES.length} family tables`, async () => {
  const leaks = [];
  for (const t of TABLES) {
    const res = await rest(`/rest/v1/${t}?select=id&limit=1`);
    if (res.ok && (await res.json()).length > 0) leaks.push(t);
    else if (res.status >= 500) leaks.push(`${t} (HTTP ${res.status})`);
  }
  expect(leaks.length === 0, `readable: ${leaks.join(", ")}`);
});
await check("invitation lookup rejects an unknown token", async () => {
  const res = await rest("/rest/v1/rpc/get_invitation", {
    method: "POST",
    body: { p_token: "smoke-check-not-a-real-token" },
  });
  expect(res.status < 500, `HTTP ${res.status}`);
  if (res.ok) expect((await res.json()).length === 0, "unknown token returned a row");
});

// 5. Optional signed-in checks with a dedicated smoke-test account.
if (env.SMOKE_EMAIL && env.SMOKE_PASSWORD) {
  const jar = new Map();
  const supabase = createServerClient(SB_URL, SB_KEY, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (cookies) => cookies.forEach(({ name, value }) => jar.set(name, value)),
    },
  });
  let token = "";
  let userId = "";
  await check("smoke account can sign in", async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: env.SMOKE_EMAIL,
      password: env.SMOKE_PASSWORD,
    });
    expect(!error && data.session, error?.message ?? "no session");
    token = data.session.access_token;
    userId = data.user.id;
  });
  if (token) {
    const cookie = [...jar].map(([n, v]) => `${n}=${v}`).join("; ");
    for (const path of ["/dashboard", "/students", "/applications", "/scholarships", "/tasks"]) {
      await check(`signed-in ${path} renders`, async () => {
        const res = await app(path, { cookie });
        expect(res.status === 200, `HTTP ${res.status}`);
      });
    }
    await check("signed-in user only sees their own families' rows", async () => {
      const mine = await rest(`/rest/v1/family_members?select=family_id&user_id=eq.${userId}`, {
        token,
      });
      expect(mine.ok, `memberships HTTP ${mine.status}`);
      const allowed = new Set((await mine.json()).map((m) => m.family_id));
      expect(allowed.size > 0, "smoke account has no family; finish onboarding for it");
      for (const t of TABLES.filter((t) => t !== "families" && t !== "family_invitations")) {
        const res = await rest(`/rest/v1/${t}?select=family_id`, { token });
        expect(res.ok, `${t} HTTP ${res.status}`);
        const foreign = (await res.json()).filter((r) => !allowed.has(r.family_id)).length;
        expect(foreign === 0, `${t}: ${foreign} row(s) from another family`);
      }
    });
    await supabase.auth.signOut({ scope: "local" });
  }
} else {
  console.log("- signed-in checks skipped (SMOKE_EMAIL / SMOKE_PASSWORD not set)");
}

if (failures.length) {
  console.log(`\n${failures.length} check(s) failed.`);
  process.exit(1);
}
console.log("\nAll production checks passed.");
