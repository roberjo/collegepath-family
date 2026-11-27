import type { Metadata } from "next";
import { Card, Notice, PageHeader } from "@/components/ui";
import { requireParent } from "@/lib/auth";
import { createAward } from "../actions";
import { AwardForm } from "../award-form";
import { awardFormOptions } from "../form-data";

export const metadata: Metadata = { title: "Record award · CollegePath Family" };

export default async function NewAwardPage({
  searchParams,
}: {
  searchParams: Promise<{
    student?: string;
    scholarship_application?: string;
    name?: string;
    amount?: string;
  }>;
}) {
  const params = await searchParams;
  const ctx = await requireParent();
  const options = await awardFormOptions(ctx);
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Record a confirmed award" />
      <Notice>
        Only record aid that has been confirmed in writing. Pending applications and estimates stay
        on the Scholarships page.
      </Notice>
      <Card>
        <AwardForm
          action={createAward}
          defaults={{
            student_id: params.student,
            award_name: params.name,
            amount: params.amount,
            scholarship_application_id: params.scholarship_application,
          }}
          {...options}
        />
      </Card>
    </div>
  );
}
