# Operations guide

Deploying, administering, backing up, and recovering CollegePath Family. See
[SETUP.md](SETUP.md) for first-time local and Supabase setup and
[ADR 0009](adr/0009-hosting-backups-and-recovery.md) for the reasoning behind these choices.

## Deploy to production

Deployment is automated by GitHub Actions ([ADR 0010](adr/0010-automated-deployment-pipeline.md)).
Every merge to `main` runs `.github/workflows/deploy.yml`:

1. CI (format, lint, typecheck, unit tests, build, migration + RLS tests).
2. `supabase db push` applies new migrations to the production database.
3. `vercel build` + `vercel deploy --prod --skip-domain` creates the deployment **without** moving
   the production domain.
4. `scripts/smoke-production.mjs` verifies that staged deployment. If it fails, production is
   untouched.
5. `vercel promote` switches the domain, then the checks run again against the production URL.

`.github/workflows/production-check.yml` repeats the read-only checks every 6 hours and opens a
`production-alert` issue on failure (closed automatically on recovery). Run either workflow by hand
from the **Actions** tab (**Run workflow**).

Until the `PRODUCTION_URL` variable exists, both workflows skip their production jobs, so merges
still run CI only.

> **The repository is public, so workflow logs are public.** The check script prints only check
> names, status codes, and counts. Never add steps that print query results or upload database
> dumps as artifacts.

### One-time setup

1. **Supabase:** create the production project (SETUP.md §2b). Migrations are applied by the
   workflow, so you do not need to run them by hand. Note the project ref, the database password,
   the Project URL, and the publishable key. Create a personal access token under
   **Account → Access Tokens**.
2. **Vercel:** **Add New → Project → Import** `roberjo/collegepath-family` (Next.js defaults are
   correct). `vercel.json` turns off Git deployments of `main`, so production deploys only come
   from the workflow; pull-request previews still deploy.
   - **Environment variables → Production:** `NEXT_PUBLIC_SUPABASE_URL`,
     `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_SITE_URL` (for example
     `https://collegepath-family.vercel.app`). Never add a Supabase secret/service-role key.
   - **Preview:** do not point previews at the production database, because previews may contain
     migrations that have not run there. Either leave Preview variables unset (previews show the
     setup page) or use a second free Supabase project.
   - Create a token (**Account Settings → Tokens**). Find the org and project IDs under
     **Project → Settings → General**, or run `npx vercel link` and read `.vercel/project.json`.
   - **Settings → Deployment Protection:** keep protection on and create a **Protection Bypass for
     Automation** secret so the workflow can test the staged deployment.
3. **Supabase → Auth → URL Configuration:** Site URL = production URL; Redirect URLs include
   `https://<production-host>/**`.
4. **Smoke-test account (recommended):** sign up on production with a dedicated address (for
   example a `+smoke` alias), confirm it, and create its own family named "Smoke test". Don't add
   any real data to it. The checks only read data.
5. **GitHub → Settings → Secrets and variables → Actions:**

   | Kind     | Name                              | Value                                             |
   | -------- | --------------------------------- | ------------------------------------------------- |
   | Secret   | `VERCEL_TOKEN`                    | Vercel token                                      |
   | Secret   | `VERCEL_ORG_ID`                   | Vercel team/org ID                                |
   | Secret   | `VERCEL_PROJECT_ID`               | Vercel project ID                                 |
   | Secret   | `VERCEL_AUTOMATION_BYPASS_SECRET` | Protection bypass secret                          |
   | Secret   | `SUPABASE_ACCESS_TOKEN`           | Supabase personal access token                    |
   | Secret   | `SUPABASE_DB_PASSWORD`            | Production database password                      |
   | Secret   | `SMOKE_EMAIL` / `SMOKE_PASSWORD`  | Smoke-test account (optional)                     |
   | Variable | `SUPABASE_PROJECT_REF`            | Project ref (from the dashboard URL)              |
   | Variable | `SUPABASE_URL`                    | Supabase Project URL                              |
   | Variable | `SUPABASE_PUBLISHABLE_KEY`        | Publishable key (public by design)                |
   | Variable | `PRODUCTION_URL`                  | Production URL; **set last**, it turns on deploys |

6. Optional: **Settings → Environments → production** can require a reviewer to approve each
   deploy, and **Settings → Branches** can require the CI checks before merging.
7. **Actions → Deploy → Run workflow** for the first deployment, then run the manual checklist
   below once.

You can run the checks locally against any deployment:

```bash
BASE_URL=https://<host> SUPABASE_URL=... SUPABASE_PUBLISHABLE_KEY=... npm run smoke:production
```

**Domain:** start on the free `*.vercel.app` URL. A custom domain is optional (annual cost); if
added, update `NEXT_PUBLIC_SITE_URL`, the `PRODUCTION_URL` variable, and the Supabase URLs.

### Rollback

- **App:** Vercel → Deployments → previous production deployment → **Instant Rollback**, or run
  `npx vercel rollback`.
- **Database:** migrations are not rolled back automatically. Write a new forward migration. A
  migration must keep working with the code that is already deployed, because it runs before the
  new code is promoted. For example, add a column in one release and remove the old one in a later
  release.

## Manual production checklist

The automated checks cover health, headers, redirects, anonymous access, and signed-in reads. Run
this manual list after the first deployment and after releases that change sign-up, invitations,
or roles. Use a phone and a desktop browser.

- [ ] Signed-out visit to `/dashboard` redirects to sign-in.
- [ ] Create an account → confirmation email arrives → link lands on onboarding.
- [ ] Create the family; add a student; invite a second account as that student.
- [ ] As the student: only their own profile, applications, scholarships tracking, and awards are
      visible; shared colleges and scholarships are visible; Family settings shows no invitation
      tools.
- [ ] Add a college, application, requirement, scholarship, task; mark a requirement and task done.
- [ ] Password reset email works and lands on "Choose a new password".
- [ ] Export → Everything (JSON) downloads (parent only).
- [ ] Phone: menu opens and closes, forms are usable, no horizontal scrolling.

## Routine administration (parents)

| Task                                      | Where                                                                                |
| ----------------------------------------- | ------------------------------------------------------------------------------------ |
| Invite someone / resend an invitation     | Family settings → Invite (a new invitation replaces the old one)                     |
| Cancel a pending invitation               | Family settings → Recent invitations → Cancel                                        |
| Link a student account to a profile       | Family settings → member → Change role or student link                               |
| Remove someone's access                   | Family settings → member → Remove access (immediate; reversible with Restore access) |
| Change family name or time zone           | Family settings → Family details                                                     |
| Retire a student, college, or scholarship | Archive from its page (keeps history)                                                |

A family always keeps at least one active parent; the database refuses to remove or demote the
last one.

## Backups and export

- **In-app export (any plan):** Family settings → Export data. _Everything (JSON)_ is a complete
  copy of the family's records; per-table CSV files open in spreadsheets. Download one at least
  monthly during application season and store it somewhere private (it contains student data).
- **Database dump (owner):** with the Supabase CLI linked to the project:
  ```bash
  npx supabase@3.4.0 db dump --data-only -f backup-$(date +%F).sql
  ```
  Store dumps privately; never commit them.
- **Supabase backups:** the Free plan has no downloadable automatic backups and pauses projects
  after a period of inactivity. Pro adds daily backups. Check current plan limits before relying on
  production data, and log in or use the app regularly to avoid pausing.

## Recovery

| Situation                        | What to do                                                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Forgotten password               | "Forgot password?" on the sign-in page                                                                                                      |
| Lost access to the email address | A parent removes the old membership and invites the new address                                                                             |
| Last parent locked out           | Project owner signs in to the Supabase dashboard, resets the user's password (Authentication → Users), or adds a parent membership with SQL |
| Accidental deletion              | Restore the affected rows from the latest JSON export or SQL dump (owner, via SQL Editor)                                                   |
| Project paused (free tier)       | Restore it from the Supabase dashboard; data is retained                                                                                    |

## Releasing changes

1. Branch from `main`, open a pull request, and wait for CI. CI also checks that applied
   migrations were not edited and that new ones sort last.
2. Squash-merge. The Deploy workflow migrates, deploys, verifies, and promotes automatically.
   Watch it in the **Actions** tab. If it fails before promotion, production is unchanged.
