/** Routes reachable without a session. Everything else requires sign-in. */
const PUBLIC_PAGES = ["/login", "/signup", "/forgot-password", "/api/health"];
const PUBLIC_PREFIXES = ["/auth/", "/invite/"];

export function isPublicPath(pathname: string): boolean {
  return (
    PUBLIC_PAGES.includes(pathname) || PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}

/** Pages a signed-in user should skip past. */
export function isAuthEntryPath(pathname: string): boolean {
  return pathname === "/login" || pathname === "/signup" || pathname === "/forgot-password";
}

/**
 * Only allow same-site relative redirects ("/students", not "//evil.com" or
 * "https://evil.com") so ?next= cannot be used as an open redirect.
 */
export function safeNextPath(next: string | null | undefined, fallback = "/dashboard"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  return next;
}
