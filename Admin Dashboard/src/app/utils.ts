import type { AttendanceWorkflowStatus, ScheduledClass, StudentRecord } from "./types";

/* ══════════════════════════════════════════════════
   ID GENERATION
   ══════════════════════════════════════════════════ */

export function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

/* ══════════════════════════════════════════════════
   DATE / TIME FORMATTING
   ══════════════════════════════════════════════════ */

export function formatDateTime(date: string, time: string) {
  const stamp = new Date(`${date}T${time}:00`);
  if (Number.isNaN(stamp.getTime())) return `${date} · ${time}`;
  const dayLabel = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(stamp);
  const timeLabel = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(stamp);
  return `${dayLabel} at ${timeLabel}`;
}

/* ══════════════════════════════════════════════════
   SESSION HELPERS
   ══════════════════════════════════════════════════ */

export function getSessionTimestamp(session: ScheduledClass) {
  return new Date(`${session.date}T${session.time}:00`).getTime();
}

export function getPriorityClass(classes: ScheduledClass[]) {
  const ordered = [...classes].sort((left, right) => getSessionTimestamp(left) - getSessionTimestamp(right));
  const now = Date.now();
  return ordered.find((session) => getSessionTimestamp(session) >= now) ?? ordered[ordered.length - 1];
}

/* ══════════════════════════════════════════════════
   ATTENDANCE HELPERS
   ══════════════════════════════════════════════════ */

export function getSessionAttendanceCounts(students: StudentRecord[], classId: string) {
  return students.reduce(
    (counts, student) => {
      if ((student.status ?? "active") !== "active") return counts;
      const state = student.attendance[classId] ?? "pending";
      counts[state] += 1;
      counts.total += 1;
      return counts;
    },
    { pending: 0, present: 0, late: 0, absent: 0, total: 0 },
  );
}

export function getSessionAttendanceMarkedCount(counts: { present: number; late: number; absent: number }) {
  return counts.present + counts.late + counts.absent;
}

export function getSessionAttendanceWorkflowStatus(session: ScheduledClass, students: StudentRecord[]): AttendanceWorkflowStatus {
  if (session.attendanceStatus === "saved" || session.attendanceStatus === "submitted") return session.attendanceStatus;
  return getSessionAttendanceMarkedCount(getSessionAttendanceCounts(students, session.id)) > 0 ? "saved" : "pending";
}

export function getAttendanceWorkflowLabel(status: AttendanceWorkflowStatus) {
  if (status === "submitted") return "Submitted";
  if (status === "saved") return "Saved Draft";
  return "Needs Attendance";
}

export function setSessionAttendanceWorkflowStatus(session: ScheduledClass, status: AttendanceWorkflowStatus, timestamp = new Date().toISOString()): ScheduledClass {
  if (status === "submitted") return { ...session, attendanceStatus: "submitted", attendanceSavedAt: session.attendanceSavedAt ?? timestamp, attendanceSubmittedAt: timestamp };
  if (status === "saved") return { ...session, attendanceStatus: "saved", attendanceSavedAt: timestamp, attendanceSubmittedAt: undefined };
  return { ...session, attendanceStatus: "pending", attendanceSavedAt: undefined, attendanceSubmittedAt: undefined };
}
