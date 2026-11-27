# ADR 0009: Hosting, backups, and recovery

- **Status:** Accepted
- **Date:** 2026-11-27

## Context

PRD §8 asks for free or low-cost hosting, a backup/export approach, and account recovery before
real data is relied upon. Supabase's Free plan has no downloadable automatic backups and pauses
inactive projects. The family is four people; operations must be simple.

## Decision

- **Hosting:** Vercel (Hobby) for the app with `main` as the production branch and preview
  deployments per pull request; Supabase for Auth and Postgres. Start on the default
  `*.vercel.app` domain; a custom domain is optional.
- **Environments:** a local Supabase stack (`supabase/config.jsonc`) for development and a separate
  hosted project for production. Real family data only lives in production.
- **Export as the primary backup:** parents can download a full JSON export or per-table CSVs from
  Family settings (`/export/[dataset]`). The route reads with the parent's own session, so RLS
  scopes it to their family; CSV cells starting with `= + - @` are prefixed to prevent spreadsheet
  formula injection. The project owner can additionally take `supabase db dump` backups.
- **Recovery:** password reset by email; parents can remove and re-invite members; the database
  guarantees at least one active parent; the project owner can intervene from the Supabase
  dashboard as a last resort.
- **Hardening:** standard security headers (`X-Frame-Options: DENY`, `nosniff`,
  `Referrer-Policy`, `Permissions-Policy`), `noindex` metadata, no service-role key anywhere.

## Consequences

- Zero hosting cost for the expected usage, at the price of manual backups.
- Moving to Supabase Pro later adds automated daily backups with no code changes.
- Operational steps are documented in `docs/OPERATIONS.md`.
