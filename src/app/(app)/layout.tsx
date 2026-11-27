import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { SetupRequired } from "@/components/setup-required";
import { requireFamily } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/options";
import { supabaseReady } from "@/lib/supabase/ready";

export default async function AppLayout({ children }: { children: ReactNode }) {
  if (!(await supabaseReady())) return <SetupRequired />;
  const ctx = await requireFamily();
  return (
    <AppShell
      familyName={ctx.family.name}
      memberName={ctx.member.display_name}
      roleLabel={ROLE_LABEL[ctx.member.role]}
    >
      {children}
    </AppShell>
  );
}
