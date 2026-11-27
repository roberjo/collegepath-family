import type { PostgrestError } from "@supabase/supabase-js";
import type { z } from "zod";
import { formToObject } from "./validation";

/** Shape returned by every form server action (consumed by useActionState). */
export interface ActionState {
  error?: string;
  fieldErrors?: Record<string, string>;
  message?: string;
  /** Echo of submitted values so the form keeps them after a failed submit. */
  values?: Record<string, string>;
  /** Arbitrary payload for successful actions that do not redirect. */
  result?: string;
}

export const initialActionState: ActionState = {};

type ParseResult<T> = { ok: true; data: T } | { ok: false; state: ActionState };

export function parseForm<S extends z.ZodType>(
  schema: S,
  formData: FormData,
): ParseResult<z.output<S>> {
  const values = formToObject(formData);
  const parsed = schema.safeParse(values);
  if (parsed.success) return { ok: true, data: parsed.data };
  const fieldErrors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return {
    ok: false,
    state: { error: "Please correct the highlighted fields.", fieldErrors, values },
  };
}

/** Translate database errors into messages safe and useful for family members. */
export function dbErrorMessage(error: PostgrestError | { code?: string; message: string }): string {
  switch (error.code) {
    case "23505":
      return "That already exists.";
    case "23503":
      return "That refers to something that no longer exists, or belongs to another family.";
    case "23514":
      return "One of the values is not allowed.";
    case "42501":
      return "You don't have permission to do that.";
    case "P0001":
      // Messages raised deliberately by our SQL functions/triggers.
      return error.message;
    default:
      if (/row-level security/i.test(error.message)) return "You don't have permission to do that.";
      console.error("Database error", error);
      return "Something went wrong. Please try again.";
  }
}

export function failure(error: PostgrestError, values?: Record<string, string>): ActionState {
  return { error: dbErrorMessage(error), values };
}
