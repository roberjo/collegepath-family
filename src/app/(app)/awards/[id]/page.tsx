import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConfirmAction } from "@/components/forms";
import { Card, PageHeader } from "@/components/ui";
import { requireParent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Award } from "@/lib/types";
import { deleteAward, updateAward } from "../actions";
import { AwardForm } from "../award-form";
import { awardFormOptions } from "../form-data";

export const metadata: Metadata = { title: "Edit award · CollegePath Family" };

export default async function EditAwardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireParent();
  const supabase = await createClient();
  const [{ data }, options] = await Promise.all([
    supabase.from("awards").select("*").eq("id", id).eq("family_id", ctx.family.id).maybeSingle(),
    awardFormOptions(ctx),
  ]);
  if (!data) notFound();
  const award = data as Award;
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title={`Edit ${award.award_name}`} />
      <Card>
        <AwardForm action={updateAward.bind(null, id)} award={award} {...options} />
      </Card>
      <Card title="Delete award">
        <ConfirmAction
          action={deleteAward}
          fields={{ id }}
          label="Delete award"
          confirmLabel="Delete"
          prompt="This cannot be undone."
        />
      </Card>
    </div>
  );
}
