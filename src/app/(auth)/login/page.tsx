import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm, TextField } from "@/components/forms";
import { Notice } from "@/components/ui";
import { signIn } from "../actions";

export const metadata: Metadata = { title: "Sign in · CollegePath Family" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const signupHref = next ? `/signup?next=${encodeURIComponent(next)}` : "/signup";
  return (
    <>
      <h1 className="text-xl font-semibold">Sign in</h1>
      <p className="mt-1 text-sm text-slate-500">Welcome back to your family workspace.</p>
      <div className="mt-6 space-y-4">
        {error && (
          <Notice tone="red">
            That link is invalid or has expired. Please sign in or request a new link.
          </Notice>
        )}
        <ActionForm action={signIn} submitLabel="Sign in" pendingLabel="Signing in…">
          <input type="hidden" name="next" value={next ?? ""} />
          <TextField name="email" label="Email" type="email" autoComplete="email" required />
          <TextField
            name="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            required
          />
        </ActionForm>
      </div>
      <div className="mt-6 flex flex-wrap justify-between gap-2 text-sm">
        <Link href="/forgot-password" className="text-teal hover:underline">
          Forgot password?
        </Link>
        <Link href={signupHref} className="text-teal hover:underline">
          Create an account
        </Link>
      </div>
    </>
  );
}
