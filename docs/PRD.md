# CollegePath Family — Product Requirements Document

**Status:** MVP foundation in progress  
**Document version:** 0.1  
**Last updated:** 2026-11-27  
**Repository:** `roberjo/collegepath-family`  
**Working branch:** `feat/mvp-foundation`

---

## 1. Product overview

CollegePath Family is a private, mobile-friendly family workspace for organizing the college-planning process for two students. It gives parents and students a shared place to manage college research, applications, scholarships, requirements, tasks, deadlines, and confirmed financial awards.

The product should reduce the amount of planning information scattered across spreadsheets, email, notes, school portals, and family conversations. It should make the next action and its owner clear without becoming an overly complicated college-admissions platform.

### Product vision

One secure family workspace that helps each student make progress toward college while allowing parents to coordinate and support the process.

### Initial delivery goals

1. Make the app accessible to the family from a web browser on desktop, tablet, and phone.
2. Give each family member an individual sign-in.
3. Keep the two students' planning records distinct while allowing the family to share appropriate information.
4. Track the college journey from early exploration through applications, scholarship decisions, and awards.
5. Make upcoming tasks and deadlines easy to see.
6. Start on free or low-cost hosting and database tiers, with no paid third-party services required for the MVP.

---

## 2. Users and permissions

The initial family consists of four intended users:

- **Parent administrators (2):** coordinate the family workspace, manage student profiles and planning records, and invite family members.
- **Student users (2):** view and contribute to their own college-planning work, tasks, and applications.

The system must support more than one family in its data model, even though the first deployment is for one family.

### Permission principles

- Every user has an individual authenticated account; no shared family password.
- A signed-in user can access only a family of which they are an active member.
- Student records and student-specific activity are associated with a family and, where relevant, a particular student.
- Parent permissions and student permissions must be distinguishable and enforced on the server/database, not merely hidden in the interface.
- The MVP should allow family members to collaborate on shared planning records. Before launch, confirm which actions students may perform versus parent-only actions.
- Invites must be limited to the intended family and should not allow a user to join another family without an authorized invitation.

### Account onboarding

The intended flow is:

1. A parent creates the family workspace.
2. The parent invites the second parent and both students by email.
3. Each invitee accepts and creates or signs into an individual account.
4. The parent links each student account to the appropriate student profile.
5. Members see the workspace and features permitted by their role.

Do not create real user accounts, send invitations, or seed real student details until the family has configured Supabase and confirmed the onboarding flow.

---

## 3. Product scope

### MVP — required

| Area | Requirements |
|---|---|
| Authentication | Secure sign-in/sign-out, session handling, password reset, invitation/acceptance flow |
| Family workspace | Family profile, member list, roles, invitation management |
| Student profiles | Create/edit profiles; graduation year, school, GPA (optional), intended major, notes |
| Colleges | Add/edit/archive colleges; location, website, admissions URL, estimated annual cost, notes |
| College interests | Associate colleges with students; track interest level and notes |
| Applications | Track application type, status, deadline, submitted date, decision date, portal URL, notes |
| Application requirements | Track essays, recommendations, transcripts, test scores, forms, and other checklist items with due dates and completion status |
| Scholarships | Maintain a family opportunity list with sponsor, amount, eligibility, dates, source, and application URL |
| Scholarship applications | Track each student's separate status for a scholarship; record submitted date, decision, and awarded amount |
| Tasks | Assign tasks to a family member and/or student; category, due date, priority, status, description |
| Awards | Record confirmed scholarships and other college aid separately from unconfirmed opportunities |
| Dashboard | Family overview, student workspaces, upcoming deadlines, application/scholarship activity, confirmed award summary |
| Responsive UI | Usable layouts for phone, tablet, and desktop |
| Security | Supabase Row Level Security (RLS), family-scoped data access, safe environment-variable handling |
| Documentation | Local setup, Supabase setup, environment variables, deployment, and basic administration |

### Explicitly out of scope for the first MVP

- Automatic scholarship discovery, scraping, or AI scholarship matching.
- Direct integration with Common App, school systems, college portals, or FAFSA.
- FAFSA submission or storage of FAFSA credentials.
- Storing Social Security numbers, tax returns, bank credentials, or other highly sensitive financial documents.
- Automated email or SMS reminders.
- Google Calendar synchronization.
- Essay editing, document collaboration, or recommendation-letter workflows.
- Native iOS or Android apps.
- Payments, subscriptions, advertising, or monetization.

### Later enhancements

- Collegiate athletics and golf recruiting tracker (coach contacts, tournaments, swing/academic profile links, recruiting communications, and follow-up tasks).
- Scholarship discovery and eligibility matching.
- Calendar integration and configurable notifications.
- Essay and recommendation planning.
- Financial-aid package comparison and net-price tracking.
- Document links or carefully scoped file storage.
- Exportable reports and printable checklists.

---

## 4. Core user journeys

### 4.1 Parent creates the workspace

A parent signs up, creates a family workspace, and becomes its first parent administrator. The app provides a guided setup for the two student profiles and invitations to the other family members.

### 4.2 Student works on a college list

A student or parent adds a college, records its location and useful links, and associates it with the appropriate student. The family can label the college as exploring, interested, target, safety, or top choice.

### 4.3 Family tracks an application

A college application is associated with a student and college. The family tracks its overall status and records individual requirements such as essay, recommendation, transcript, and test score. Requirements can have separate due dates and completion states.

### 4.4 Family tracks a scholarship

A scholarship opportunity is stored once in the family list. Each student who applies gets a separate scholarship-application record and status. An award is recorded only when confirmed, so possible awards are not confused with actual awards.

### 4.5 Family manages deadlines

A member creates a task, optionally associates it with a student, application, or scholarship application, assigns it, and sets priority and due date. The dashboard surfaces upcoming and overdue work.

---

## 5. Information architecture and navigation

Primary navigation:

1. **Overview** — family dashboard.
2. **Students** — student profiles and individual planning views.
3. **Colleges** — family college directory and student interest lists.
4. **Applications** — applications, statuses, deadlines, and requirements.
5. **Scholarships** — opportunities and each student's application progress.
6. **Tasks & deadlines** — shared task list and due-date views.
7. **Family settings** — family details, members, roles, and invitations.

The interface should use a clear, calm, practical visual style. The initial dashboard design uses a deep navy navigation rail, muted teal accent, light neutral page background, white content cards, restrained status colors, and compact information hierarchy. Avoid a childish or overly decorative look. Prioritize legibility and quick scanning.

The UI should be mobile-first in behavior even when the desktop layout uses a persistent sidebar. Important actions must remain usable on small screens.

---

## 6. Data model

The initial database migration defines these entities:

| Entity | Purpose |
|---|---|
| `families` | Top-level family workspace |
| `family_members` | Authenticated users, family membership, and role |
| `students` | Student profiles belonging to a family |
| `colleges` | Colleges/universities tracked by a family |
| `college_interests` | Student-to-college relationship and interest level |
| `applications` | A student's application to a college |
| `application_requirements` | Individual checklist items for an application |
| `scholarships` | Scholarship opportunities stored at family level |
| `scholarship_applications` | A student's individual pursuit of a scholarship |
| `tasks` | Shared or student-specific work items |
| `awards` | Confirmed financial awards |

### Important modeling decisions

- Scholarships and scholarship applications are separate. One opportunity may be relevant to both students, while each student has an independent status and award outcome.
- Applications belong to a student and a college.
- Application requirements are separate checklist records, not a single text field.
- Confirmed awards are separate from estimated scholarship values or pending applications.
- Records carry a `family_id` and related-record constraints should prevent accidental cross-family associations.
- Graduation year, school, GPA, and intended major are editable profile attributes, not hard-coded application constants.

### Data minimization

Collect only what the product needs to manage planning. Do not store Social Security numbers, FAFSA IDs/passwords, tax returns, bank account credentials, or sensitive identity documents. Avoid placing real student data in source control, test fixtures, screenshots, issue descriptions, or public documentation.

---

## 7. Technical architecture

### Selected stack

| Layer | Technology | Responsibility |
|---|---|---|
| Web application | Next.js App Router | Routing, server/client rendering, application UI |
| Language | TypeScript | Type safety |
| Styling | Tailwind CSS | Responsive design system and layout |
| Icons | Lucide React | Consistent interface icons |
| Authentication | Supabase Auth | Individual accounts, sessions, invitations |
| Database | Supabase PostgreSQL | Relational application data |
| Authorization | PostgreSQL RLS | Enforce family and role access |
| Hosting | Vercel | Web deployment and preview deployments |
| Source control | GitHub | Version control, review, and project history |

### Architecture principles

- Prefer server-side data access for protected pages and mutations where practical.
- Use Supabase's supported SSR client pattern and refresh sessions through the Next.js request proxy/middleware mechanism appropriate to the installed Next.js version.
- Enforce authorization in PostgreSQL RLS policies in addition to application-level checks.
- Never expose a Supabase service-role/secret key to browser code or commit secrets to Git.
- Keep database schema changes in versioned SQL migrations.
- Use GitHub pull requests for reviewable changes and keep `main` deployable.
- Use Vercel preview deployments for branch/PR review and production deployment from the agreed production branch.

### Environments

- **Local:** developer machine with local environment variables.
- **Preview:** Vercel preview deployment for feature branches and pull requests.
- **Production:** Vercel production deployment connected to the production Supabase project.

Use separate Supabase projects for development and production if the project grows beyond initial family testing. At minimum, do not use real family data in an unprotected development environment.

---

## 8. Functional and non-functional requirements

### Security and privacy

- HTTPS for hosted environments.
- Individual accounts and secure session management.
- RLS enabled on all family-owned tables.
- Verify authorization for reads, inserts, updates, deletes, and related-record references.
- Test that a user outside a family cannot access its records, even if they know a record UUID.
- Role-based rules must be enforced server-side and in database policies.
- No secret keys or private student information in GitHub.
- Provide a way for a parent administrator to remove a member and revoke access.
- Establish a backup/export and account-recovery approach before relying on production data.

### Reliability and usability

- Clear empty states, validation, loading states, and actionable error messages.
- Dates displayed in the user's local timezone where times are involved; date-only deadlines should not shift across timezones.
- Consistent status labels and predictable navigation.
- Accessible labels, keyboard navigation, focus states, and sufficient color contrast.
- Avoid relying on color alone to communicate urgency or status.
- Responsive behavior at common mobile, tablet, and desktop widths.

### Performance and cost

- Start with free tiers for GitHub, Vercel, and Supabase where their current limits meet the family's needs.
- Avoid unnecessary background services and paid APIs in the MVP.
- Treat free-tier limits, inactivity pausing, backup availability, and usage caps as operational constraints to review before production use.
- A custom domain is optional and may have a separate annual cost.

---

## 9. Delivery plan and development phases

Phases are ordered by dependency. Each phase should end with a working, reviewable increment.

### Phase 0 — Product foundation (in progress)

**Goal:** Establish the codebase, visual direction, core data model, and development workflow.

Deliverables:
- [x] GitHub repository and working feature branch.
- [x] Next.js/TypeScript/Tailwind project scaffold.
- [x] Responsive dashboard preview using illustrative data.
- [x] Supabase client helper foundation.
- [x] Initial relational schema and RLS policy draft.
- [x] Project setup and security notes in README.
- [ ] Review and merge the foundation pull request.
- [ ] Run a clean install, lint, typecheck, and production build; resolve any issues.
- [ ] Review migration constraints and RLS policies before applying to a real database.

**Exit criteria:** The project builds successfully from a clean checkout, the schema is reviewed, and the dashboard shell is ready for integration.

### Phase 1 — Supabase setup, authentication, and family onboarding

**Goal:** Turn the static preview into a private, authenticated family application.

Deliverables:
- Create Supabase project and configure environment variables.
- Apply reviewed SQL migrations.
- Implement sign-in, sign-out, password reset, and session refresh.
- Implement family creation and first parent administrator.
- Implement secure invitation and acceptance for the second parent and two students.
- Implement member management and role-aware navigation.
- Add protected routes and server-side authorization checks.
- Add safe onboarding and empty states.

**Exit criteria:** Each intended family member can sign in individually; unauthorized users cannot access the family workspace; family membership and roles are enforced by the database.

### Phase 2 — Student profiles and college planning

**Goal:** Make the core college research workflow data-backed.

Deliverables:
- Student profile create, read, update, and archive/deactivate behavior.
- College directory create, read, update, and archive behavior.
- Associate colleges with one or both students.
- Interest levels, notes, useful URLs, and estimated cost.
- Student-specific planning views and filters.

**Exit criteria:** Parents and students can maintain real student profiles and college shortlists, with family isolation and role permissions verified.

### Phase 3 — Applications and requirements

**Goal:** Track the complete application checklist for each student and college.

Deliverables:
- Application create/edit and status tracking.
- Application deadlines, submitted dates, decision dates, and portal links.
- Requirement checklist with due dates and completion state.
- Filters by student, status, and deadline.
- Dashboard summaries based on real application data.

**Exit criteria:** A family can manage multiple applications and their individual requirements without relying on the sample dashboard data.

### Phase 4 — Scholarships, tasks, and awards

**Goal:** Coordinate scholarship work and family follow-through.

Deliverables:
- Scholarship opportunity directory.
- Separate scholarship application per student and opportunity.
- Scholarship status, deadlines, award decisions, and awarded amount.
- Task creation, assignment, priority, status, and due date.
- Relationships between tasks, applications, and scholarship applications.
- Confirmed award tracking and dashboard totals.

**Exit criteria:** The family can track opportunities through submission and decision, assign work, and distinguish pending amounts from confirmed awards.

### Phase 5 — Dashboard, quality, privacy, and production launch

**Goal:** Make the product dependable for routine family use.

Deliverables:
- Replace all illustrative dashboard figures with live database queries.
- Upcoming and overdue deadlines with useful sorting and filtering.
- Student-specific and family-wide dashboard views.
- Responsive and accessibility review.
- RLS and role-permission test suite, including cross-family isolation tests.
- Input validation, error handling, and audit-friendly timestamps.
- Production Vercel deployment and domain decision.
- Backup/export and recovery procedures.
- Production smoke test on desktop and mobile.

**Exit criteria:** The family can use the app with real planning data; access controls have been tested; production configuration and recovery expectations are documented.

### Phase 6 — Optional enhancements

Prioritize only after the core MVP is stable and being used.

Candidate work:
- Collegiate golf recruiting workspace.
- Scholarship discovery and eligibility matching.
- Calendar synchronization and reminders.
- Essay and recommendation planning.
- Financial-aid and net-price comparison.
- Carefully scoped document storage and exports.
- Additional analytics and planning reports.

Each enhancement should have its own short requirements review before implementation.

---

## 10. Acceptance criteria for the MVP

The MVP is considered complete when all of the following are true:

1. Four intended family members can use individual accounts.
2. A parent administrator can invite and manage family members.
3. Student users can access the appropriate student planning information.
4. Family records are private and protected by verified RLS policies.
5. The family can create and maintain student profiles and college shortlists.
6. Applications and their requirements can be tracked from planning through decision.
7. Scholarships can be tracked independently for each student.
8. Tasks can be assigned and deadlines are visible.
9. Confirmed awards are recorded separately from pending opportunities.
10. Dashboard summaries reflect live data rather than hard-coded examples.
11. The app works on phone and desktop.
12. The app is deployed to a private production URL with secrets kept out of source control.
13. Setup, basic administration, and recovery steps are documented.

---

## 11. Risks, decisions, and open questions

### Known risks

- **Authorization complexity:** RLS policies must protect both direct records and all related-record joins. A UI-only permission model is not sufficient.
- **Invitation flow:** Family invitations must be secure and straightforward for less technical family members.
- **Free-tier limits:** Supabase/Vercel free plans can change and may have limits on storage, inactivity, backups, and usage.
- **Scope growth:** Scholarship search, golf recruiting, and calendar automation can expand the project substantially. Keep them outside the first usable release.
- **Sensitive data:** College planning can tempt users to store financial-aid and identity documents. The MVP should deliberately avoid collecting highly sensitive information.

### Decisions already made

- Product name: **CollegePath Family**.
- Delivery: private family web application.
- Source control: GitHub.
- Hosting target: Vercel.
- Database and authentication: Supabase.
- Initial framework: Next.js + TypeScript.
- Styling: Tailwind CSS.
- Intended users: two parents and two student users.
- Initial hosting goal: free tiers where practical.
- Scholarship opportunity and each student's scholarship application are separate records.
- College and application planning are the first priority; golf recruiting and automation are later enhancements.

### Open decisions to confirm during implementation

- Exact parent-versus-student create/edit/delete permissions.
- Whether students may see all family scholarship and award information or only their own.
- Whether students can invite or manage any other users (default: no).
- Whether the app should support email/password only initially or also Google sign-in.
- Whether a custom domain is desired.
- Whether the family wants a manual CSV export in the first production release.
- Whether golf recruiting should be a dedicated module or a set of student activities/tasks.

---

## 12. Product principles

1. **Family coordination first:** Make it easy to know who is doing what and when.
2. **Student-centered:** Each student's path is distinct; do not assume both students have the same goals or timeline.
3. **Practical over flashy:** Favor clarity, speed, and useful reminders over decorative features.
4. **Privacy by design:** Collect the minimum information necessary and enforce access in the database.
5. **No false certainty:** Keep estimates, pending decisions, and confirmed awards clearly separate.
6. **Incremental delivery:** Ship a secure, useful core before adding automation or specialized workflows.
