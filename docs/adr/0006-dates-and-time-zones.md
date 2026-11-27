# ADR 0006: Date-only deadlines and family time zone

- **Status:** Accepted
- **Date:** 2026-11-27

## Context

Most deadlines are calendar dates, not instants. Converting `"2026-12-04"` to a JavaScript `Date`
in local time can display it as Dec 3 in some time zones. Server rendering on Vercel runs in UTC, so
"due today" would flip at 7 p.m. Eastern. The PRD requires that date-only deadlines not shift.

## Decision

- Deadlines and due dates are Postgres `date` columns and are handled as `YYYY-MM-DD` strings end to
  end (`src/lib/dates.ts`). Formatting uses UTC so the calendar date never moves.
- Each family has a `time_zone` (IANA name, default `America/New_York`, editable in Family
  settings). "Today" is computed in that zone; overdue / due today / days-left labels derive from it.
- Timestamps (`created_at`, `submitted_at`) remain `timestamptz`.
- Urgency is always shown as text ("3 days overdue", "Due today"), not only colour.

## Consequences

- Every member sees the same "due today" regardless of where they are, matching how a family plans.
