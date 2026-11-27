import type { Metadata } from "next";
import { ActionForm, TextField } from "@/components/forms";
import { requireUser } from "@/lib/auth";
import { updatePassword } from "../actions";

export const metadata: Metadata = { title: "Choose a new password · CollegePath Family" };

export default async function ResetPasswordPage() {
  await requireUser();
  return (
    <>
      <h1 className="text-xl font-semibold">Choose a new password</h1>
      <div className="mt-6">
        <ActionForm action={updatePassword} submitLabel="Update password" pendingLabel="Updating…">
          <TextField
            name="password"
            label="New password"
            type="password"
            autoComplete="new-password"
            hint="At least 8 characters."
            required
          />
          <TextField
            name="confirm"
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            required
          />
        </ActionForm>
      </div>
    </>
  );
}
