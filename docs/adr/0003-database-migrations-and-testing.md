# ADR 0003: Versioned SQL migrations with a local RLS test harness

- **Status:** Accepted
- **Date:** 2026-11-27

## Context

Authorization lives in PostgreSQL Row Level Security. The PRD requires proving that a user outside
a family cannot read or modify its records, even with a known UUID, and that parent/student rules
are enforced by the database. Policies are easy to get subtly wrong and impossible to eyeball.

Reviewing `0001_initial_schema.sql` found a real defect: composite foreign keys declared
`(x_id, family_id) … on delete set null` null **both** columns, but `family_id` is `NOT NULL`, so
deleting a student, application, college, or scholarship application referenced by a task or award
failed.

## Decision

- Schema changes are append-only SQL files in `supabase/migrations/` named `NNNN_description.sql`
  (compatible with `supabase db push`). Applied migrations are never edited; fixes go in a new file.
  `0002_schema_review_fixes.sql` carries the Phase 0 review fixes (FK `set null (column)` syntax,
  `updated_at` triggers, `archived_at`, family `time_zone`, check constraints, indexes, and removal
  of `anon` table grants).
- `scripts/test-db.sh` (`npm run test:db`) creates a throwaway PostgreSQL database, loads
  `supabase/tests/setup/supabase_stub.sql` (the `auth` schema, `auth.uid()`, Supabase roles and
  default grants), applies every migration in order, then runs each `supabase/tests/*.test.sql`.
  Tests switch identity with `tests.as_user(uuid)` and assert with `tests.assert` /
  `tests.assert_fails`, inside a transaction that is rolled back.
- Locally the script starts a temporary Postgres cluster (needs PostgreSQL 15+ binaries). In CI it
  runs against a `postgres:17` service container via `DATABASE_URL`.

## Alternatives considered

- **Supabase CLI + pgTAP (`supabase test db`)**: most faithful, but requires Docker and the full
  Supabase stack locally and in CI. Can be adopted later; the SQL tests would port easily.
- **Testing only through the app**: slower, and cannot prove the database rejects requests that
  bypass the UI.

## Consequences

- Every policy change ships with tests that run on every pull request.
- The stub is not Supabase. Anything depending on GoTrue behaviour (emails, tokens) is tested
  manually against a real development project.
