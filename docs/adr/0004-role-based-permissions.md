# ADR 0004: Role-based permissions (parents and students)

- **Status:** Accepted
- **Date:** 2026-11-27

## Context

The PRD (§2, §11) requires distinguishable parent and student permissions enforced by the database,
and leaves the exact rules open. The initial policies allowed any family member to do anything.
Principles that drive the choice: _student-centered_ (each student's path is distinct), _privacy by
design_, and _family coordination first_.

## Decision

Authorization is expressed in PostgreSQL RLS using `SECURITY DEFINER` helper functions
(`is_family_member`, `is_family_parent`, `my_student_id`, `can_access_student`,
`can_access_application`, `can_access_scholarship_application`, `can_see_task`). Only **active**
memberships count.

| Data                                               | Parents                                | Students                                                                                                                                         |
| -------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Family details                                     | read, update                           | read                                                                                                                                             |
| Members                                            | read, change role/link, remove/restore | read (names for assignment)                                                                                                                      |
| Invitations                                        | create, read, cancel                   | none                                                                                                                                             |
| Student profiles                                   | full access                            | read/update **own** profile only                                                                                                                 |
| Colleges, scholarships (shared family directories) | full access                            | read, add, update; no delete                                                                                                                     |
| College interests, application requirements        | full access                            | full access for **own** student                                                                                                                  |
| Applications, scholarship applications             | full access                            | read/add/update **own**; no delete                                                                                                               |
| Awards                                             | full access                            | read **own** only                                                                                                                                |
| Tasks                                              | full access                            | see family-wide tasks, own student's tasks, tasks assigned to or created by them; create for self or family-wide; delete only tasks they created |

Answers to the PRD's open questions:

- **Can students see all family scholarship and award information?** Scholarship _opportunities_
  are shared (one record, useful to both students). Each student's scholarship _applications_ and
  _awards_ are private to that student and the parents.
- **Can students invite or manage users?** No.
- **Parent vs student create/edit/delete:** as tabled above. Deletion of long-lived records is
  parent-only; students archive or change status instead.

Additional rules:

- A family always keeps at least one active parent (trigger `guard_family_member_update`).
- Membership rows cannot be moved between users or families.
- Removing a member sets `status = 'removed'`; access ends immediately and can be restored.
- Composite `(id, family_id)` foreign keys continue to block cross-family references.

## Consequences

- The UI hides actions a role cannot perform, but correctness never depends on it.
- Each rule has a SQL test in `supabase/tests/02_permissions.test.sql`.
- If the family later wants siblings to see each other's work, the change is confined to
  `can_access_student` plus tests.
