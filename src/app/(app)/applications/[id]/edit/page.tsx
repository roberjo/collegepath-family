import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, PageHeader } from "@/components/ui";
import { requireFamily } from "@/lib/auth";
import { getColleges, getStudentOptions } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { Application } from "@/lib/types";
import { updateApplication } from "../../actions";
import { ApplicationForm } from "../../application-form";

export const metadata: Metadata = { title: "Edit application · CollegePath Family" };

export default async function EditApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireFamily();
  const supabase = await createClient();
  const [{ data }, students, colleges] = await Promise.all([
    supabase
      .from("applications")
      .select("*")
      .eq("id", id)
      .eq("family_id", ctx.family.id)
      .maybeSingle(),
    getStudentOptions(ctx),
    getColleges(ctx.family.id, true),
  ]);
  if (!data) notFound();
  const application = data as Application;
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Edit application" />
      <Card>
        <ApplicationForm
          action={updateApplication.bind(null, id)}
          application={application}
          students={students}
          colleges={colleges
            .filter((c) => !c.archived_at || c.id === application.college_id)
            .map((c) => ({ value: c.id, label: c.name }))}
          cancelHref={`/applications/${id}`}
        />
      </Card>
    </div>
  );
}
