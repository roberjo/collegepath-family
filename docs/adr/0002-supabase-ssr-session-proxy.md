# ADR 0002: Supabase SSR sessions via the Next.js 16 proxy

- **Status:** Accepted
- **Date:** 2026-11-27

## Context

Supabase Auth stores the session in cookies. With `@supabase/ssr`, Server Components can read
cookies but cannot write them, so an expired access token must be refreshed somewhere that can set
cookies on the response. Next.js 16 renamed `middleware.ts` to `proxy.ts`.

The foundation commit placed `proxy.ts` at the repository root. Because the application lives in
`src/app`, Next.js only discovers the proxy at `src/proxy.ts`; at the root it was silently ignored
(the production build listed no proxy).

## Decision

- The proxy lives at `src/proxy.ts`.
- On every non-static request it calls `supabase.auth.getClaims()`, which validates the JWT and
  refreshes the session cookies when needed.
- Once sign-in exists (Phase 1), the proxy also performs coarse routing: unauthenticated requests to app routes are redirected to
  `/login?next=…`. It is **not** the authorization boundary — every protected page and server
  action re-checks the user server-side, and PostgreSQL RLS is the final enforcement layer.
- The app uses the publishable (anon) key only. No service-role key exists in the application.

## Consequences

- Sessions stay fresh for Server Components and Server Actions.
- A misconfigured matcher cannot expose data, because data access is gated by RLS.
