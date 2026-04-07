import { Children, type CSSProperties, type ChangeEvent, type ReactNode, type SelectHTMLAttributes } from "react";
import { Funnel, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

/* ══════════════════════════════════════════════════
   TYPES
   ══════════════════════════════════════════════════ */

export type AttendanceState = "pending" | "present" | "late" | "absent";
export type AttendanceWorkflowStatus = "pending" | "saved" | "submitted";
export type SyllabusStatus = "planned" | "live" | "complete";
export type StudentPace = "Steady" | "Fast Track" | "Needs Support";

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

export type StudentGender = "Male" | "Female" | "Other";

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

/* ══════════════════════════════════════════════════
   CONSTANTS & THEME
   ══════════════════════════════════════════════════ */

export const STORAGE_KEY = "daka-admin-dashboard-v1";
export const UNASSIGNED_STUDENTS_STORAGE_KEY = "daka-admin-unassigned-students-v1";

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

export const ATTENDANCE_COLORS: Record<AttendanceState, { bg: string; text: string; border: string }> = {
  pending: { bg: T.neutralBg, text: T.neutral, border: T.neutralBorder },
  present: { bg: T.successBg, text: T.success, border: T.successBorder },
  late: { bg: T.warningBg, text: T.warning, border: T.warningBorder },
  absent: { bg: T.dangerBg, text: T.danger, border: T.dangerBorder },
};

/* ══════════════════════════════════════════════════
   STATUS CHIP
   ══════════════════════════════════════════════════ */

export type ChipTone = "success" | "warning" | "danger" | "neutral" | "info";

const CHIP_STYLES: Record<ChipTone, { dot: string; color: string; bg: string; border: string }> = {
  success: { dot: T.success, color: T.success, bg: T.successBg, border: T.successBorder },
  warning: { dot: T.warning, color: T.warning, bg: T.warningBg, border: T.warningBorder },
  danger: { dot: T.danger, color: T.danger, bg: T.dangerBg, border: T.dangerBorder },
  info: { dot: T.accent, color: T.accent, bg: T.accentBg, border: T.accentBorder },
  neutral: { dot: T.neutral, color: T.neutral, bg: T.neutralBg, border: T.neutralBorder },
};

export function StatusChip({ tone, label }: { tone: ChipTone; label: string }) {
  const s = CHIP_STYLES[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: T.space1,
        minHeight: "26px",
        padding: `0 ${T.space2}`,
        borderRadius: "999px",
        border: `1px solid ${s.border}`,
        backgroundColor: s.bg,
        color: s.color,
        fontSize: T.textSm,
        fontWeight: 600,
        whiteSpace: "nowrap",
        lineHeight: 1,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: s.dot, flexShrink: 0 }} />
      {label}
    </span>
  );
}

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

/* ══════════════════════════════════════════════════
   KPI CARD
   ══════════════════════════════════════════════════ */

export function KpiCard({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div
      style={{
        padding: `${T.space4} ${T.space4}`,
        borderRadius: T.radiusMd,
        border: `1px solid ${T.border}`,
        backgroundColor: T.surface,
        display: "grid",
        gap: "8px",
        minHeight: "96px",
        alignContent: "start",
      }}
    >
      <p style={{ color: T.subtle, fontSize: T.textSm, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0, lineHeight: 1 }}>{label}</p>
      <p style={{ color: T.heading, fontSize: T.text3xl, fontWeight: 700, margin: 0, lineHeight: 1.05, letterSpacing: "-0.03em" }}>{value}</p>
      {note ? <p style={{ color: T.muted, fontSize: T.textBase, margin: 0, lineHeight: 1.45 }}>{note}</p> : null}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   PAGE HEADER
   ══════════════════════════════════════════════════ */

export function PageHeader({ title, leading, children }: { title: string; leading?: ReactNode; children?: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: T.space2,
        flexWrap: "wrap",
        paddingBottom: T.space1,
        borderBottom: `1px solid ${T.border}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: T.space2, minWidth: 0, flex: "1 1 640px" }}>
        {leading ? <div style={{ flexShrink: 0 }}>{leading}</div> : null}
        <div style={{ minWidth: 0 }}>
          <h1 style={{ color: T.heading, fontSize: T.text2xl, fontWeight: 700, margin: 0, lineHeight: 1.05, letterSpacing: "-0.02em" }}>{title}</h1>
        </div>
      </div>
      {children ? <div style={{ display: "flex", alignItems: "center", gap: T.space1, flexWrap: "wrap" }}>{children}</div> : null}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   FILTER BAR
   ══════════════════════════════════════════════════ */

export function FilterBar({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: T.space2,
        flexWrap: "wrap",
        padding: "10px 12px",
        borderRadius: T.radiusLg,
        border: `1px solid ${T.accentBorder}`,
        background: `linear-gradient(180deg, ${T.surfaceSoft} 0%, ${T.surface} 100%)`,
        boxShadow: T.shadow,
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          minHeight: T.controlMd,
          padding: "0 12px",
          borderRadius: "999px",
          border: `1px solid ${T.accentBorder}`,
          backgroundColor: T.accentBg,
          color: T.heading,
          fontSize: T.textXs,
          fontWeight: 700,
          whiteSpace: "nowrap",
        }}
      >
        <Funnel size={14} />
        Filters
      </span>
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   POPUP EDITOR
   ══════════════════════════════════════════════════ */

export function Drawer({ open, title, onClose, children, footer }: { open: boolean; title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  if (!open) return null;
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: T.backdrop,
          zIndex: 100,
        }}
      />
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "grid",
          placeItems: "center",
          padding: T.space4,
          zIndex: 101,
        }}
      >
        <div
          onClick={(event) => event.stopPropagation()}
          style={{
            width: "min(680px, calc(100vw - 32px))",
            maxHeight: "calc(100vh - 32px)",
            backgroundColor: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: T.radiusLg,
            boxShadow: T.shadowLg,
            zIndex: 101,
            display: "grid",
            gridTemplateRows: "auto minmax(0, 1fr) auto",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: "60px", padding: `${T.space4} ${T.space5}`, borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
            <div style={{ display: "grid", gap: "2px" }}>
              <p style={{ color: T.subtle, fontSize: T.textXs, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>Editor</p>
              <h2 style={{ color: T.heading, fontSize: T.textXl, fontWeight: 700, margin: 0, lineHeight: 1.15 }}>{title}</h2>
            </div>
            <button type="button" onClick={onClose} aria-label="Close" style={{ display: "grid", placeItems: "center", width: "32px", height: "32px", borderRadius: T.radiusSm, border: `1px solid ${T.border}`, background: T.surface, color: T.muted, cursor: "pointer" }}>
              <X size={16} />
            </button>
          </div>
          <div style={{ overflow: "auto", padding: T.space5 }}>
            {children}
          </div>
          {footer ? (
            <div style={{ padding: `${T.space4} ${T.space5}`, borderTop: `1px solid ${T.border}`, display: "flex", gap: T.space2, justifyContent: "flex-end", flexShrink: 0 }}>
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════
   EMPTY STATE
   ══════════════════════════════════════════════════ */

export function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: T.space3, padding: `${T.space6} ${T.space5}`, maxWidth: "360px", margin: "0 auto" }}>
      <span style={{ color: T.accent, width: "40px", height: "40px", borderRadius: T.radiusMd, display: "grid", placeItems: "center", background: T.accentBg, border: `1px solid ${T.accentBorder}` }}>{icon}</span>
      <p style={{ color: T.heading, fontSize: T.textLg, fontWeight: 700, margin: 0, textAlign: "center" }}>{title}</p>
      {description ? <p style={{ color: T.muted, fontSize: T.textBase, margin: 0, textAlign: "center", lineHeight: 1.55 }}>{description}</p> : null}
      {action}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   TABLE PRIMITIVES
   ══════════════════════════════════════════════════ */

export function TableShell({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        borderRadius: T.radiusLg,
        border: `1px solid ${T.border}`,
        backgroundColor: T.surface,
        overflowX: "auto",
        overflowY: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function TableHeader({ children, columns }: { children: ReactNode; columns: string }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: columns,
        gap: T.space2,
        alignItems: "center",
        minHeight: "44px",
        padding: `0 ${T.space4}`,
        backgroundColor: T.surfaceSoft,
        borderBottom: `1px solid ${T.border}`,
      }}
    >
      {children}
    </div>
  );
}

export function Th({ children, align }: { children: ReactNode; align?: "left" | "center" | "right" }) {
  return (
    <span style={{ color: T.subtle, fontSize: T.textSm, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", textAlign: align ?? "left" }}>
      {children}
    </span>
  );
}

export function TableRow({ children, columns, highlight, onClick }: { children: ReactNode; columns: string; highlight?: boolean; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "grid",
        gridTemplateColumns: columns,
        gap: T.space2,
        alignItems: "center",
        minHeight: "52px",
        padding: `0 ${T.space4}`,
        borderBottom: `1px solid ${T.borderSoft}`,
        backgroundColor: highlight ? T.accentBg : "transparent",
        cursor: onClick ? "pointer" : undefined,
        transition: "background 0.1s ease",
      }}
      onMouseEnter={(e) => { if (onClick) e.currentTarget.style.backgroundColor = T.surfaceSoft; }}
      onMouseLeave={(e) => { if (onClick) e.currentTarget.style.backgroundColor = highlight ? T.accentBg : "transparent"; }}
    >
      {children}
    </div>
  );
}

export function Td({ children, align, muted: isMuted, bold }: { children: ReactNode; align?: "left" | "center" | "right"; muted?: boolean; bold?: boolean }) {
  return (
    <div style={{ color: isMuted ? T.muted : T.text, fontSize: T.textMd, fontWeight: bold ? 600 : 400, textAlign: align ?? "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   BUTTONS
   ══════════════════════════════════════════════════ */

export function Btn({ children, variant = "primary", size = "default", onClick, disabled, type = "button", style }: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "default" | "compact" | "large";
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  style?: CSSProperties;
}) {
  const h = size === "compact" ? T.controlSm : size === "large" ? T.controlLg : T.controlMd;
  const px = size === "compact" ? T.space2 : size === "large" ? T.space4 : T.space3;
  const fs = size === "compact" ? T.textSm : T.textBase;

  const base: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    height: h,
    padding: `0 ${px}`,
    borderRadius: T.radiusMd,
    fontSize: fs,
    fontFamily: "var(--font-body)",
    fontWeight: 700,
    letterSpacing: "0.01em",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    whiteSpace: "nowrap",
    boxShadow: "none",
    transition: "background 0.12s ease, border-color 0.12s ease, box-shadow 0.12s ease, transform 0.12s ease",
  };

  const variants: Record<string, CSSProperties> = {
    primary: {
      background: "linear-gradient(180deg, #4A7DFF 0%, #3B82F6 48%, #2C5BE3 100%)",
      color: "#FFFFFF",
      border: "1px solid #2C5BE3",
      boxShadow: "0 12px 28px rgba(74,125,255,0.28), inset 0 1px 0 rgba(255,255,255,0.24)",
    },
    secondary: {
      background: "linear-gradient(180deg, #F8FBFF 0%, #EFF5FF 44%, #EAF2FF 100%)",
      color: "#2346A0",
      border: "1px solid #C5D7FF",
      boxShadow: "0 8px 18px rgba(74,125,255,0.10), inset 0 1px 0 rgba(255,255,255,0.94)",
    },
    ghost: {
      background: "rgba(234,242,255,0.72)",
      color: "#2346A0",
      border: "1px solid rgba(197,215,255,0.86)",
      boxShadow: "0 6px 14px rgba(74,125,255,0.08)",
    },
    danger: {
      background: "linear-gradient(180deg, rgba(214,91,70,0.24) 0%, rgba(200,52,46,0.12) 100%)",
      color: T.danger,
      border: "1px solid rgba(200,52,46,0.24)",
      boxShadow: "0 10px 20px rgba(196,66,45,0.12), inset 0 1px 0 rgba(255,255,255,0.22)",
    },
  };

  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

/** legacy alias */
export function ActionButton({ children, secondary, type = "button", onClick, disabled, style }: {
  children: ReactNode; secondary?: boolean; type?: "button" | "submit"; onClick?: () => void; disabled?: boolean; style?: CSSProperties;
}) {
  return <Btn variant={secondary ? "secondary" : "primary"} onClick={onClick} disabled={disabled} type={type} style={style}>{children}</Btn>;
}

/* ══════════════════════════════════════════════════
   FORM COMPONENTS
   ══════════════════════════════════════════════════ */

export const inputStyle: CSSProperties = {
  width: "100%",
  height: T.controlMd,
  background: "transparent",
  border: "none",
  outline: "none",
  color: T.heading,
  fontSize: T.textMd,
  fontFamily: "var(--font-body)",
};

export const textareaStyle: CSSProperties = {
  width: "100%",
  minHeight: "72px",
  padding: `${T.space2} 0`,
  resize: "vertical",
  background: "transparent",
  border: "none",
  outline: "none",
  color: T.heading,
  fontSize: T.textMd,
  fontFamily: "var(--font-body)",
};

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label style={{ display: "block", color: T.subtle, fontSize: T.textSm, fontWeight: 600, textTransform: "uppercase", marginBottom: T.space1 }}>
      {children}
    </label>
  );
}

export function FieldShell({ children }: { children: ReactNode }) {
  return (
    <div style={{ backgroundColor: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius: T.radiusMd, padding: `0 ${T.space3}` }}>
      {children}
    </div>
  );
}

export function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <FieldShell>{children}</FieldShell>
    </div>
  );
}

export function FormGrid({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: T.space2 }}>
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   TAB BAR
   ══════════════════════════════════════════════════ */

export function TabBar({ tabs, active, onChange }: { tabs: { id: string; label: string }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div style={{ display: "flex", gap: "0", borderBottom: `1px solid ${T.border}` }}>
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            style={{
              height: "40px",
              padding: `0 ${T.space3}`,
              border: "none",
              borderBottom: isActive ? `2px solid ${T.accent}` : "2px solid transparent",
              background: "transparent",
              color: isActive ? T.heading : T.muted,
              fontSize: T.textMd,
              fontWeight: isActive ? 600 : 400,
              cursor: "pointer",
              transition: "color 0.1s ease",
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SEARCH INPUT
   ══════════════════════════════════════════════════ */

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div style={{ height: T.controlMd, borderRadius: T.radiusMd, border: `1px solid ${T.border}`, backgroundColor: T.surface, display: "flex", alignItems: "center", gap: T.space2, padding: `0 ${T.space3}`, minWidth: "236px" }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.subtle} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Search..."}
        style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: T.heading, fontSize: T.textMd, fontFamily: "var(--font-body)" }}
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════
   COMPACT SELECT (inline filter)
   ══════════════════════════════════════════════════ */

export function InlineSelect({ value, onChange, children, style: extraStyle }: { value: string; onChange: (v: string) => void; children: ReactNode; style?: CSSProperties }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        height: T.controlMd,
        borderRadius: T.radiusMd,
        border: `1px solid ${T.border}`,
        backgroundColor: T.surface,
        color: T.heading,
        fontSize: T.textMd,
        fontFamily: "var(--font-body)",
        fontWeight: 600,
        padding: `0 ${T.space6} 0 ${T.space3}`,
        cursor: "pointer",
        appearance: "auto",
        outline: "none",
        ...extraStyle,
      }}
    >
      {children}
    </select>
  );
}

/* ══════════════════════════════════════════════════
   NATIVE SELECT (Radix-based — legacy compat)
   ══════════════════════════════════════════════════ */

const ADMIN_SELECT_EMPTY_VALUE = "__admin-select-empty__";

function flattenSelectLabel(children: ReactNode): string {
  return Children.toArray(children)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") return String(child);
      if (child && typeof child === "object" && "props" in child) return flattenSelectLabel((child as { props?: { children?: ReactNode } }).props?.children);
      return "";
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractSelectOptions(children: ReactNode) {
  return Children.toArray(children).flatMap((child) => {
    if (!child || typeof child !== "object" || !("type" in child) || child.type !== "option") return [];
    const props = (child as { props?: { value?: string | number; children?: ReactNode; disabled?: boolean } }).props ?? {};
    const label = flattenSelectLabel(props.children);
    return [{ value: String(props.value ?? label), label, disabled: props.disabled ?? false }];
  });
}

function encodeAdminSelectValue(value: string) {
  return value === "" ? ADMIN_SELECT_EMPTY_VALUE : value;
}

function decodeAdminSelectValue(value: string) {
  return value === ADMIN_SELECT_EMPTY_VALUE ? "" : value;
}

export function NativeSelectField({
  children,
  containerStyle,
  selectStyle,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  children: ReactNode;
  containerStyle?: CSSProperties;
  selectStyle?: CSSProperties;
}) {
  const { value, onChange, disabled, name, required, id, ...rest } = props;
  const options = extractSelectOptions(children);
  const currentValue = value == null ? undefined : encodeAdminSelectValue(String(value));

  return (
    <Select
      value={currentValue}
      onValueChange={(nextValue) => {
        const normalizedValue = decodeAdminSelectValue(nextValue);
        onChange?.({ target: { value: normalizedValue }, currentTarget: { value: normalizedValue } } as ChangeEvent<HTMLSelectElement>);
      }}
      disabled={disabled}
      name={name}
      required={required}
    >
      <SelectTrigger
        id={id}
        style={{
          minHeight: T.controlLg,
          height: T.controlLg,
          borderRadius: T.radiusMd,
          borderColor: T.inputBorder,
          background: T.surface,
          padding: `0 ${T.space3}`,
          color: T.heading,
          fontSize: T.textBase,
          fontFamily: "var(--font-body)",
          fontWeight: 600,
          ...selectStyle,
          ...containerStyle,
        }}
        aria-label={props["aria-label"]}
        {...rest}
      >
        <SelectValue placeholder="Select an option" />
      </SelectTrigger>
      <SelectContent
        position="popper"
        style={{ width: "var(--radix-select-trigger-width)", minWidth: "var(--radix-select-trigger-width)", borderColor: T.border, background: T.surface }}
      >
        {options.map((option) => (
          <SelectItem key={`${option.value || "empty"}-${option.label}`} value={encodeAdminSelectValue(option.value)} disabled={option.disabled} style={{ color: T.heading, fontSize: T.textSm }}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function CohortSwitcher({ cohorts, selectedCohortId, onSelect }: { cohorts: Cohort[]; selectedCohortId: string; onSelect: (cohortId: string) => void }) {
  const activeCohorts = cohorts.filter((c) => !c.archived);

  return (
    <NativeSelectField value={selectedCohortId} onChange={(e) => onSelect((e as unknown as { target: { value: string } }).target.value)}>
      {activeCohorts.map((c) => (
        <option key={c.id} value={c.id}>{c.name}</option>
      ))}
    </NativeSelectField>
  );
}

/* ══════════════════════════════════════════════════
   STICKY ACTION BAR
   ══════════════════════════════════════════════════ */

export function StickyActionBar({ children, visible }: { children: ReactNode; visible: boolean }) {
  if (!visible) return null;
  return (
    <div
      style={{
        position: "sticky",
        bottom: 0,
        left: 0,
        right: 0,
        minHeight: "52px",
        padding: `${T.space3} ${T.space5}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: T.space2,
        backgroundColor: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: T.radiusLg,
        zIndex: 20,
      }}
    >
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SECTION HEADER (simple)
   ══════════════════════════════════════════════════ */

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h3 style={{ color: T.subtle, fontSize: T.textXs, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", margin: `0 0 ${T.space2} 0` }}>
      {children}
    </h3>
  );
}

/** legacy exports – some old pages may still import these */
export function SectionTitle({ eyebrow, title, detail, subdetail, titleStyle }: { eyebrow: string; title: string; detail?: string; subdetail?: string; titleStyle?: CSSProperties }) {
  return (
    <div style={{ display: "grid", gap: "2px", marginBottom: T.space2 }}>
      <p style={{ color: T.subtle, fontSize: T.textXs, fontWeight: 600, textTransform: "uppercase", margin: 0 }}>{eyebrow}</p>
      <h2 style={{ color: T.heading, fontSize: T.textLg, fontWeight: 600, margin: 0, lineHeight: 1.2, ...titleStyle }}>{title}</h2>
      {detail || subdetail ? <p style={{ color: T.muted, fontSize: T.textSm, lineHeight: 1.4, margin: 0 }}>{detail ?? subdetail}</p> : null}
    </div>
  );
}

export function Surface({ children, accent, style }: { children: ReactNode; accent?: boolean; style?: CSSProperties }) {
  return (
    <div style={{ backgroundColor: accent ? T.surfaceTint : T.surface, border: `1px solid ${accent ? T.accentBorder : T.border}`, borderRadius: T.radiusLg, position: "relative", overflow: "hidden", ...style }}>
      {children}
    </div>
  );
}

export function MetricCard({ icon, label, value, note }: { icon: ReactNode; label: string; value: string; note: string }) {
  return <KpiCard label={label} value={value} note={note} />;
}

export const nestedCardStyle: CSSProperties = {
  border: `1px solid ${T.borderSoft}`,
  backgroundColor: T.surface,
};

/* ══════════════════════════════════════════════════
   UTILITY FUNCTIONS
   ══════════════════════════════════════════════════ */

export function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function formatDateTime(date: string, time: string) {
  const stamp = new Date(`${date}T${time}:00`);
  if (Number.isNaN(stamp.getTime())) return `${date} · ${time}`;
  const dayLabel = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(stamp);
  const timeLabel = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(stamp);
  return `${dayLabel} at ${timeLabel}`;
}

export function getSessionTimestamp(session: ScheduledClass) {
  return new Date(`${session.date}T${session.time}:00`).getTime();
}

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

export function getPriorityClass(classes: ScheduledClass[]) {
  const ordered = [...classes].sort((left, right) => getSessionTimestamp(left) - getSessionTimestamp(right));
  const now = Date.now();
  return ordered.find((session) => getSessionTimestamp(session) >= now) ?? ordered[ordered.length - 1];
}

function seedSession(id: string, date: string, track: string, coach: string, topic: string): ScheduledClass {
  return { id, date, time: "16:30", track, coach, topic };
}

function createPdfJuniorThursdayClasses(coach: string): ScheduledClass[] {
  return [
    seedSession("junior-class-1", "2026-04-02", "Indoor Clockwise", coach, "Full Daily Maintenance Checklist"),
    seedSession("junior-class-2", "2026-04-09", "Indoor Clockwise", coach, "Wheel Change & Tyre Pressure"),
    seedSession("junior-class-3", "2026-04-16", "Indoor Clockwise", coach, "Brake Pads Check & Refit"),
    seedSession("junior-class-4", "2026-04-23", "Indoor Clockwise", coach, "Spark Plugs & Gapping"),
    seedSession("junior-class-5", "2026-04-30", "Indoor Anti-CW", coach, "Brake Fluid Bleed"),
    seedSession("junior-class-6", "2026-05-07", "Indoor Anti-CW", coach, "Carburetor Removal & Refit"),
    seedSession("junior-class-7", "2026-05-14", "Indoor Clockwise", coach, "Oil Change"),
    seedSession("junior-class-8", "2026-05-21", "Indoor Clockwise", coach, "Air Filter Removal & Cleaning"),
    seedSession("junior-class-9", "2026-06-04", "Indoor Race Day", coach, "Rear Sprocket Alignment"),
    seedSession("junior-class-10", "2026-06-11", "Outdoor International", coach, "Introduction to Outdoor Track"),
  ];
}

function createPdfAdvancedTuesdayClasses(coach: string): ScheduledClass[] {
  return [
    seedSession("advanced-class-1", "2026-03-31", "Outdoor Cadet", coach, "Carburetor Cleaning"),
    seedSession("advanced-class-2", "2026-04-07", "Outdoor Cadet", coach, "Drive Belt Adjust, Remove, Replace"),
    seedSession("advanced-class-3", "2026-04-14", "Outdoor Cadet", coach, "Steering Column Removal & Refit"),
    seedSession("advanced-class-4", "2026-04-21", "Outdoor Cadet", coach, "Stub Axel & Track Rod Removal"),
    seedSession("advanced-class-5", "2026-04-28", "Outdoor National", coach, "Front Wheel Alignment"),
    seedSession("advanced-class-6", "2026-05-05", "Outdoor National", coach, "Rear Sprocket Refit & Alignment"),
    seedSession("advanced-class-7", "2026-05-12", "Outdoor National", coach, "Exhaust & Inlet Valve Clearance"),
    seedSession("advanced-class-8", "2026-05-19", "Outdoor National", coach, "Exhaust Removal & Refit"),
    seedSession("advanced-class-9", "2026-06-02", "Outdoor International", coach, "Engine Removal"),
    seedSession("advanced-class-10", "2026-06-09", "Outdoor International", coach, "Race Day — SWS Format"),
  ];
}

function createPdfJuniorThursdaySyllabus(): SyllabusItem[] {
  return [
    { id: "junior-syllabus-1", weekLabel: "Week 01", title: "Introduction to karting", objective: "Learn correct driving position, steering technique, and the full daily maintenance checklist on the Indoor Clockwise layout.", status: "complete" },
    { id: "junior-syllabus-2", weekLabel: "Week 02", title: "Wheel change and tyre pressure", objective: "Build braking-point awareness while practicing safe wheel changes and tyre-pressure checks.", status: "live" },
    { id: "junior-syllabus-3", weekLabel: "Week 03", title: "Brake pads workshop", objective: "Reinforce racing lines and complete a full brake pads check and refit routine.", status: "planned" },
    { id: "junior-syllabus-4", weekLabel: "Week 04", title: "Spark plug basics", objective: "Improve apex consistency and learn spark plug inspection and gapping.", status: "planned" },
    { id: "junior-syllabus-5", weekLabel: "Week 05", title: "Anti-clockwise brake control", objective: "Adapt to the Indoor Anti-CW layout and complete a brake fluid bleed safely.", status: "planned" },
    { id: "junior-syllabus-6", weekLabel: "Week 06", title: "Carburetor removal and refit", objective: "Grow workshop confidence while linking track-map recall to clean mechanical sequencing.", status: "planned" },
    { id: "junior-syllabus-7", weekLabel: "Week 07", title: "Oil change routine", objective: "Repeat lap routines confidently and carry out a clean oil-change process.", status: "planned" },
    { id: "junior-syllabus-8", weekLabel: "Week 08", title: "Air filter care", objective: "Use pace awareness and line memory while removing and cleaning the air filter.", status: "planned" },
    { id: "junior-syllabus-9", weekLabel: "Week 09", title: "Indoor race day", objective: "Apply race-day awareness on the indoor circuit and complete rear sprocket alignment.", status: "planned" },
    { id: "junior-syllabus-10", weekLabel: "Week 10", title: "Outdoor track introduction", objective: "Transfer indoor habits to the Outdoor International layout with a calm first-lap orientation.", status: "planned" },
  ];
}

function createPdfAdvancedTuesdaySyllabus(): SyllabusItem[] {
  return [
    { id: "advanced-syllabus-1", weekLabel: "Week 01", title: "Cadet mechanical foundation", objective: "Clean the carburetor and establish overtaking, consistency, and race discipline on the Outdoor Cadet layout.", status: "complete" },
    { id: "advanced-syllabus-2", weekLabel: "Week 02", title: "Drive belt service", objective: "Adjust, remove, and replace the drive belt while sharpening defensive positioning on Cadet.", status: "live" },
    { id: "advanced-syllabus-3", weekLabel: "Week 03", title: "Steering column service", objective: "Remove and refit the steering column while strengthening braking-map recall and workshop control.", status: "planned" },
    { id: "advanced-syllabus-4", weekLabel: "Week 04", title: "Stub axle and track rod removal", objective: "Build repeatable fast lines on the Cadet layout while handling precision front-end work.", status: "planned" },
    { id: "advanced-syllabus-5", weekLabel: "Week 05", title: "National circuit alignment", objective: "Move to Outdoor National and complete front wheel alignment with better recovery-line choices.", status: "planned" },
    { id: "advanced-syllabus-6", weekLabel: "Week 06", title: "Rear sprocket refit and alignment", objective: "Improve national-circuit consistency while refitting, aligning, and cleaning the rear sprocket.", status: "planned" },
    { id: "advanced-syllabus-7", weekLabel: "Week 07", title: "Valve clearance", objective: "Work through exhaust and inlet valve clearance with stronger race-discipline awareness.", status: "planned" },
    { id: "advanced-syllabus-8", weekLabel: "Week 08", title: "Exhaust removal and refit", objective: "Adapt line choice under pressure and complete a clean exhaust removal and refit.", status: "planned" },
    { id: "advanced-syllabus-9", weekLabel: "Week 09", title: "International engine removal", objective: "Progress onto Outdoor International and prepare for engine removal with focused start procedure work.", status: "planned" },
    { id: "advanced-syllabus-10", weekLabel: "Week 10", title: "International race day", objective: "Execute a race-day simulation in SWS format on the International circuit after full term progression.", status: "planned" },
  ];
}

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

/* ══════════════════════════════════════════════════
   INITIAL / SEED DATA
   ══════════════════════════════════════════════════ */

function createInitialCohorts(): Cohort[] {
  const juniorClass1 = "junior-class-1";
  const juniorClass2 = "junior-class-2";
  const juniorClass3 = "junior-class-3";
  const advancedClass1 = "advanced-class-1";
  const advancedClass2 = "advanced-class-2";
  const advancedClass3 = "advanced-class-3";

  return [
    {
      id: "junior-thursday",
      name: "Juniors · Thursday",
      year: "2026",
      program: "Beginner Course (Level One)",
      coach: "Coach Kareem",
      cadence: "Thursday · 4:30 PM to 6:30 PM · Starts 2 Apr 2026",
      capacity: 10,
      room: "Indoor Kartdrome",
      classes: createPdfJuniorThursdayClasses("Coach Kareem"),
      students: [
        { id: "student-sara", name: "Sara Al Mansoori", age: "10", dateOfBirth: "2016-03-14", gender: "Female", guardian: "Noora Al Mansoori", guardianPhone: "+971 50 123 4567", guardianEmail: "noora.m@email.com", emergencyContact: "Khalid Al Mansoori", emergencyPhone: "+971 55 987 6543", medicalNotes: "Mild asthma — carries inhaler in kit bag.", experience: "6 months indoor karting, 2 rental sessions.", pace: "Fast Track", notes: "Confident through sector two, still braking early into turn four.", attendance: { [juniorClass1]: "present", [juniorClass2]: "pending", [juniorClass3]: "pending" }, enrolledAt: "2026-02-10T09:00:00.000Z" },
        { id: "student-omar", name: "Omar Al Suwaidi", age: "11", dateOfBirth: "2015-07-22", gender: "Male", guardian: "Hamad Al Suwaidi", guardianPhone: "+971 50 234 5678", guardianEmail: "hamad.s@email.com", emergencyContact: "Fatima Al Suwaidi", emergencyPhone: "+971 56 345 6789", experience: "Complete beginner — first structured programme.", pace: "Steady", notes: "Needs reminders on smooth steering inputs.", attendance: { [juniorClass1]: "late", [juniorClass2]: "pending", [juniorClass3]: "pending" }, enrolledAt: "2026-02-10T09:00:00.000Z" },
        { id: "student-mia", name: "Mia Fernandes", age: "9", dateOfBirth: "2017-01-05", gender: "Female", guardian: "Carla Fernandes", guardianPhone: "+971 52 456 7890", guardianEmail: "carla.f@email.com", emergencyContact: "David Fernandes", emergencyPhone: "+971 54 567 8901", medicalNotes: "No known conditions.", experience: "None — first time on track.", pace: "Needs Support", notes: "Focus on braking confidence and exit vision.", attendance: { [juniorClass1]: "present", [juniorClass2]: "pending", [juniorClass3]: "pending" }, enrolledAt: "2026-03-01T09:00:00.000Z" },
      ],
      syllabus: createPdfJuniorThursdaySyllabus(),
      reports: [
        { id: "junior-report-1", studentId: "student-sara", title: "Week 1 progression report", summary: "Sara stayed composed in traffic and consistently hit the first apex without correction.", recommendation: "Push her into a faster reference group next week and add one overtaking drill.", weekLabel: "Week 01", grade: "A", remark: "Sara stayed composed in traffic and consistently hit the first apex without correction.", skillChecks: { "correct-driving-position": true, "steering-technique": true, "racing-line-basics": true, "full-daily-maintenance-checklist": false }, createdAt: "2026-03-21T17:45:00.000Z" },
      ],
      announcements: [
        { id: "junior-announcement-1", title: "Term 3 Thursday schedule", message: "No class on Thu 28 May for Eid Al Adha / Arafat Day. Indoor Race Day follows on Thu 4 Jun, then Outdoor International on Thu 11 Jun.", classId: juniorClass2, createdAt: "2026-03-25T12:00:00.000Z" },
      ],
    },
    {
      id: "advanced-tuesday",
      name: "Advanced · Tuesday",
      year: "2026",
      program: "Advanced Course (Level Two)",
      coach: "Coach Yousuf",
      cadence: "Tuesday · 4:30 PM to 6:30 PM · Starts 31 Mar 2026",
      capacity: 12,
      room: "Outdoor Kartdrome",
      classes: createPdfAdvancedTuesdayClasses("Coach Yousuf"),
      students: [
        { id: "student-ahmed", name: "Ahmed Al Karimi", age: "14", dateOfBirth: "2012-05-18", gender: "Male", guardian: "Rashed Al Karimi", guardianPhone: "+971 50 678 9012", guardianEmail: "rashed.k@email.com", emergencyContact: "Fatima Al Karimi", emergencyPhone: "+971 55 789 0123", experience: "2 years cadet karting, 4 regional podiums.", pace: "Fast Track", notes: "Already ready for national-layout consistency targets.", attendance: { [advancedClass1]: "pending", [advancedClass2]: "pending", [advancedClass3]: "pending" }, enrolledAt: "2025-11-15T09:00:00.000Z" },
        { id: "student-lina", name: "Lina Haddad", age: "15", dateOfBirth: "2011-09-03", gender: "Female", guardian: "Mazen Haddad", guardianPhone: "+971 50 890 1234", guardianEmail: "mazen.h@email.com", emergencyContact: "Hana Haddad", emergencyPhone: "+971 56 901 2345", medicalNotes: "Wears corrective lenses under visor.", experience: "1 year academy training, strong racecraft.", pace: "Steady", notes: "Strong exits, needs cleaner defensive line discipline.", attendance: { [advancedClass1]: "pending", [advancedClass2]: "pending", [advancedClass3]: "pending" }, enrolledAt: "2026-01-08T09:00:00.000Z" },
        { id: "student-zayd", name: "Zayd Khan", age: "13", dateOfBirth: "2013-11-27", gender: "Male", guardian: "Amina Khan", guardianPhone: "+971 52 012 3456", guardianEmail: "amina.k@email.com", emergencyContact: "Tariq Khan", emergencyPhone: "+971 54 123 4567", medicalNotes: "Prone to motion sensitivity — monitor during long stints.", experience: "6 months rental karting, transitioning to owner kart.", pace: "Needs Support", notes: "Confidence drops in high-speed sweepers.", attendance: { [advancedClass1]: "pending", [advancedClass2]: "pending", [advancedClass3]: "pending" }, enrolledAt: "2026-02-20T09:00:00.000Z" },
      ],
      syllabus: createPdfAdvancedTuesdaySyllabus(),
      reports: [],
      announcements: [
        { id: "advanced-announcement-1", title: "Term 3 Tuesday schedule", message: "No class on Tue 26 May for Eid Al Adha / Arafat Day. International work begins on Tue 2 Jun, followed by the SWS-format race day on Tue 9 Jun.", classId: advancedClass2, createdAt: "2026-03-24T11:15:00.000Z" },
      ],
    },
  ].map(normalizeCohort);
}
