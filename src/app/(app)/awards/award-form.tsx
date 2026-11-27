import {
  ActionForm,
  CheckboxField,
  FieldRow,
  SelectField,
  TextAreaField,
  TextField,
  type Option,
} from "@/components/forms";
import { LinkButton } from "@/components/ui";
import type { ActionState } from "@/lib/actions";
import { AWARD_TYPES } from "@/lib/options";
import type { Award } from "@/lib/types";

export function AwardForm({
  action,
  award,
  defaults,
  students,
  colleges,
  scholarshipApplications,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  award?: Award;
  defaults?: Partial<
    Record<"student_id" | "award_name" | "amount" | "scholarship_application_id", string>
  >;
  students: Option[];
  colleges: Option[];
  scholarshipApplications: Option[];
}) {
  return (
    <ActionForm
      action={action}
      submitLabel={award ? "Save changes" : "Record award"}
      secondary={
        <LinkButton href="/awards" variant="secondary">
          Cancel
        </LinkButton>
      }
    >
      <FieldRow>
        <SelectField
          name="student_id"
          label="Student"
          options={students}
          defaultValue={award?.student_id ?? defaults?.student_id}
          placeholder="Choose a student"
          required
        />
        <SelectField
          name="award_type"
          label="Type"
          options={AWARD_TYPES}
          defaultValue={award?.award_type ?? "scholarship"}
          required
        />
      </FieldRow>
      <TextField
        name="award_name"
        label="Award name"
        defaultValue={award?.award_name ?? defaults?.award_name}
        required
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          name="amount"
          label="Confirmed amount (USD)"
          inputMode="decimal"
          defaultValue={award?.amount ?? defaults?.amount}
          hint="Per year if renewable."
          required
        />
        <TextField
          name="academic_year"
          label="Academic year"
          placeholder="2028-29"
          defaultValue={award?.academic_year}
        />
      </div>
      <CheckboxField name="is_renewable" label="Renewable" defaultChecked={award?.is_renewable} />
      <FieldRow>
        <SelectField
          name="college_id"
          label="College (for college aid)"
          options={colleges}
          defaultValue={award?.college_id}
          placeholder="Not college-specific"
        />
        <SelectField
          name="scholarship_application_id"
          label="Linked scholarship"
          options={scholarshipApplications}
          defaultValue={award?.scholarship_application_id ?? defaults?.scholarship_application_id}
          placeholder="None"
          hint="Must be the same student's scholarship."
        />
      </FieldRow>
      <TextAreaField name="notes" label="Notes" defaultValue={award?.notes} rows={2} />
    </ActionForm>
  );
}
