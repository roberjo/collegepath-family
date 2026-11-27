# CollegePath Family

A private family workspace for college planning: student profiles, college research, applications
and their requirements, scholarships, tasks, deadlines, and confirmed awards. Each parent and
student has their own account. Access rules are enforced in the database.

## Stack

- Next.js 16 App Router + TypeScript, React 19
- Tailwind CSS v4, Lucide icons
- Supabase Auth + PostgreSQL + Row Level Security
- Zod validation, Vitest unit tests, SQL/RLS tests
- Vercel hosting, GitHub Actions CI

## Quick start

```bash
npm install
cp .env.example .env.local
npx supabase@3.4.0 start        # local Postgres + Auth in Docker, migrations applied
npx supabase@3.4.0 status       # copy API URL + publishable key into .env.local
npm run dev
```

Open http://localhost:3000, create an account (confirmation emails appear at
http://127.0.0.1:54324), and create your family workspace.

Full instructions, including connecting a hosted Supabase project, are in
**[docs/SETUP.md](docs/SETUP.md)**.

## Scripts

| Command                           | What it does                                                                                       |
| --------------------------------- | -------------------------------------------------------------------------------------------------- |
| `npm run dev`                     | Development server                                                                                 |
| `npm run check`                   | Format check, lint, typecheck, unit tests, production build                                        |
| `npm run format` / `format:check` | Prettier (with Tailwind class sorting)                                                             |
| `npm test`                        | Vitest unit tests                                                                                  |
| `npm run test:db`                 | Applies all migrations to a throwaway Postgres and runs the SQL/RLS tests in `supabase/tests`      |
| `npm run smoke:local`             | End-to-end checks against the local Supabase stack (needs the local secret key; see script header) |

CI runs the app checks and database tests on every pull request.

## Project layout

```
src/app/(auth)/        sign in, sign up, password reset
src/app/(app)/         authenticated workspace (dashboard, settings, …)
src/app/onboarding/    create a family
src/app/invite/        accept an invitation
src/components/        app shell, UI primitives, form kit
src/lib/               auth context, validation, dates, Supabase clients
supabase/migrations/   versioned schema + RLS
supabase/tests/        SQL tests for constraints and permissions
docs/                  PRD, setup guide, architecture decision records
```

## Security

- Every family-owned table has Row Level Security. Parents and students have different rights
  ([ADR 0004](docs/adr/0004-role-based-permissions.md)).
- Related records carry family-scoped foreign keys so records can't point into another family.
- The app uses only the Supabase publishable key. Never commit `.env.local` or a secret key.
- Do not store Social Security numbers, FAFSA credentials, tax documents, or bank details.

## Documentation

- [Product requirements and phased plan](docs/PRD.md)
- [Setup guide](docs/SETUP.md)
- [Architecture decision records](docs/adr/README.md)
