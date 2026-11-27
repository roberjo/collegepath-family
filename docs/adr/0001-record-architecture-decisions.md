# ADR 0001: Record architecture decisions and baseline stack

- **Status:** Accepted
- **Date:** 2026-11-27

## Context

CollegePath Family is built incrementally across several phases (see `docs/PRD.md` §9). Decisions
made early — permissions, data model, hosting — shape later work, and the reasoning is easy to lose
when it only lives in chat threads or pull-request comments.

## Decision

1. Keep Architecture Decision Records in `docs/adr/`, numbered sequentially, one decision per file.
2. Confirm the stack chosen in the PRD: Next.js App Router + TypeScript, Tailwind CSS v4, Supabase
   (Auth, PostgreSQL, Row Level Security), Vercel hosting, GitHub source control.
3. Development workflow:
   - `main` is always deployable. Work happens on `feat/*` / `fix/*` branches, one pull request per
     PRD phase or focused change, squash-merged after CI passes.
   - CI (`.github/workflows/ci.yml`) runs formatting, lint, typecheck, unit tests, production
     build, and the database migration/RLS test suite on every pull request.
   - Prettier (with the Tailwind class-sorting plugin) is the single source of formatting.
   - Vitest for unit tests; SQL tests for database behaviour (ADR 0003).
   - Zod validates every form submission on the server.

## Consequences

- Reviewers can see why something is the way it is without reconstructing history.
- Formatting churn disappears from diffs once the initial reformat lands.
- Adding a dependency or changing a convention should come with an ADR.
