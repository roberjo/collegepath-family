# ADR 0007: Application architecture — Server Components and Server Actions

- **Status:** Accepted
- **Date:** 2026-11-27

## Context

The PRD prefers server-side data access for protected pages and mutations. The app is small,
form-heavy CRUD used by four people.

## Decision

- **Reads:** async Server Components query Supabase with the user's session (RLS applies). There is
  no separate API layer.
- **Writes:** Server Actions validate `FormData` with Zod (`src/lib/validation.ts`), re-check the
  session/role (`requireFamily` / `requireParent` in `src/lib/auth.ts`), call Supabase, then
  `revalidatePath` / `redirect`. Database errors are mapped to friendly messages
  (`src/lib/actions.ts`); unexpected ones are logged server-side only.
- **Forms:** a small client component kit (`src/components/forms.tsx`) wraps `useActionState`:
  field-level errors, preserved input on failure, pending states, and two-step confirmation for
  destructive actions (no browser `confirm()` dialogs).
- **Routing:** `(auth)` group for sign-in pages, `(app)` group for the authenticated shell,
  `/onboarding` and `/invite/[token]` stand alone. `src/lib/nav.ts` lists implemented sections.
- **Types:** row interfaces in `src/lib/types.ts` mirror the migrations. Once a Supabase project is
  linked, `supabase gen types typescript` can replace them.
- **Current family:** a user may belong to several families in the data model; the MVP uses the
  earliest active membership. A family switcher can be added without schema changes.
- **Unconfigured environments** render a setup screen instead of crashing.

## Consequences

- Minimal client JavaScript; pages work on slow phones.
- No client-side Supabase writes, so there is one validation path.
