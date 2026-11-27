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

The dashboard currently uses illustrative sample data. Supabase authentication and data-backed CRUD screens are not yet wired up.

## Supabase setup
1. Create a Supabase project.
2. Copy the Project URL and publishable key into `.env.local`.
3. Run `supabase/migrations/0001_initial_schema.sql` in the Supabase SQL Editor.
4. Configure Auth URL settings for local and production URLs.
5. Add the same public environment variables to Vercel.

## Security
- Family-owned tables have Row Level Security enabled.
- Related records include family-scoped foreign keys to prevent cross-family references.
- Never commit `.env.local`, service-role keys, student records, FAFSA credentials, Social Security numbers, or tax documents.
- The current dashboard is a UI preview, not a connected family database.

## MVP milestone
Foundation: responsive dashboard, Next.js project setup, Supabase client helpers, and initial family-scoped schema. Next: secure family onboarding, invitations, login, role-aware access, and data-backed CRUD.
