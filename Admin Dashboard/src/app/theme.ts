import type { AttendanceState, AttendanceWorkflowStatus, ChipTone, StudentPace, SyllabusStatus } from "./types";

/* ══════════════════════════════════════════════════
   DESIGN TOKENS
   ══════════════════════════════════════════════════ */

export const T = {
  /* surfaces */
  bg: "#F4F6F8",
  surface: "#FFFFFF",
  surfaceSoft: "#F8FAFC",
  surfaceTint: "#EFF3F7",
  /* borders */
  border: "#DCE3EA",
  borderSoft: "#E9EEF4",
  /* text */
  heading: "#0F172A",
  text: "#111827",
  muted: "#475569",
  subtle: "#64748B",
  /* accent */
  accent: "#4F6B8A",
  accentDeep: "#435C78",
  accentBg: "rgba(79,107,138,0.10)",
  accentBorder: "rgba(79,107,138,0.22)",
  /* semantic status */
  success: "#247A44",
  successBg: "rgba(34,197,94,0.10)",
  successBorder: "rgba(34,197,94,0.22)",
  warning: "#9D6100",
  warningBg: "rgba(245,158,11,0.12)",
  warningBorder: "rgba(245,158,11,0.22)",
  danger: "#B6332C",
  dangerBg: "rgba(200,52,46,0.10)",
  dangerBorder: "rgba(200,52,46,0.22)",
  neutral: "#7E7063",
  neutralBg: "#F3EEE8",
  neutralBorder: "rgba(73,57,42,0.12)",
  /* badge */
  badgeBg: "rgba(244,114,22,0.16)",
  badgeText: "#FDBA74",
  /* inputs */
  inputBg: "#FFFFFF",
  inputBorder: "#D5DDE6",
  /* shadows */
  shadow: "0 1px 2px rgba(15,23,42,0.04)",
  shadowMd: "0 4px 12px rgba(15,23,42,0.06)",
  shadowLg: "0 28px 70px rgba(15,23,42,0.18)",
  /* overlays */
  backdrop: "rgba(22,18,14,0.3)",
  /* sidebar */
  sidebarBg: "#080808",
  sidebarBorder: "rgba(255,255,255,0.08)",
  sidebarText: "rgba(255,255,255,0.82)",
  sidebarTextActive: "#FFFFFF",
  sidebarMuted: "rgba(255,255,255,0.56)",
  sidebarAccent: "#74A4FF",
  /* spacing — 4px grid */
  space1: "4px",
  space2: "8px",
  space3: "12px",
  space4: "16px",
  space5: "24px",
  space6: "32px",
  /* radii */
  radiusSm: "8px",
  radiusMd: "12px",
  radiusLg: "16px",
  radiusXl: "20px",
  /* control heights */
  controlSm: "30px",
  controlMd: "38px",
  controlLg: "42px",
  /* typography scale */
  textXs: "11px",
  textSm: "12px",
  textBase: "13px",
  textMd: "14px",
  textLg: "16px",
  textXl: "18px",
  text2xl: "22px",
  text3xl: "26px",
  text4xl: "30px",
  /* focus */
  focusRing: "0 0 0 2px rgba(200,52,46,0.16)",
} as const;

/* ══════════════════════════════════════════════════
   COLOR MAPS
   ══════════════════════════════════════════════════ */

export const ATTENDANCE_COLORS: Record<AttendanceState, { bg: string; text: string; border: string }> = {
  pending: { bg: T.neutralBg, text: T.neutral, border: T.neutralBorder },
  present: { bg: T.successBg, text: T.success, border: T.successBorder },
  late: { bg: T.warningBg, text: T.warning, border: T.warningBorder },
  absent: { bg: T.dangerBg, text: T.danger, border: T.dangerBorder },
};

export const CHIP_STYLES: Record<ChipTone, { dot: string; color: string; bg: string; border: string }> = {
  success: { dot: T.success, color: T.success, bg: T.successBg, border: T.successBorder },
  warning: { dot: T.warning, color: T.warning, bg: T.warningBg, border: T.warningBorder },
  danger: { dot: T.danger, color: T.danger, bg: T.dangerBg, border: T.dangerBorder },
  info: { dot: T.accent, color: T.accent, bg: T.accentBg, border: T.accentBorder },
  neutral: { dot: T.neutral, color: T.neutral, bg: T.neutralBg, border: T.neutralBorder },
};

/* ══════════════════════════════════════════════════
   TONE MAPPERS
   ══════════════════════════════════════════════════ */

export function attendanceTone(state: AttendanceState): ChipTone {
  if (state === "present") return "success";
  if (state === "late") return "warning";
  if (state === "absent") return "danger";
  return "neutral";
}

export function workflowTone(status: AttendanceWorkflowStatus): ChipTone {
  if (status === "submitted") return "success";
  if (status === "saved") return "warning";
  return "neutral";
}

export function syllabusTone(status: SyllabusStatus): ChipTone {
  if (status === "complete") return "success";
  if (status === "live") return "warning";
  return "neutral";
}

export function paceTone(pace: StudentPace): ChipTone {
  if (pace === "Fast Track") return "success";
  if (pace === "Needs Support") return "warning";
  return "neutral";
}
