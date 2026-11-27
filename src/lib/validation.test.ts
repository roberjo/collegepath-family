import { describe, expect, it } from "vitest";
import { z } from "zod";
import { parseForm, dbErrorMessage } from "./actions";
import {
  checkbox,
  email,
  isValidTimeZone,
  optionalDate,
  optionalMoney,
  optionalText,
  optionalUrl,
  requiredText,
} from "./validation";

function form(values: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(values)) fd.set(k, v);
  return fd;
}

describe("validation", () => {
  const schema = z.object({
    name: requiredText("Name", 10),
    notes: optionalText(),
    url: optionalUrl(),
    cost: optionalMoney(),
    due: optionalDate(),
    renewable: checkbox(),
  });

  it("normalises blank optional values to null", () => {
    const result = parseForm(
      schema,
      form({ name: " Ada ", notes: "  ", url: "", cost: "", due: "" }),
    );
    expect(result).toEqual({
      ok: true,
      data: { name: "Ada", notes: null, url: null, cost: null, due: null, renewable: false },
    });
  });

  it("parses money, dates, urls, and checkboxes", () => {
    const result = parseForm(
      schema,
      form({
        name: "Ada",
        url: "https://example.edu",
        cost: "$45,000",
        due: "2026-12-01",
        renewable: "on",
      }),
    );
    expect(result.ok && result.data).toMatchObject({
      url: "https://example.edu",
      cost: 45000,
      due: "2026-12-01",
      renewable: true,
    });
  });

  it("reports field errors and echoes values", () => {
    const result = parseForm(
      schema,
      form({ name: "", url: "javascript:alert(1)", cost: "-5", due: "2026-02-31" }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.state.fieldErrors ?? {})).toEqual(["name", "url", "cost", "due"]);
    expect(result.state.values?.url).toBe("javascript:alert(1)");
  });

  it("normalises email and validates time zones", () => {
    expect(email().parse("  Parent@Example.COM ")).toBe("parent@example.com");
    expect(email().safeParse("nope").success).toBe(false);
    expect(isValidTimeZone("America/Denver")).toBe(true);
    expect(isValidTimeZone("Mars/Base")).toBe(false);
  });

  it("maps database errors to friendly messages", () => {
    expect(dbErrorMessage({ code: "23505", message: "duplicate" })).toBe("That already exists.");
    expect(dbErrorMessage({ code: "P0001", message: "This invitation has expired" })).toBe(
      "This invitation has expired",
    );
    expect(
      dbErrorMessage({ code: "42501", message: "new row violates row-level security policy" }),
    ).toBe("You don't have permission to do that.");
  });
});
