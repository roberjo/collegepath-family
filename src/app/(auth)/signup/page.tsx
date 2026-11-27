import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm, TextField } from "@/components/forms";
import { signUp } from "../actions";

export const metadata: Metadata = { title: "Create account · CollegePath Family" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : "/login";
  const invited = next?.startsWith("/invite/");
  return (
    <>
      <h1 className="text-xl font-semibold">Create your account</h1>
      <p className="mt-1 text-sm text-slate-500">
        {invited
          ? "Use the email address your invitation was sent to."
          : "Each family member signs in with their own account."}
      </p>
      <div className="mt-6">
        <ActionForm action={signUp} submitLabel="Create account" pendingLabel="Creating…">
          <input type="hidden" name="next" value={next ?? ""} />
          <TextField name="email" label="Email" type="email" autoComplete="email" required />
          <TextField
            name="password"
            label="Password"
            type="password"
            autoComplete="new-password"
            hint="At least 8 characters."
            required
          />
          <TextField
            name="confirm"
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            required
          />
        </ActionForm>
      </div>
      <p className="mt-6 text-sm text-slate-600">
        Already have an account?{" "}
        <Link href={loginHref} className="text-teal hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
