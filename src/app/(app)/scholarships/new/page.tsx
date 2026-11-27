import type { Metadata } from "next";
import { Card, PageHeader } from "@/components/ui";
import { requireFamily } from "@/lib/auth";
import { createScholarship } from "../actions";
import { ScholarshipForm } from "../scholarship-form";

export const metadata: Metadata = { title: "Add scholarship · CollegePath Family" };

export default async function NewScholarshipPage() {
  const ctx = await requireFamily();
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Add a scholarship"
        description={
          ctx.studentId
            ? "Scholarships are shared with the family. This one will also be tracked for you."
            : "Store each opportunity once, then track it separately for each student who applies."
        }
      />
      <Card>
        <ScholarshipForm action={createScholarship} cancelHref="/scholarships" />
      </Card>
    </div>
  );
}
