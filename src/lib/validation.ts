import { z } from "zod";
import { isIsoDate } from "./dates";

/** Form inputs arrive as strings; blank means "not provided". */
const blankToNull = (v: unknown) =>
  v === undefined || v === null || (typeof v === "string" && v.trim() === "") ? null : v;

export const requiredText = (label: string, max = 200) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be ${max} characters or fewer`);

export const optionalText = (max = 2000) =>
  z.preprocess(
    blankToNull,
    z.string().trim().max(max, `Must be ${max} characters or fewer`).nullable(),
  );

export const optionalUrl = () =>
  z.preprocess(
    blankToNull,
    z
      .string()
      .trim()
      .max(2000)
      .refine((v) => {
        try {
          const url = new URL(v);
          return url.protocol === "https:" || url.protocol === "http:";
        } catch {
          return false;
        }
      }, "Enter a full web address starting with https://")
      .nullable(),
  );

export const optionalMoney = () =>
  z.preprocess(
    (v) => {
      const b = blankToNull(v);
      return typeof b === "string" ? Number(b.replace(/[$,\s]/g, "")) : b;
    },
    z
      .number({ error: "Enter an amount in dollars" })
      .finite("Enter an amount in dollars")
      .min(0, "Amount cannot be negative")
      .max(10_000_000, "Amount is too large")
      .nullable(),
  );

export const requiredMoney = (label: string) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() !== "" ? Number(v.replace(/[$,\s]/g, "")) : v),
    z
      .number({ error: `${label} is required` })
      .finite(`${label} must be a number`)
      .min(0, `${label} cannot be negative`)
      .max(10_000_000, `${label} is too large`),
  );

export const optionalDate = () =>
  z.preprocess(blankToNull, z.string().refine(isIsoDate, "Enter a valid date").nullable());

export const optionalUuid = () => z.preprocess(blankToNull, z.uuid("Invalid selection").nullable());

export const requiredUuid = (label: string) => z.uuid({ error: `Choose a ${label.toLowerCase()}` });

export const checkbox = () =>
  z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());

export function enumField<T extends readonly [string, ...string[]]>(values: T, label: string) {
  return z.enum(values, { error: `Choose a valid ${label.toLowerCase()}` });
}

export const email = () =>
  z
    .string({ error: "Email is required" })
    .trim()
    .toLowerCase()
    .pipe(z.email("Enter a valid email address"));

export const password = () =>
  z
    .string({ error: "Password is required" })
    .min(8, "Use at least 8 characters")
    .max(72, "Use 72 characters or fewer");

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export const timeZone = () => z.string().trim().refine(isValidTimeZone, "Choose a valid time zone");

/** Convert FormData to a plain object (last value wins for repeated keys). */
export function formToObject(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  formData.forEach((value, key) => {
    if (typeof value === "string" && !key.startsWith("$ACTION")) out[key] = value;
  });
  return out;
}
