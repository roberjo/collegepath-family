/**
 * Row types for the tables the app reads. Hand-maintained to match
 * supabase/migrations; regenerate with `supabase gen types` once a project
 * is linked if they drift (see docs/adr/0007-application-architecture.md).
 */

export type Role = "parent" | "student";
export type MemberStatus = "active" | "removed";

export type ApplicationStatus =
  | "not_started"
  | "researching"
  | "in_progress"
  | "submitted"
  | "accepted"
  | "waitlisted"
  | "deferred"
  | "rejected"
  | "withdrawn";

export type OpportunityStatus =
  "saved" | "researching" | "in_progress" | "submitted" | "awarded" | "not_awarded" | "declined";

export type TaskStatus = "todo" | "in_progress" | "done" | "cancelled";
export type TaskPriority = "low" | "normal" | "high" | "urgent";
export type InterestLevel = "exploring" | "interested" | "target" | "safety" | "top_choice";

export interface Family {
  id: string;
  name: string;
  time_zone: string;
  created_at: string;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  role: Role;
  status: MemberStatus;
  display_name: string;
  email: string | null;
  student_id: string | null;
  created_at: string;
}

export interface FamilyInvitation {
  id: string;
  family_id: string;
  email: string;
  role: Role;
  student_id: string | null;
  display_name: string | null;
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

export interface Student {
  id: string;
  family_id: string;
  display_name: string;
  graduation_year: number;
  school_name: string | null;
  gpa: number | null;
  intended_major: string | null;
  notes: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface College {
  id: string;
  family_id: string;
  name: string;
  location: string | null;
  website_url: string | null;
  admissions_url: string | null;
  estimated_annual_cost: number | null;
  notes: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CollegeInterest {
  id: string;
  family_id: string;
  student_id: string;
  college_id: string;
  interest_level: InterestLevel;
  notes: string | null;
  created_at: string;
}

export interface Application {
  id: string;
  family_id: string;
  student_id: string;
  college_id: string;
  application_type: string;
  status: ApplicationStatus;
  application_deadline: string | null;
  submitted_on: string | null;
  decision_date: string | null;
  portal_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApplicationRequirement {
  id: string;
  family_id: string;
  application_id: string;
  title: string;
  requirement_type: string;
  due_date: string | null;
  is_complete: boolean;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface Scholarship {
  id: string;
  family_id: string;
  name: string;
  sponsor: string | null;
  description: string | null;
  award_amount: number | null;
  renewable: boolean;
  eligibility_notes: string | null;
  application_url: string | null;
  opens_on: string | null;
  deadline: string | null;
  source_url: string | null;
  archived_at: string | null;
  created_at: string;
}

export interface ScholarshipApplication {
  id: string;
  family_id: string;
  scholarship_id: string;
  student_id: string;
  status: OpportunityStatus;
  submitted_on: string | null;
  decision_date: string | null;
  awarded_amount: number | null;
  notes: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  family_id: string;
  student_id: string | null;
  title: string;
  description: string | null;
  category: string;
  due_date: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to: string | null;
  created_by: string | null;
  related_application_id: string | null;
  related_scholarship_application_id: string | null;
  created_at: string;
}

export interface Award {
  id: string;
  family_id: string;
  student_id: string;
  college_id: string | null;
  scholarship_application_id: string | null;
  award_name: string;
  award_type: string;
  amount: number;
  is_renewable: boolean;
  academic_year: string | null;
  notes: string | null;
  created_at: string;
}
