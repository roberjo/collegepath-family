import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm, TextField } from "@/components/forms";
import { requestPasswordReset } from "../actions";

export const metadata: Metadata = { title: "Reset password · CollegePath Family" };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="text-xl font-semibold">Reset your password</h1>
      <p className="mt-1 text-sm text-slate-500">
        Enter your email and we&apos;ll send you a link to choose a new password.
      </p>
      <div className="mt-6">
        <ActionForm
          action={requestPasswordReset}
          submitLabel="Send reset link"
          pendingLabel="Sending…"
        >
          <TextField name="email" label="Email" type="email" autoComplete="email" required />
        </ActionForm>
      </div>
      <p className="mt-6 text-sm">
        <Link href="/login" className="text-teal hover:underline">
          Back to sign in
        </Link>
      </p>
    </>
  );
}
