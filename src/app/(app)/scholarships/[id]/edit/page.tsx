import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, PageHeader } from "@/components/ui";
import { requireFamily } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Scholarship } from "@/lib/types";
import { updateScholarship } from "../../actions";
import { ScholarshipForm } from "../../scholarship-form";

export const metadata: Metadata = { title: "Edit scholarship · CollegePath Family" };

export default async function EditScholarshipPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireFamily();
  const supabase = await createClient();
  const { data } = await supabase
    .from("scholarships")
    .select("*")
    .eq("id", id)
    .eq("family_id", ctx.family.id)
    .maybeSingle();
  if (!data) notFound();
  const scholarship = data as Scholarship;
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title={`Edit ${scholarship.name}`} />
      <Card>
        <ScholarshipForm
          action={updateScholarship.bind(null, id)}
          scholarship={scholarship}
          cancelHref={`/scholarships/${id}`}
        />
      </Card>
    </div>
  );
}
