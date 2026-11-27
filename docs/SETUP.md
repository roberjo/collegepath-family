# Setup guide

How to run CollegePath Family locally and connect it to a hosted Supabase project.

## 1. Prerequisites

- Node.js 20.9+ and npm
- For the local Supabase stack (optional but recommended): Docker (Docker Desktop, Colima, or
  OrbStack)
- For `npm run test:db` without Docker: PostgreSQL 15+ command-line tools (`initdb`, `pg_ctl`,
  `psql`), e.g. `brew install postgresql@17`

```bash
npm install
cp .env.example .env.local
```

## 2a. Local development with the Supabase CLI (recommended)

This runs Postgres, Auth, and a mail catcher in Docker with all migrations applied. No real email is
sent and no real data leaves your machine.

```bash
npx supabase@3.4.0 start      # first run downloads the Docker images
npx supabase@3.4.0 status     # shows the API URL and publishable key
```

Put the values into `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable key from `supabase status`>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Then `npm run dev` and open http://localhost:3000.

- Confirmation and password-reset emails appear in the local mail viewer at
  http://127.0.0.1:54324.
- Supabase Studio (table browser) is at http://127.0.0.1:54323.
- After adding a migration, `npx supabase@3.4.0 db reset` rebuilds the local database.
- `npx supabase@3.4.0 stop` shuts everything down.

Local settings live in `supabase/config.jsonc` (site URL `http://localhost:3000`, email
confirmations on, unused services disabled).

## 2b. Hosted Supabase project

1. Create a project at https://supabase.com (the free tier is sufficient for one family).
2. **Apply migrations** in numeric order. Either paste each file from `supabase/migrations/` into
   the SQL Editor, or:
   ```bash
   npx supabase@3.4.0 login
   npx supabase@3.4.0 link --project-ref <project-ref>
   npx supabase@3.4.0 db push
   ```
3. **API keys:** Project Settings → API Keys. Copy the Project URL and the **publishable** key into
   `.env.local` (and later into Vercel). Never use the secret/service-role key in this app.
4. **Auth → URL Configuration:**
   - Site URL: your production URL (e.g. `https://collegepath-family.vercel.app`)
   - Redirect URLs: `http://localhost:3000/**`, your production URL followed by `/**`, and
     `https://*-<your-vercel-team>.vercel.app/**` if you want preview deployments to sign in.
5. **Auth → Providers → Email:** keep email/password enabled and "Confirm email" on. Set a minimum
   password length of 8 or more.
6. **Auth → Emails:** the default templates work with the app's `/auth/callback` route. Supabase's
   built-in email sender is rate-limited and intended for low volume, which is fine for a family; a
   custom SMTP server can be configured later if needed.

## 3. Create the family

1. Open the app, choose **Create an account**, and confirm your email.
2. Create the family workspace — you become the first parent administrator.
3. Add the student profiles (Students → Add student).
4. Family settings → **Invite a family member**: enter each person's email and role, and for
   students pick their profile. Copy the link and send it to them by text or email.
5. Each person opens their link, creates an account with the invited email, confirms it, and joins.

Do not enter Social Security numbers, FAFSA credentials, tax documents, or bank information anywhere
in the app (PRD §6).

## 4. Checks

```bash
npm run check     # format, lint, typecheck, unit tests, production build
npm run test:db   # migrations + RLS tests against a throwaway Postgres
```
