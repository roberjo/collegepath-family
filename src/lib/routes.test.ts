import { describe, expect, it } from "vitest";
import { isAuthEntryPath, isPublicPath, safeNextPath } from "./routes";

describe("routes", () => {
  it("identifies public paths", () => {
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/invite/abc")).toBe(true);
    expect(isPublicPath("/auth/callback")).toBe(true);
    expect(isPublicPath("/dashboard")).toBe(false);
    expect(isPublicPath("/loginx")).toBe(false);
    expect(isAuthEntryPath("/signup")).toBe(true);
    expect(isAuthEntryPath("/invite/abc")).toBe(false);
  });

  it("rejects open redirects", () => {
    expect(safeNextPath("/students/1")).toBe("/students/1");
    expect(safeNextPath("//evil.example")).toBe("/dashboard");
    expect(safeNextPath("/\\evil.example")).toBe("/dashboard");
    expect(safeNextPath("https://evil.example")).toBe("/dashboard");
    expect(safeNextPath(null, "/onboarding")).toBe("/onboarding");
  });
});
