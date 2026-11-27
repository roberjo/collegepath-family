import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, PageHeader } from "@/components/ui";
import { requireFamily } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { College } from "@/lib/types";
import { updateCollege } from "../../actions";
import { CollegeForm } from "../../college-form";

export const metadata: Metadata = { title: "Edit college · CollegePath Family" };

export default async function EditCollegePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireFamily();
  const supabase = await createClient();
  const { data } = await supabase
    .from("colleges")
    .select("*")
    .eq("id", id)
    .eq("family_id", ctx.family.id)
    .maybeSingle();
  if (!data) notFound();
  const college = data as College;
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title={`Edit ${college.name}`} />
      <Card>
        <CollegeForm
          action={updateCollege.bind(null, id)}
          college={college}
          cancelHref={`/colleges/${id}`}
        />
      </Card>
    </div>
  );
}
