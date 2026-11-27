"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { parseForm, type ActionState } from "@/lib/actions";
import { safeNextPath } from "@/lib/routes";
import { getOrigin } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import { email, password } from "@/lib/validation";

const signInSchema = z.object({
  email: email(),
  password: z.string().min(1, "Password is required"),
  next: z.string().optional(),
});

export async function signIn(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseForm(signInSchema, formData);
  if (!parsed.ok) return parsed.state;
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) {
    const unconfirmed = error.code === "email_not_confirmed";
    return {
      error: unconfirmed
        ? "Please confirm your email address first — check your inbox for the link."
        : "Email or password is incorrect.",
      values: { email: parsed.data.email, next: parsed.data.next ?? "" },
    };
  }
  redirect(safeNextPath(parsed.data.next));
}

const signUpSchema = z
  .object({
    email: email(),
    password: password(),
    confirm: z.string(),
    next: z.string().optional(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "Passwords do not match",
  });

export async function signUp(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseForm(signUpSchema, formData);
  if (!parsed.ok) return parsed.state;
  const next = safeNextPath(parsed.data.next, "/onboarding");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${await getOrigin()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) {
    return {
      error:
        error.code === "weak_password"
          ? "Choose a stronger password."
          : "We couldn't create that account. Please try again.",
      values: { email: parsed.data.email, next: parsed.data.next ?? "" },
    };
  }
  if (data.session) redirect(next);
  // Same response whether or not the email already has an account (no enumeration).
  return {
    message: `Check ${parsed.data.email} for a confirmation link to finish creating your account.`,
  };
}

const resetSchema = z.object({ email: email() });

export async function requestPasswordReset(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseForm(resetSchema, formData);
  if (!parsed.ok) return parsed.state;
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${await getOrigin()}/auth/callback?next=/reset-password`,
  });
  return {
    message: "If an account exists for that address, a password reset link is on its way.",
  };
}

const newPasswordSchema = z
  .object({ password: password(), confirm: z.string() })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "Passwords do not match",
  });

export async function updatePassword(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseForm(newPasswordSchema, formData);
  if (!parsed.ok) return parsed.state;
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return {
      error:
        error.code === "same_password"
          ? "Choose a password different from your current one."
          : "We couldn't update your password. Request a new reset link and try again.",
    };
  }
  redirect("/dashboard?password=updated");
}
