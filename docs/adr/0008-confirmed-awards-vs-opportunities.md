# ADR 0008: Confirmed awards are separate from scholarship outcomes

- **Status:** Accepted
- **Date:** 2026-11-27

## Context

The PRD's _no false certainty_ principle requires keeping estimates, pending decisions, and
confirmed awards clearly separate. A scholarship application can be marked "Awarded" by any family
member, sometimes on an informal heads-up, and advertised amounts often differ from what is paid.

## Decision

- **Scholarships** (family directory) hold the advertised amount and dates.
- **Scholarship applications** hold each student's status and the amount reported as awarded.
- **Awards** are the only source for "confirmed aid" totals. Only parents can record, edit, or
  delete them; students can read their own.
- When a scholarship application reaches "Awarded", parents get a **Record confirmed award**
  shortcut that pre-fills the award form. Until it is recorded, the item appears under
  **Awaiting a decision** on the Awards page and is never summed into totals.
- An award may link to a scholarship application only if both belong to the same student
  (trigger `check_award_links`). College-specific aid can link to a college.
- `academic_year` uses the `2028-29` format, validated in the form and the database.

Tasks follow a similar integrity rule: a task for a specific student may only link to that
student's application or scholarship application (trigger `check_task_links`). Family-wide tasks
may link to any record the member can see. Completing a task stamps `completed_at`.

## Consequences

- Dashboard and award totals can be trusted as "money confirmed in writing".
- Parents must take one extra step to confirm an award.
