# ADR 0010: Automated deployment pipeline

- **Status:** Accepted
- **Date:** 2026-11-27
- **Supersedes:** the manual deployment steps in ADR 0009 (hosting choices are unchanged)

## Context

The owner asked for deployment and production checks to be fully automated. Vercel's Git
integration deploys `main` on its own schedule, but it cannot run database migrations first, and it
has no gate that tests a deployment before it receives traffic. The repository is public, so
Actions logs and artifacts are public too.

## Decision

- GitHub Actions owns production deploys (`deploy.yml`). `vercel.json` sets
  `git.deploymentEnabled.main = false`. Pull-request previews stay on Vercel's Git integration.
- Order on every push to `main`: reusable CI → `supabase db push --remote` → `vercel build`
  (tagging the build with the commit via `NEXT_PUBLIC_APP_VERSION`) →
  `vercel deploy --prod --skip-domain` → smoke checks against the staged deployment (using a
  protection-bypass secret) → `vercel promote` → the same checks against the production URL.
- `scripts/smoke-production.mjs` performs only reads. It checks:
  - `/api/health` is healthy and reports the expected commit;
  - security headers and `noindex` are present;
  - signed-out pages redirect to sign-in;
  - anonymous REST reads of every family table are refused, and unknown invitation tokens are
    rejected;
  - optionally, a dedicated smoke account can sign in, render pages, and see only its own family's
    rows.

  It prints only check names, status codes, and counts.

- `production-check.yml` runs the same checks every 6 hours and manages a single
  `production-alert` issue.
- CI enforces that migrations are append-only: no edits or deletions, and new files sort last.
- Production jobs are skipped until the `PRODUCTION_URL` variable exists, so the pipeline can merge
  before any accounts exist.
- CLI versions are pinned (`vercel@65.14.0`, `supabase@3.4.0`).

## Consequences

- A failed verification leaves production on the previous deployment.
- Migrations run before promotion, so they must be backward compatible with the deployed code
  (expand/contract). Migrations are never rolled back automatically.
- One-time setup needs about eleven secrets and variables (`docs/OPERATIONS.md`).
- GitHub disables scheduled workflows in public repositories after 60 days without commits. Re-enable
  the scheduled check from the Actions tab if that happens.
