# ADR 0005: Family invitations via single-use links

- **Status:** Accepted
- **Date:** 2026-11-27

## Context

Parents invite the second parent and both students (PRD §2). Invitations must be limited to the
intended family and person. Supabase's `inviteUserByEmail` requires the service-role key on the
server, and the MVP avoids paid email services and automated email (PRD §3).

## Decision

- A parent calls `create_invitation(family, email, role, student?, name?)`. The function generates
  a 256-bit random token, stores only its SHA-256 hash, and returns the raw token **once**. The app
  shows a copyable link `/invite/<token>` for the parent to send by text or email themselves.
- Invitations expire after 14 days, are single-use, can be cancelled, and a new invitation for the
  same email supersedes earlier pending ones.
- `get_invitation(token)` (callable anonymously) returns only family name, invited email, role, and
  status, so the landing page can explain what the person is joining.
- `accept_invitation(token, display_name)` requires a signed-in user whose **account email matches
  the invited email** (case-insensitive). It creates or reactivates the membership and links a
  student account to its student profile when the invitation specified one.
- The invite page sets `Referrer-Policy: no-referrer` so the token is not leaked to other sites.
- Sign-up uses normal Supabase email confirmation; the invite link is carried through `?next=`.

## Alternatives considered

- **Supabase `inviteUserByEmail`**: sends email automatically but needs the service-role key in the
  app and couples account creation to invitation. Rejected for the MVP.
- **Join codes**: simpler but not bound to a person; anyone holding the code could join.

## Consequences

- No secret keys in the app; Supabase's built-in email is used only for sign-up confirmation and
  password reset.
- A parent must deliver the link manually. Automated invitation email can be added later.
