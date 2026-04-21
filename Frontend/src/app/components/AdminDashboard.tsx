/**
 * AdminDashboard.tsx — Barrel re-export module.
 *
 * All types, theme tokens, utilities, storage helpers, and shared UI components
 * have been extracted into dedicated modules. This file re-exports them so that
 * existing page components continue to work without import changes.
 *
 * New code should import directly from:
 *   - ../../types        — TypeScript interfaces & type aliases
 *   - ../../theme        — T tokens, color maps, tone mappers
 *   - ../../utils        — createId, formatDateTime, attendance/session helpers
 *   - ../../storage      — loadCohorts, STORAGE_KEY, etc.
 *   - ../shared          — UI components (Btn, PageHeader, Table*, Drawer, …)
 */

/* ── types ── */
export type {
  AttendanceState,
  AttendanceWorkflowStatus,
  SyllabusStatus,
  StudentPace,
  StudentGender,
  ChipTone,
  ScheduledClass,
  StudentRecord,
  SyllabusItem,
  ReportEntry,
  AnnouncementEntry,
  Cohort,
} from "../types";

/* ── theme ── */
export { T, ATTENDANCE_COLORS, CHIP_STYLES, attendanceTone, workflowTone, syllabusTone, paceTone } from "../theme";

/* ── utils ── */
export {
  createId,
  formatDateTime,
  getSessionTimestamp,
  getPriorityClass,
  getSessionAttendanceCounts,
  getSessionAttendanceMarkedCount,
  getSessionAttendanceWorkflowStatus,
  getAttendanceWorkflowLabel,
  setSessionAttendanceWorkflowStatus,
} from "../utils";

/* ── storage ── */
export { STORAGE_KEY, UNASSIGNED_STUDENTS_STORAGE_KEY, loadCohorts, loadUnassignedStudents, saveUnassignedStudents } from "../storage";

/* ── shared UI ── */
export {
  StatusChip,
  KpiCard,
  MetricCard,
  Breadcrumbs,
  PageHeader,
  FilterBar,
  StickyActionBar,
  SectionLabel,
  SectionTitle,
  Surface,
  EmptyState,
  nestedCardStyle,
  TableShell,
  TableHeader,
  Th,
  TableRow,
  Td,
  Btn,
  ActionButton,
  inputStyle,
  textareaStyle,
  FieldLabel,
  FieldShell,
  FormField,
  FormGrid,
  TabBar,
  SearchInput,
  InlineSelect,
  NativeSelectField,
  CohortSwitcher,
  Drawer,
} from "./shared";
