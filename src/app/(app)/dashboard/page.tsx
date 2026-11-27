import { CheckCircle2, Circle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Card, Notice, PageHeader } from "@/components/ui";
import { requireFamily } from "@/lib/auth";
import { formatLongDate, greeting, todayInZone } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Overview · CollegePath Family" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const ctx = await requireFamily();
  const supabase = await createClient();
  const tz = ctx.family.time_zone;
  const today = todayInZone(tz);

  const countOf = (table: string) =>
    supabase
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq("family_id", ctx.family.id)
      .then((r) => r.count ?? 0);

  const [memberCount, inviteCount, studentCount, collegeCount] = await Promise.all([
    supabase
      .from("family_members")
      .select("id", { count: "exact", head: true })
      .eq("family_id", ctx.family.id)
      .eq("status", "active")
      .then((r) => r.count ?? 0),
    ctx.isParent ? countOf("family_invitations") : Promise.resolve(0),
    countOf("students"),
    countOf("colleges"),
  ]);

  const steps = [
    { done: true, label: "Create the family workspace" },
    { done: studentCount > 0, label: "Add a profile for each student", href: "/students/new" },
    {
      done: memberCount > 1 || inviteCount > 0,
      label: "Invite the other parent and the students",
      href: "/settings",
    },
    { done: collegeCount > 0, label: "Start the college list", href: "/colleges/new" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={formatLongDate(today)}
        title={`${greeting(tz)}, ${ctx.member.display_name.split(" ")[0]}`}
        description="Here's what's happening across your family's college plans."
      />
      {params.welcome && <Notice>Your family workspace is ready.</Notice>}
      {params.joined && <Notice>Welcome to {ctx.family.name}!</Notice>}
      {params.password && <Notice>Your password has been updated.</Notice>}
      {params.denied && (
        <Notice tone="amber">That page is only available to parent administrators.</Notice>
      )}

      {ctx.isParent && steps.some((s) => !s.done) && (
        <Card title="Getting started" description="A few steps to set up your workspace.">
          <ol className="space-y-3">
            {steps.map((step) => (
              <li key={step.label} className="flex items-center gap-3 text-sm">
                {step.done ? (
                  <CheckCircle2 size={18} className="text-teal" aria-label="Done" />
                ) : (
                  <Circle size={18} className="text-slate-300" aria-label="Not done" />
                )}
                {step.href && !step.done ? (
                  <Link href={step.href} className="text-teal hover:underline">
                    {step.label}
                  </Link>
                ) : (
                  <span className={step.done ? "text-slate-500 line-through" : "text-slate-700"}>
                    {step.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </Card>
      )}
    </div>
  );
}
