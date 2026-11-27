import { ActionForm, FieldRow, TextAreaField, TextField } from "@/components/forms";
import { LinkButton } from "@/components/ui";
import type { ActionState } from "@/lib/actions";
import type { Student } from "@/lib/types";

export function StudentForm({
  action,
  student,
  cancelHref,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  student?: Student;
  cancelHref: string;
}) {
  return (
    <ActionForm
      action={action}
      submitLabel={student ? "Save changes" : "Add student"}
      secondary={
        <LinkButton href={cancelHref} variant="secondary">
          Cancel
        </LinkButton>
      }
    >
      <FieldRow>
        <TextField
          name="display_name"
          label="Name"
          defaultValue={student?.display_name}
          autoComplete="off"
          required
        />
        <TextField
          name="graduation_year"
          label="High school graduation year"
          type="number"
          inputMode="numeric"
          min={2026}
          max={2045}
          defaultValue={student?.graduation_year}
          required
        />
      </FieldRow>
      <FieldRow>
        <TextField name="school_name" label="High school" defaultValue={student?.school_name} />
        <TextField
          name="gpa"
          label="GPA (optional)"
          inputMode="decimal"
          defaultValue={student?.gpa}
          hint="Unweighted or weighted, up to 5.0."
        />
      </FieldRow>
      <TextField
        name="intended_major"
        label="Intended major or interests"
        defaultValue={student?.intended_major}
      />
      <TextAreaField
        name="notes"
        label="Notes"
        defaultValue={student?.notes}
        rows={4}
        hint="Goals, preferences, activities — no Social Security numbers or financial account details."
      />
    </ActionForm>
  );
}
