import {
  ActionForm,
  FieldRow,
  SelectField,
  TextAreaField,
  TextField,
  type Option,
} from "@/components/forms";
import { LinkButton } from "@/components/ui";
import type { ActionState } from "@/lib/actions";
import { APPLICATION_STATUSES, APPLICATION_TYPES } from "@/lib/options";
import type { Application } from "@/lib/types";

export function ApplicationForm({
  action,
  application,
  defaults,
  students,
  colleges,
  cancelHref,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  application?: Application;
  defaults?: { student_id?: string; college_id?: string };
  students: Option[];
  colleges: Option[];
  cancelHref: string;
}) {
  return (
    <ActionForm
      action={action}
      submitLabel={application ? "Save changes" : "Create application"}
      secondary={
        <LinkButton href={cancelHref} variant="secondary">
          Cancel
        </LinkButton>
      }
    >
      <FieldRow>
        <SelectField
          name="student_id"
          label="Student"
          options={students}
          defaultValue={application?.student_id ?? defaults?.student_id}
          placeholder="Choose a student"
          required
        />
        <SelectField
          name="college_id"
          label="College"
          options={colleges}
          defaultValue={application?.college_id ?? defaults?.college_id}
          placeholder="Choose a college"
          hint="Add new colleges on the Colleges page first."
          required
        />
      </FieldRow>
      <FieldRow>
        <SelectField
          name="application_type"
          label="Application round"
          options={APPLICATION_TYPES}
          defaultValue={application?.application_type ?? "undergraduate"}
          required
        />
        <SelectField
          name="status"
          label="Status"
          options={APPLICATION_STATUSES}
          defaultValue={application?.status ?? "not_started"}
          required
        />
      </FieldRow>
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField
          name="application_deadline"
          label="Deadline"
          type="date"
          defaultValue={application?.application_deadline}
        />
        <TextField
          name="submitted_on"
          label="Submitted on"
          type="date"
          defaultValue={application?.submitted_on}
        />
        <TextField
          name="decision_date"
          label="Decision expected / received"
          type="date"
          defaultValue={application?.decision_date}
        />
      </div>
      <TextField
        name="portal_url"
        label="Application portal"
        type="url"
        inputMode="url"
        placeholder="https://"
        defaultValue={application?.portal_url}
        hint="A link only — never store portal passwords here."
      />
      <TextAreaField name="notes" label="Notes" defaultValue={application?.notes} rows={4} />
    </ActionForm>
  );
}
