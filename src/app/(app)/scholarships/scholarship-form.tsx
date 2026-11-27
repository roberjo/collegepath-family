import { ActionForm, CheckboxField, FieldRow, TextAreaField, TextField } from "@/components/forms";
import { LinkButton } from "@/components/ui";
import type { ActionState } from "@/lib/actions";
import type { Scholarship } from "@/lib/types";

export function ScholarshipForm({
  action,
  scholarship,
  cancelHref,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  scholarship?: Scholarship;
  cancelHref: string;
}) {
  return (
    <ActionForm
      action={action}
      submitLabel={scholarship ? "Save changes" : "Add scholarship"}
      secondary={
        <LinkButton href={cancelHref} variant="secondary">
          Cancel
        </LinkButton>
      }
    >
      <FieldRow>
        <TextField name="name" label="Scholarship name" defaultValue={scholarship?.name} required />
        <TextField name="sponsor" label="Sponsor" defaultValue={scholarship?.sponsor} />
      </FieldRow>
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField
          name="award_amount"
          label="Amount (USD)"
          inputMode="decimal"
          defaultValue={scholarship?.award_amount}
          hint="Advertised amount, if known."
        />
        <TextField name="opens_on" label="Opens" type="date" defaultValue={scholarship?.opens_on} />
        <TextField
          name="deadline"
          label="Deadline"
          type="date"
          defaultValue={scholarship?.deadline}
        />
      </div>
      <CheckboxField
        name="renewable"
        label="Renewable"
        defaultChecked={scholarship?.renewable}
        hint="Can be received again in later years."
      />
      <FieldRow>
        <TextField
          name="application_url"
          label="Application link"
          type="url"
          inputMode="url"
          placeholder="https://"
          defaultValue={scholarship?.application_url}
        />
        <TextField
          name="source_url"
          label="Where we found it"
          type="url"
          inputMode="url"
          placeholder="https://"
          defaultValue={scholarship?.source_url}
        />
      </FieldRow>
      <TextAreaField
        name="eligibility_notes"
        label="Eligibility"
        defaultValue={scholarship?.eligibility_notes}
        rows={3}
      />
      <TextAreaField
        name="description"
        label="Description and notes"
        defaultValue={scholarship?.description}
        rows={3}
      />
    </ActionForm>
  );
}
