export type ApiListResponse<T> = {
  items: T[];
  total: number;
  nextCursor: string | null;
};

export type AuthToken = {
  accessToken: string;
  tokenType: "Bearer";
  expiresAt: string;
};

export type AuthLoginResponse = {
  token: AuthToken;
  me: Me;
};

export type Me = {
  userId: string;
  role: "coach" | "student";
  fullName: string;
  email: string | null;
  username: string | null;
  phone: string | null;
  status: "invited" | "active" | "suspended" | "archived";
  coachProfile?: {
    displayName: string | null;
    isPlatformAdmin: boolean;
  };
  studentProfile?: {
    pace: "steady" | "fast_track" | "needs_support" | null;
    dateOfBirth: string | null;
  };
};

export type CohortSummary = {
  cohortId: string;
  slug: string;
  name: string;
  yearLabel: string | null;
  programName: string | null;
  cadenceLabel: string | null;
  capacity: number | null;
  locationName: string | null;
  startsOn: string | null;
  endsOn: string | null;
  archivedAt: string | null;
  leadCoachName: string | null;
  activeStudentCount: number;
  pendingAttendanceSessionCount: number;
  liveAnnouncementCount: number;
};

export type EnrollmentSummary = {
  enrollmentId: string;
  cohortId: string;
  cohortName: string;
  studentUserId: string;
  studentName: string;
  status: "active" | "paused" | "withdrawn" | "completed" | "cancelled";
  enrolledAt: string;
  endedAt: string | null;
  pace: "steady" | "fast_track" | "needs_support" | null;
};

export type StudentHomeEnrollment = Pick<
  EnrollmentSummary,
  "enrollmentId" | "cohortId" | "cohortName" | "status" | "enrolledAt" | "endedAt"
>;

export type StudentHomeAttendanceSummary = {
  present: number;
  late: number;
  absent: number;
};

export type StudentHomeProgressSummary = {
  publishedWeekCount: number;
  completedSkillCount: number;
  totalSkillCount: number;
  completionPercent: number;
};

export type StudentHomeNextSession = Pick<SessionSummary, "sessionId" | "topic" | "startsAt" | "locationName">;

export type StudentHome = {
  me: Me;
  activeEnrollment: StudentHomeEnrollment | null;
  nextSession: StudentHomeNextSession | null;
  attendanceSummary: StudentHomeAttendanceSummary;
  progressSummary: StudentHomeProgressSummary;
  unreadAnnouncementCount: number;
  unreadNotificationCount: number;
};

export type SessionSummary = {
  sessionId: string;
  cohortId: string;
  syllabusWeekId: string | null;
  topic: string;
  track: string | null;
  locationName: string | null;
  startsAt: string;
  endsAt: string | null;
  status: "scheduled" | "completed" | "cancelled";
  coachAssignments: Array<{
    coachUserId: string;
    coachName: string;
    role: "lead" | "assistant" | "substitute";
  }>;
  attendanceRegister: {
    workflowStatus: "not_started" | "draft" | "submitted";
    savedAt: string | null;
    submittedAt: string | null;
    visibleToStudentsAt: string | null;
  };
};

export type AttendanceRow = {
  attendanceRecordId: string;
  enrollmentId: string;
  studentUserId: string;
  studentName: string;
  state: "unmarked" | "present" | "late" | "absent";
  notes: string | null;
};

export type WeeklyProgressRow = {
  progressId: string;
  enrollmentId: string;
  studentUserId: string;
  studentName: string;
  syllabusWeekId: string;
  weekLabel: string;
  topicTitle: string;
  status: "draft" | "published";
  remark: string | null;
  gradeLabel: string | null;
  recommendation: string | null;
  skillChecks: Record<string, boolean>;
  publishedAt: string | null;
};

export type AnnouncementTarget = {
  type: "cohort" | "session" | "student";
  cohortId?: string;
  sessionId?: string;
  studentUserId?: string;
};

export type Announcement = {
  announcementId: string;
  title: string;
  message: string;
  status: "draft" | "published" | "archived";
  publishedAt: string | null;
  expiresAt: string | null;
  pinned: boolean;
  targets: AnnouncementTarget[];
};

export type Notification = {
  notificationId: string;
  type: "attendance_visible" | "progress_published" | "announcement_published" | "session_reminder" | "enrollment_changed";
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};
