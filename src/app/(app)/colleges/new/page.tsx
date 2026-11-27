import type { Metadata } from "next";
import { Card, PageHeader } from "@/components/ui";
import { requireFamily } from "@/lib/auth";
import { createCollege } from "../actions";
import { CollegeForm } from "../college-form";

export const metadata: Metadata = { title: "Add college · CollegePath Family" };

export default async function NewCollegePage() {
  const ctx = await requireFamily();
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Add a college"
        description={
          ctx.studentId
            ? "Colleges are shared with the family. This one will also be added to your list."
            : "Colleges are shared across the family; mark which students are interested afterwards."
        }
      />
      <Card>
        <CollegeForm action={createCollege} cancelHref="/colleges" />
      </Card>
    </div>
  );
}
