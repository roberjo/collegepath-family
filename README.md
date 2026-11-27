# CollegePath Family

A family college-planning workspace for student profiles, college research, applications, scholarships, tasks, deadlines, and awards.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS v4
- Supabase Auth + PostgreSQL + Row Level Security
- Vercel deployment
- GitHub source control

## Local development

Requirements: Node.js 20.9+ and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

### Checks

| Command                           | What it does                                                                                                                                                                             |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run format` / `format:check` | Prettier (with Tailwind class sorting)                                                                                                                                                   |
| `npm run lint`                    | ESLint (Next.js core-web-vitals + TypeScript rules)                                                                                                                                      |
| `npm run typecheck`               | `tsc --noEmit`                                                                                                                                                                           |
| `npm test`                        | Vitest unit tests                                                                                                                                                                        |
| `npm run test:db`                 | Applies all migrations to a throwaway Postgres and runs the SQL/RLS tests in `supabase/tests` (needs PostgreSQL 15+ binaries locally, or `DATABASE_URL` pointing at a disposable server) |
| `npm run check`                   | Everything except the database tests                                                                                                                                                     |

CI runs all of these on every pull request.

The dashboard currently uses illustrative sample data. Supabase authentication and data-backed CRUD screens are not yet wired up.

## Supabase setup

1. Create a Supabase project.
2. Copy the Project URL and publishable key into `.env.local`.
3. Apply every file in `supabase/migrations/` **in numeric order** (SQL Editor, or `npx supabase link` + `npx supabase db push`).
4. Configure Auth URL settings for local and production URLs.
5. Add the same public environment variables to Vercel.

## Security

- Family-owned tables have Row Level Security enabled.
- Related records include family-scoped foreign keys to prevent cross-family references.
- Never commit `.env.local`, service-role keys, student records, FAFSA credentials, Social Security numbers, or tax documents.
- The current dashboard is a UI preview, not a connected family database.

## Documentation

- [Product requirements and phased plan](docs/PRD.md)
- [Architecture decision records](docs/adr/README.md)

## MVP milestone

Foundation: responsive dashboard, Next.js project setup, Supabase client helpers, and initial family-scoped schema. Next: secure family onboarding, invitations, login, role-aware access, and data-backed CRUD.
