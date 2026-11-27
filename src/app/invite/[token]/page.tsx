import { GraduationCap } from "lucide-react";
import type { Metadata } from "next";
import { ActionForm, TextField } from "@/components/forms";
import { SetupRequired } from "@/components/setup-required";
import { LinkButton, Notice } from "@/components/ui";
import { getUser } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/options";
import { supabaseReady } from "@/lib/supabase/ready";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";
import { acceptInvitation } from "./actions";

export const metadata: Metadata = {
  title: "Family invitation · CollegePath Family",
  referrer: "no-referrer",
};

interface InvitationPreview {
  family_name: string;
  email: string;
  role: Role;
  display_name: string | null;
  status: "pending" | "accepted" | "expired" | "revoked";
}

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  if (!(await supabaseReady())) return <SetupRequired />;
  const { token } = await params;
  const supabase = await createClient();
  const [{ data }, user] = await Promise.all([
    supabase.rpc("get_invitation", { p_token: token }),
    getUser(),
  ]);
  const invite = (data as InvitationPreview[] | null)?.[0];
  const here = `/invite/${token}`;

  let body: React.ReactNode;
  if (!invite) {
    body = (
      <Notice tone="red">This invitation link is not valid. Ask a parent to send a new one.</Notice>
    );
  } else if (invite.status !== "pending") {
    body = (
      <Notice tone="amber">
        {invite.status === "accepted"
          ? "This invitation has already been used. Sign in to open your family workspace."
          : invite.status === "expired"
            ? "This invitation has expired. Ask a parent to send a new one."
            : "This invitation was cancelled. Ask a parent to send a new one."}
      </Notice>
    );
  } else if (!user) {
    body = (
      <div className="space-y-3">
        <p className="text-sm text-slate-600">
          Create an account or sign in with <strong>{invite.email}</strong> to accept.
        </p>
        <div className="flex flex-wrap gap-2">
          <LinkButton href={`/signup?next=${encodeURIComponent(here)}`}>Create account</LinkButton>
          <LinkButton href={`/login?next=${encodeURIComponent(here)}`} variant="secondary">
            Sign in
          </LinkButton>
        </div>
      </div>
    );
  } else if (user.email?.toLowerCase() !== invite.email) {
    body = (
      <div className="space-y-3">
        <Notice tone="amber">
          You&apos;re signed in as <strong>{user.email}</strong>, but this invitation is for{" "}
          <strong>{invite.email}</strong>. Sign out and sign in with the invited address.
        </Notice>
        <form action="/auth/signout" method="post">
          <button type="submit" className="text-sm text-teal hover:underline">
            Sign out
          </button>
        </form>
      </div>
    );
  } else {
    body = (
      <ActionForm
        action={acceptInvitation.bind(null, token)}
        submitLabel="Join family"
        pendingLabel="Joining…"
      >
        <TextField
          name="display_name"
          label="Your name as the family will see it"
          defaultValue={invite.display_name}
          autoComplete="name"
        />
      </ActionForm>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-sm md:p-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy text-white">
          <GraduationCap size={22} aria-hidden />
        </div>
        <h1 className="mt-4 text-xl font-semibold">
          {invite ? `Join ${invite.family_name}` : "Family invitation"}
        </h1>
        {invite && (
          <p className="mt-1 text-sm text-slate-500">
            You&apos;ve been invited to CollegePath Family as a{" "}
            {ROLE_LABEL[invite.role].toLowerCase()}.
          </p>
        )}
        <div className="mt-6">{body}</div>
      </div>
    </div>
  );
}
