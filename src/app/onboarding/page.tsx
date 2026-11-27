import { GraduationCap } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ActionForm, SelectField, TextField } from "@/components/forms";
import { SetupRequired } from "@/components/setup-required";
import { getFamilyContext, requireUser } from "@/lib/auth";
import { TIME_ZONES } from "@/lib/options";
import { supabaseReady } from "@/lib/supabase/ready";
import { createFamily } from "./actions";

export const metadata: Metadata = { title: "Set up your family · CollegePath Family" };

export default async function OnboardingPage() {
  if (!(await supabaseReady())) return <SetupRequired />;
  const user = await requireUser();
  if (await getFamilyContext()) redirect("/dashboard");
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-line bg-white p-6 shadow-sm md:p-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy text-white">
          <GraduationCap size={22} aria-hidden />
        </div>
        <h1 className="mt-4 text-xl font-semibold">Create your family workspace</h1>
        <p className="mt-1 text-sm text-slate-500">
          You&apos;ll be the first parent administrator. Next you can add student profiles and
          invite the rest of the family.
        </p>
        <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
          Joining an existing family? Open the invitation link you were sent instead — signed in as{" "}
          <strong>{user.email}</strong>.
        </p>
        <div className="mt-6">
          <ActionForm action={createFamily} submitLabel="Create workspace" pendingLabel="Creating…">
            <TextField
              name="family_name"
              label="Family workspace name"
              placeholder="e.g. The Rivera Family"
              required
            />
            <TextField name="display_name" label="Your name" autoComplete="name" required />
            <SelectField
              name="time_zone"
              label="Time zone"
              options={TIME_ZONES}
              defaultValue="America/New_York"
              hint="Used to decide which deadlines are due today."
              required
            />
          </ActionForm>
        </div>
        <form action="/auth/signout" method="post" className="mt-6">
          <button type="submit" className="text-sm text-slate-500 hover:underline">
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
