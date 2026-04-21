/* ══════════════════════════════════════════════════
   SHARED TYPES
   ══════════════════════════════════════════════════ */

export type AttendanceState = "pending" | "present" | "late" | "absent";
export type AttendanceWorkflowStatus = "pending" | "saved" | "submitted";
export type SyllabusStatus = "planned" | "live" | "complete";
export type StudentPace = "Steady" | "Fast Track" | "Needs Support";
export type StudentGender = "Male" | "Female" | "Other";
export type ChipTone = "success" | "warning" | "danger" | "neutral" | "info";

export interface ScheduledClass {
  id: string;
  date: string;
  time: string;
  track: string;
  coach: string;
  topic: string;
  attendanceStatus?: AttendanceWorkflowStatus;
  attendanceSavedAt?: string;
  attendanceSubmittedAt?: string;
}

export interface StudentRecord {
  id: string;
  name: string;
  age: string;
  dateOfBirth?: string;
  gender?: StudentGender;
  guardian: string;
  guardianPhone?: string;
  guardianEmail?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  medicalNotes?: string;
  experience?: string;
  pace: StudentPace;
  notes: string;
  attendance: Record<string, AttendanceState>;
  status?: "active" | "withdrawn";
  enrolledAt?: string;
}

export interface SyllabusItem {
  id: string;
  weekLabel: string;
  title: string;
  objective: string;
  status: SyllabusStatus;
}

export interface ReportEntry {
  id: string;
  studentId: string;
  title: string;
  summary: string;
  recommendation: string;
  weekLabel?: string;
  grade?: string;
  remark?: string;
  skillChecks?: Record<string, boolean>;
  createdAt: string;
}

export interface AnnouncementEntry {
  id: string;
  title: string;
  message: string;
  classId?: string;
  createdAt: string;
  pinned?: boolean;
  expiresAt?: string;
  broadcastId?: string;
  audienceMode?: "all" | "selected";
  targetCohortIds?: string[];
}

export interface Cohort {
  id: string;
  name: string;
  year: string;
  program: string;
  coach: string;
  cadence: string;
  capacity: number;
  room: string;
  students: StudentRecord[];
  syllabus: SyllabusItem[];
  classes: ScheduledClass[];
  reports: ReportEntry[];
  announcements: AnnouncementEntry[];
  archived?: boolean;
}
