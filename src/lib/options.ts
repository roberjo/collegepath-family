import type {
  ApplicationStatus,
  InterestLevel,
  OpportunityStatus,
  Role,
  TaskPriority,
  TaskStatus,
} from "./types";
import type { Tone } from "@/components/ui";

export interface LabeledOption<T extends string = string> {
  value: T;
  label: string;
  tone?: Tone;
}

export const TIME_ZONES: LabeledOption[] = [
  { value: "America/New_York", label: "Eastern (New York)" },
  { value: "America/Chicago", label: "Central (Chicago)" },
  { value: "America/Denver", label: "Mountain (Denver)" },
  { value: "America/Phoenix", label: "Arizona (Phoenix)" },
  { value: "America/Los_Angeles", label: "Pacific (Los Angeles)" },
  { value: "America/Anchorage", label: "Alaska (Anchorage)" },
  { value: "Pacific/Honolulu", label: "Hawaii (Honolulu)" },
  { value: "UTC", label: "UTC" },
];

export function timeZoneOptions(current?: string): LabeledOption[] {
  if (!current || TIME_ZONES.some((z) => z.value === current)) return TIME_ZONES;
  return [{ value: current, label: current }, ...TIME_ZONES];
}

export const ROLE_OPTIONS: LabeledOption<Role>[] = [
  { value: "parent", label: "Parent" },
  { value: "student", label: "Student" },
];

export const ROLE_LABEL: Record<Role, string> = {
  parent: "Parent administrator",
  student: "Student",
};

export const INTEREST_LEVELS: LabeledOption<InterestLevel>[] = [
  { value: "exploring", label: "Exploring", tone: "gray" },
  { value: "interested", label: "Interested", tone: "blue" },
  { value: "target", label: "Target", tone: "teal" },
  { value: "safety", label: "Safety", tone: "green" },
  { value: "top_choice", label: "Top choice", tone: "violet" },
];

export const APPLICATION_STATUSES: LabeledOption<ApplicationStatus>[] = [
  { value: "not_started", label: "Not started", tone: "gray" },
  { value: "researching", label: "Researching", tone: "gray" },
  { value: "in_progress", label: "In progress", tone: "blue" },
  { value: "submitted", label: "Submitted", tone: "teal" },
  { value: "accepted", label: "Accepted", tone: "green" },
  { value: "waitlisted", label: "Waitlisted", tone: "amber" },
  { value: "deferred", label: "Deferred", tone: "amber" },
  { value: "rejected", label: "Not admitted", tone: "red" },
  { value: "withdrawn", label: "Withdrawn", tone: "gray" },
];

export const APPLICATION_TYPES: LabeledOption[] = [
  { value: "undergraduate", label: "Regular decision" },
  { value: "early_action", label: "Early action" },
  { value: "early_decision", label: "Early decision" },
  { value: "rolling", label: "Rolling" },
  { value: "honors", label: "Honors program" },
  { value: "other", label: "Other" },
];

export const REQUIREMENT_TYPES: LabeledOption[] = [
  { value: "essay", label: "Essay" },
  { value: "recommendation", label: "Recommendation" },
  { value: "transcript", label: "Transcript" },
  { value: "test_score", label: "Test score" },
  { value: "form", label: "Form" },
  { value: "fee", label: "Fee / waiver" },
  { value: "interview", label: "Interview" },
  { value: "portfolio", label: "Portfolio / audition" },
  { value: "other", label: "Other" },
];

export const OPPORTUNITY_STATUSES: LabeledOption<OpportunityStatus>[] = [
  { value: "saved", label: "Saved", tone: "gray" },
  { value: "researching", label: "Researching", tone: "gray" },
  { value: "in_progress", label: "In progress", tone: "blue" },
  { value: "submitted", label: "Submitted", tone: "teal" },
  { value: "awarded", label: "Awarded", tone: "green" },
  { value: "not_awarded", label: "Not awarded", tone: "red" },
  { value: "declined", label: "Declined", tone: "gray" },
];

export const TASK_STATUSES: LabeledOption<TaskStatus>[] = [
  { value: "todo", label: "To do", tone: "gray" },
  { value: "in_progress", label: "In progress", tone: "blue" },
  { value: "done", label: "Done", tone: "green" },
  { value: "cancelled", label: "Cancelled", tone: "gray" },
];

export const TASK_PRIORITIES: LabeledOption<TaskPriority>[] = [
  { value: "low", label: "Low", tone: "gray" },
  { value: "normal", label: "Normal", tone: "blue" },
  { value: "high", label: "High", tone: "amber" },
  { value: "urgent", label: "Urgent", tone: "red" },
];

export const TASK_CATEGORIES: LabeledOption[] = [
  { value: "general", label: "General" },
  { value: "college_research", label: "College research" },
  { value: "application", label: "Application" },
  { value: "scholarship", label: "Scholarship" },
  { value: "financial_aid", label: "Financial aid" },
  { value: "testing", label: "Testing" },
  { value: "visit", label: "Campus visit" },
  { value: "other", label: "Other" },
];

export const AWARD_TYPES: LabeledOption[] = [
  { value: "scholarship", label: "Scholarship" },
  { value: "grant", label: "Grant" },
  { value: "merit", label: "Merit aid" },
  { value: "need_based", label: "Need-based aid" },
  { value: "work_study", label: "Work-study" },
  { value: "other", label: "Other" },
];

export function values<T extends string>(options: LabeledOption<T>[]): [T, ...T[]] {
  return options.map((o) => o.value) as [T, ...T[]];
}

export function labelFor<T extends string>(
  options: LabeledOption<T>[],
  value: T | null | undefined,
) {
  return options.find((o) => o.value === value)?.label ?? value ?? "—";
}

export function toneFor<T extends string>(options: LabeledOption<T>[], value: T): Tone {
  return options.find((o) => o.value === value)?.tone ?? "gray";
}
