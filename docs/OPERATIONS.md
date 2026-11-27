# Operations guide

Deploying, administering, backing up, and recovering CollegePath Family. See
[SETUP.md](SETUP.md) for first-time local and Supabase setup and
[ADR 0009](adr/0009-hosting-backups-and-recovery.md) for the reasoning behind these choices.

## Deploy to Vercel (production)

1. Create the **production** Supabase project and apply every migration (SETUP.md §2b). Keep a
   separate local or development project for experiments — never test against real family data.
2. In Vercel: **Add New → Project → Import** `roberjo/collegepath-family`. The framework preset
   (Next.js) and default build settings are correct.
3. **Environment variables** (Production and Preview):

   | Name                                   | Value                                                         |
   | -------------------------------------- | ------------------------------------------------------------- |
   | `NEXT_PUBLIC_SUPABASE_URL`             | Supabase Project URL                                          |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key                                      |
   | `NEXT_PUBLIC_SITE_URL`                 | Production only: e.g. `https://collegepath-family.vercel.app` |

   Leave `NEXT_PUBLIC_SITE_URL` unset for Preview so links use the preview URL. Never add a Supabase
   secret/service-role key.

4. **Production branch:** `main`. Every pull request gets a preview deployment.
5. **Supabase → Auth → URL Configuration:** Site URL = production URL; Redirect URLs include
   `https://<production-host>/**` (and optionally your preview URL pattern).
6. Optional: **Vercel → Settings → Deployment Protection** can require Vercel login for previews.
7. Run the production smoke test below.

**Domain:** start on the free `*.vercel.app` URL. A custom domain is optional (annual cost); if
added, update `NEXT_PUBLIC_SITE_URL` and the Supabase Site URL / Redirect URLs.

## Production smoke test

Run after the first deployment and after any release that changes auth, permissions, or
migrations. Use a phone and a desktop browser.

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

1. Branch from `main`, open a pull request, and wait for CI (lint, typecheck, unit tests, build,
   migration + RLS tests).
2. New migrations: apply to production with `npx supabase@3.4.0 db push` **before or together
   with** merging code that depends on them. Migrations are append-only.
3. Merge (squash). Vercel deploys `main` automatically.
