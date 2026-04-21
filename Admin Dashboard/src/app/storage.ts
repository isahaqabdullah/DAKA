import type { Cohort, StudentRecord } from "./types";
import { getSessionAttendanceWorkflowStatus } from "./utils";
import {
  createInitialCohorts,
  createPdfAdvancedTuesdayClasses,
  createPdfAdvancedTuesdaySyllabus,
  createPdfJuniorThursdayClasses,
  createPdfJuniorThursdaySyllabus,
} from "./seed-data";

/* ══════════════════════════════════════════════════
   STORAGE KEYS
   ══════════════════════════════════════════════════ */

export const STORAGE_KEY = "daka-admin-dashboard-v1";
export const UNASSIGNED_STUDENTS_STORAGE_KEY = "daka-admin-unassigned-students-v1";

/* ══════════════════════════════════════════════════
   LEGACY SEED ALIGNMENT
   ══════════════════════════════════════════════════ */

function alignLegacySeedCohort(cohort: Cohort): Cohort {
  if (cohort.id === "junior-thursday") {
    const classCount = Array.isArray(cohort.classes) ? cohort.classes.length : 0;
    const syllabusCount = Array.isArray(cohort.syllabus) ? cohort.syllabus.length : 0;
    const shouldAlign = cohort.program === "Level 1 Beginner"
      || cohort.cadence === "Thursday · 4:30 PM to 6:30 PM"
      || classCount <= 3
      || syllabusCount <= 3;
    if (!shouldAlign) return cohort;
    return {
      ...cohort,
      year: "2026",
      program: "Beginner Course (Level One)",
      cadence: "Thursday · 4:30 PM to 6:30 PM · Starts 2 Apr 2026",
      room: "Indoor Kartdrome",
      classes: createPdfJuniorThursdayClasses(cohort.coach?.trim() || "Coach Kareem"),
      syllabus: createPdfJuniorThursdaySyllabus(),
    };
  }

  if (cohort.id === "advanced-tuesday") {
    const classCount = Array.isArray(cohort.classes) ? cohort.classes.length : 0;
    const syllabusCount = Array.isArray(cohort.syllabus) ? cohort.syllabus.length : 0;
    const shouldAlign = cohort.program === "Level 2 Advanced"
      || cohort.cadence === "Tuesday · 4:30 PM to 6:30 PM"
      || cohort.year === "2025"
      || classCount <= 3
      || syllabusCount <= 3;
    if (!shouldAlign) return cohort;
    return {
      ...cohort,
      year: "2026",
      program: "Advanced Course (Level Two)",
      cadence: "Tuesday · 4:30 PM to 6:30 PM · Starts 31 Mar 2026",
      room: "Outdoor Kartdrome",
      classes: createPdfAdvancedTuesdayClasses(cohort.coach?.trim() || "Coach Yousuf"),
      syllabus: createPdfAdvancedTuesdaySyllabus(),
    };
  }

  return cohort;
}

/* ══════════════════════════════════════════════════
   NORMALIZATION
   ══════════════════════════════════════════════════ */

function normalizeCohort(cohort: Cohort): Cohort {
  const aligned = alignLegacySeedCohort(cohort);
  const students = Array.isArray(aligned.students) ? aligned.students : [];
  const classes = Array.isArray(aligned.classes)
    ? aligned.classes.map((session) => {
        const attendanceStatus = getSessionAttendanceWorkflowStatus(session, students);
        return {
          ...session,
          attendanceStatus,
          attendanceSavedAt: attendanceStatus === "pending" ? undefined : session.attendanceSavedAt ?? session.attendanceSubmittedAt,
          attendanceSubmittedAt: attendanceStatus === "submitted" ? session.attendanceSubmittedAt ?? session.attendanceSavedAt : undefined,
        };
      })
    : [];
  const derivedYear = (
    [...students]
      .map((student) => student.enrolledAt?.slice(0, 4) ?? "")
      .filter((value) => /^\d{4}$/.test(value))
      .sort()[0]
    || classes[0]?.date?.slice(0, 4)
    || String(new Date().getFullYear())
  );
  return {
    ...aligned,
    year: aligned.year?.trim() || derivedYear,
    students,
    classes,
    announcements: Array.isArray(aligned.announcements)
      ? [...aligned.announcements].sort((left, right) => {
          if ((left.pinned ?? false) !== (right.pinned ?? false)) return left.pinned ? -1 : 1;
          return right.createdAt.localeCompare(left.createdAt);
        })
      : [],
  };
}

/* ══════════════════════════════════════════════════
   LOAD / SAVE
   ══════════════════════════════════════════════════ */

export function loadCohorts(): Cohort[] {
  if (typeof window === "undefined") return createInitialCohorts();
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return createInitialCohorts();
  try {
    const parsed = JSON.parse(raw) as Cohort[];
    if (!Array.isArray(parsed) || parsed.length === 0) return createInitialCohorts();
    return parsed.map(normalizeCohort);
  } catch {
    return createInitialCohorts();
  }
}

export function loadUnassignedStudents(): StudentRecord[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(UNASSIGNED_STUDENTS_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as StudentRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveUnassignedStudents(students: StudentRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(UNASSIGNED_STUDENTS_STORAGE_KEY, JSON.stringify(students));
}
