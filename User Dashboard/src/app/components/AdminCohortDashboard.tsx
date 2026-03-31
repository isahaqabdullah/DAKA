import { useEffect, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Megaphone,
  Plus,
  Users,
  X,
} from "lucide-react";
import {
  ActionButton,
  ADMIN_THEME,
  ATTENDANCE_COLORS,
  CohortSwitcher,
  createId,
  FieldLabel,
  FieldShell,
  formatDateTime,
  getSessionTimestamp,
  getPriorityClass,
  inputStyle,
  loadCohorts,
  nestedCardStyle,
  SectionTitle,
  STORAGE_KEY,
  Surface,
  textareaStyle,
  type AnnouncementEntry,
  type AttendanceState,
  type Cohort,
} from "./AdminDashboard";

/* ── helpers ── */

function getSessionAttendanceCounts(students: Cohort["students"], classId: string) {
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

function getOverallAttendanceRate(cohort: Cohort) {
  const activeStudents = cohort.students.filter((s) => (s.status ?? "active") === "active");
  if (activeStudents.length === 0 || cohort.classes.length === 0) return null;

  let marked = 0;
  let presentOrLate = 0;

  for (const student of activeStudents) {
    for (const session of cohort.classes) {
      const state = student.attendance[session.id];
      if (state && state !== "pending") {
        marked += 1;
        if (state === "present" || state === "late") presentOrLate += 1;
      }
    }
  }

  if (marked === 0) return null;
  return Math.round((presentOrLate / marked) * 100);
}

function getTotalPendingCount(cohort: Cohort) {
  const activeStudents = cohort.students.filter((s) => (s.status ?? "active") === "active");
  let count = 0;
  for (const student of activeStudents) {
    for (const session of cohort.classes) {
      if ((student.attendance[session.id] ?? "pending") === "pending") count += 1;
    }
  }
  return count;
}

function getActiveAnnouncementCount(announcements: AnnouncementEntry[]) {
  const now = new Date();
  return announcements.filter((a) => !a.expiresAt || new Date(a.expiresAt) >= now).length;
}

function announcementTargetLabel(classId: string | undefined, classes: Cohort["classes"]) {
  if (!classId) return "Whole cohort";
  const targetClass = classes.find((session) => session.id === classId);
  if (!targetClass) return "Archived class target";
  return `${formatDateTime(targetClass.date, targetClass.time)} · ${targetClass.topic}`;
}

function emptyAnnouncementDraft(classId = "") {
  return { classId, title: "", message: "", expiresAt: "" };
}

/* ── small reusable pieces ── */

function pillSummaryStyle(state: AttendanceState): CSSProperties {
  const colors = ATTENDANCE_COLORS[state];
  return {
    padding: "7px 10px",
    borderRadius: "999px",
    backgroundColor: colors.bg,
    border: `1px solid ${colors.border}`,
    color: colors.text,
    fontSize: "11px",
    letterSpacing: "0px",
    textTransform: "uppercase",
  };
}

function MetricTile({ icon, label, value, accentValue }: { icon: ReactNode; label: string; value: string; accentValue?: boolean }) {
  return (
    <div style={{ padding: "14px", borderRadius: "16px", ...nestedCardStyle, display: "grid", gap: "4px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <p style={{ color: ADMIN_THEME.subtle, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", margin: 0 }}>{label}</p>
        <div style={{ width: "32px", height: "32px", borderRadius: "10px", border: `1px solid ${ADMIN_THEME.accentBorder}`, backgroundColor: ADMIN_THEME.accentBg, display: "grid", placeItems: "center", color: ADMIN_THEME.accent, flexShrink: 0 }}>
          {icon}
        </div>
      </div>
      <p style={{ color: accentValue ? ADMIN_THEME.accent : ADMIN_THEME.heading, fontSize: "28px", fontFamily: "var(--font-body)", fontWeight: 900, margin: 0, lineHeight: 1 }}>{value}</p>
    </div>
  );
}

function QuickNavButton({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        minHeight: "36px",
        padding: "0 14px",
        borderRadius: "12px",
        border: `1px solid ${ADMIN_THEME.border}`,
        background: "linear-gradient(180deg, #FFFFFF 0%, #F8F3EE 100%)",
        color: ADMIN_THEME.heading,
        fontSize: "11px",
        fontWeight: 800,
        textTransform: "uppercase",
        cursor: "pointer",
        whiteSpace: "nowrap",
        boxShadow: "0 4px 10px rgba(70,46,25,0.04)",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function AttendanceBar({ counts }: { counts: { present: number; late: number; absent: number; pending: number; total: number } }) {
  if (counts.total === 0) return null;
  const segments: { key: AttendanceState; count: number; color: string }[] = [
    { key: "present", count: counts.present, color: "#22C55E" },
    { key: "late", count: counts.late, color: "#F59E0B" },
    { key: "absent", count: counts.absent, color: "#C8342E" },
    { key: "pending", count: counts.pending, color: "#DDD5CC" },
  ];

  return (
    <div style={{ display: "flex", height: "6px", borderRadius: "999px", overflow: "hidden", width: "100%" }}>
      {segments.map((seg) =>
        seg.count > 0 ? (
          <div key={seg.key} style={{ width: `${(seg.count / counts.total) * 100}%`, backgroundColor: seg.color, minWidth: "3px" }} />
        ) : null,
      )}
    </div>
  );
}

/* ── main component ── */

interface AdminCohortDashboardProps {
  initialCohortId?: string;
  onOpenAttendance?: (context: { cohortId: string; classId: string }) => void;
  onOpenTeachingOperations?: (cohortId: string) => void;
  onOpenCohortManagement?: (cohortId: string) => void;
  onOpenCohortReports?: (cohortId: string) => void;
  onSelectCohort?: (cohortId: string) => void;
  onBackToLanding?: () => void;
}

export function AdminCohortDashboard({
  initialCohortId,
  onOpenAttendance,
  onOpenTeachingOperations,
  onOpenCohortManagement,
  onOpenCohortReports,
  onSelectCohort,
  onBackToLanding,
}: AdminCohortDashboardProps) {
  const [cohorts, setCohorts] = useState<Cohort[]>(() => loadCohorts());
  const [selectedCohortId, setSelectedCohortId] = useState(() => initialCohortId ?? loadCohorts()[0]?.id ?? "");
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState<{ classId: string; title: string; message: string; expiresAt: string }>(() => emptyAnnouncementDraft());
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);
  const [editingAnnouncementDraft, setEditingAnnouncementDraft] = useState<{ classId: string; title: string; message: string; expiresAt: string }>(() => emptyAnnouncementDraft());
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  const selectedCohort = cohorts.find((cohort) => cohort.id === selectedCohortId) ?? cohorts[0];

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cohorts));
  }, [cohorts]);

  useEffect(() => {
    if (initialCohortId && cohorts.some((cohort) => cohort.id === initialCohortId)) {
      setSelectedCohortId(initialCohortId);
    }
  }, [cohorts, initialCohortId]);

  function updateSelectedCohort(mutator: (cohort: Cohort) => Cohort) {
    if (!selectedCohort) return;
    setCohorts((current) => current.map((cohort) => (cohort.id === selectedCohort.id ? mutator(cohort) : cohort)));
  }

  function handleAnnouncementSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCohort || !newAnnouncement.title.trim() || !newAnnouncement.message.trim()) return;

    updateSelectedCohort((cohort) => ({
      ...cohort,
      announcements: [
        {
          id: createId("announcement"),
          classId: newAnnouncement.classId || undefined,
          title: newAnnouncement.title.trim(),
          message: newAnnouncement.message.trim(),
          createdAt: new Date().toISOString(),
          expiresAt: newAnnouncement.expiresAt.trim() || undefined,
        },
        ...cohort.announcements,
      ],
    }));

    setNewAnnouncement(emptyAnnouncementDraft());
    setShowAnnouncementForm(false);
  }

  function handleAnnouncementEdit(announcement: AnnouncementEntry) {
    setEditingAnnouncementId(announcement.id);
    setEditingAnnouncementDraft({
      classId: announcement.classId ?? "",
      title: announcement.title,
      message: announcement.message,
      expiresAt: announcement.expiresAt ?? "",
    });
  }

  function handleAnnouncementEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCohort || !editingAnnouncementId || !editingAnnouncementDraft.title.trim() || !editingAnnouncementDraft.message.trim()) return;

    updateSelectedCohort((cohort) => ({
      ...cohort,
      announcements: cohort.announcements.map((announcement) =>
        announcement.id === editingAnnouncementId
          ? { ...announcement, classId: editingAnnouncementDraft.classId || undefined, title: editingAnnouncementDraft.title.trim(), message: editingAnnouncementDraft.message.trim(), expiresAt: editingAnnouncementDraft.expiresAt.trim() || undefined }
          : announcement,
      ),
    }));
    handleAnnouncementEditCancel();
  }

  function handleAnnouncementDelete(announcementId: string) {
    if (typeof window !== "undefined" && !window.confirm("Delete this announcement?")) return;
    updateSelectedCohort((cohort) => ({ ...cohort, announcements: cohort.announcements.filter((a) => a.id !== announcementId) }));
    if (editingAnnouncementId === announcementId) handleAnnouncementEditCancel();
  }

  function handleAnnouncementEditCancel() {
    setEditingAnnouncementId(null);
    setEditingAnnouncementDraft(emptyAnnouncementDraft());
  }

  function handleAnnouncementPin(announcementId: string) {
    updateSelectedCohort((cohort) => ({
      ...cohort,
      announcements: cohort.announcements.map((a) => (a.id === announcementId ? { ...a, pinned: !a.pinned } : a)),
    }));
  }

  function bulkAttendance(classId: string, nextState: AttendanceState) {
    if (!selectedCohort || !classId) return;
    updateSelectedCohort((cohort) => ({
      ...cohort,
      students: cohort.students.map((student) => ({
        ...student,
        attendance: { ...student.attendance, [classId]: nextState },
      })),
    }));
  }

  if (!selectedCohort) return null;

  /* ── derived data ── */

  const activeStudentCount = selectedCohort.students.filter((s) => (s.status ?? "active") === "active").length;
  const overallRate = getOverallAttendanceRate(selectedCohort);
  const totalPending = getTotalPendingCount(selectedCohort);
  const activeAnnouncementCount = getActiveAnnouncementCount(selectedCohort.announcements);
  const priorityClass = getPriorityClass(selectedCohort.classes);
  const sortedSessions = [...selectedCohort.classes].sort((a, b) => getSessionTimestamp(a) - getSessionTimestamp(b));
  const pinnedAnnouncements = selectedCohort.announcements.filter((a) => a.pinned);
  const recentAnnouncements = selectedCohort.announcements.filter((a) => !a.pinned).slice(0, 5);
  const editingAnnouncement = selectedCohort.announcements.find((a) => a.id === editingAnnouncementId);

  return (
    <>
      <style>{`
        .cd-stack { display: grid; gap: 12px; }
        .cd-metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
        .cd-quicknav { display: flex; gap: 8px; flex-wrap: wrap; }
        .cd-session-table { display: grid; gap: 0; border-radius: 14px; overflow: hidden; border: 1px solid ${ADMIN_THEME.borderSoft}; }
        .cd-session-row { display: grid; grid-template-columns: minmax(120px, 180px) minmax(0, 1fr) 110px minmax(140px, 200px) 110px; gap: 0; align-items: center; padding: 0; border-bottom: 1px solid ${ADMIN_THEME.borderSoft}; }
        .cd-session-row:last-child { border-bottom: none; }
        .cd-session-cell { padding: 10px 12px; font-size: 12px; color: ${ADMIN_THEME.heading}; }
        .cd-session-header { background: ${ADMIN_THEME.surfaceSoft}; }
        .cd-session-header .cd-session-cell { color: ${ADMIN_THEME.subtle}; font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 8px 12px; }
        .cd-expand-panel { padding: 12px 16px; background: ${ADMIN_THEME.surfaceSoft}; border-bottom: 1px solid ${ADMIN_THEME.borderSoft}; display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
        .cd-announce-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 8px; }
        .cd-form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
        .cd-full-span { grid-column: 1 / -1; }
        @media (max-width: 980px) {
          .cd-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .cd-session-row { grid-template-columns: minmax(100px, 140px) minmax(0, 1fr) 100px minmax(100px, 160px); }
          .cd-session-row > .cd-session-cell:nth-child(5) { display: none; }
          .cd-session-header > .cd-session-cell:nth-child(5) { display: none; }
          .cd-announce-grid { grid-template-columns: 1fr; }
          .cd-form-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .cd-metrics { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      <div className="cd-stack">
        {/* ═══ 1. COMMAND BAR ═══ */}
        <Surface accent style={{ padding: "16px" }}>
          <div style={{ display: "grid", gap: "12px" }}>
            {/* back + title row */}
            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", alignItems: "flex-start" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", flexWrap: "wrap" }}>
                {onBackToLanding ? (
                  <button
                    type="button"
                    onClick={onBackToLanding}
                    style={{ width: "36px", height: "36px", borderRadius: "12px", border: `1px solid ${ADMIN_THEME.border}`, backgroundColor: ADMIN_THEME.surface, color: ADMIN_THEME.heading, display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 }}
                  >
                    <ArrowLeft size={16} />
                  </button>
                ) : null}
                <div style={{ display: "grid", gap: "4px" }}>
                  <p style={{ color: ADMIN_THEME.accent, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", margin: 0 }}>Cohort Overview</p>
                  <h2 style={{ color: ADMIN_THEME.heading, fontSize: "24px", fontFamily: "var(--font-heading)", fontWeight: 900, margin: 0, lineHeight: 1 }}>
                    {selectedCohort.name}
                  </h2>
                  <p style={{ color: ADMIN_THEME.muted, fontSize: "12px", margin: 0 }}>
                    {selectedCohort.program} · Coach {selectedCohort.coach} · {selectedCohort.room}
                  </p>
                </div>
              </div>

              {/* meta + switcher */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                <CohortSwitcher
                  cohorts={cohorts}
                  selectedCohortId={selectedCohort.id}
                  onSelect={(cohortId) => {
                    setSelectedCohortId(cohortId);
                    onSelectCohort?.(cohortId);
                  }}
                />
                <span style={{ padding: "5px 8px", borderRadius: "999px", border: `1px solid ${ADMIN_THEME.accentBorder}`, backgroundColor: ADMIN_THEME.accentBg, color: ADMIN_THEME.accent, fontSize: "10px", textTransform: "uppercase" }}>
                  {selectedCohort.cadence}
                </span>
                <span style={{ padding: "5px 8px", borderRadius: "999px", border: `1px solid ${ADMIN_THEME.border}`, backgroundColor: ADMIN_THEME.surface, color: ADMIN_THEME.muted, fontSize: "10px", textTransform: "uppercase" }}>
                  {activeStudentCount}/{selectedCohort.capacity} seats
                </span>
              </div>
            </div>

            {/* quick nav row */}
            <div className="cd-quicknav">
              {onOpenCohortManagement ? (
                <QuickNavButton icon={<Users size={14} />} label="Manage Students" onClick={() => onOpenCohortManagement(selectedCohort.id)} />
              ) : null}
              {onOpenTeachingOperations ? (
                <QuickNavButton icon={<CalendarDays size={14} />} label="Schedule & Syllabus" onClick={() => onOpenTeachingOperations(selectedCohort.id)} />
              ) : null}
              {onOpenCohortReports ? (
                <QuickNavButton icon={<FileText size={14} />} label="Student Progress" onClick={() => onOpenCohortReports(selectedCohort.id)} />
              ) : null}
              {onOpenAttendance && priorityClass ? (
                <QuickNavButton
                  icon={<CheckCircle2 size={14} />}
                  label="Full Attendance View"
                  onClick={() => onOpenAttendance({ cohortId: selectedCohort.id, classId: priorityClass.id })}
                />
              ) : null}
            </div>
          </div>
        </Surface>

        {/* ═══ 2. METRICS STRIP ═══ */}
        <div className="cd-metrics">
          <MetricTile
            icon={<Users size={16} />}
            label="Active Students"
            value={`${activeStudentCount}`}
          />
          <MetricTile
            icon={<CheckCircle2 size={16} />}
            label="Attendance Rate"
            value={overallRate !== null ? `${overallRate}%` : "—"}
          />
          <MetricTile
            icon={<Clock3 size={16} />}
            label="Pending Actions"
            value={`${totalPending}`}
            accentValue={totalPending > 0}
          />
          <MetricTile
            icon={<Megaphone size={16} />}
            label="Announcements"
            value={`${activeAnnouncementCount}`}
          />
        </div>

        {/* ═══ 3. PRIORITY SESSION ═══ */}
        {priorityClass ? (() => {
          const priorityCounts = getSessionAttendanceCounts(selectedCohort.students, priorityClass.id);
          const isPast = getSessionTimestamp(priorityClass) < Date.now();

          return (
            <Surface style={{ padding: "16px" }}>
              <div style={{ display: "grid", gap: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", alignItems: "flex-start" }}>
                  <div style={{ display: "grid", gap: "4px" }}>
                    <p style={{ color: ADMIN_THEME.accent, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", margin: 0 }}>
                      {isPast ? "Most Recent Session" : "Next Up"}
                    </p>
                    <h3 style={{ color: ADMIN_THEME.heading, fontSize: "20px", fontFamily: "var(--font-heading)", fontWeight: 900, margin: 0, lineHeight: 1 }}>
                      {priorityClass.topic}
                    </h3>
                    <p style={{ color: ADMIN_THEME.muted, fontSize: "12px", margin: 0 }}>
                      {formatDateTime(priorityClass.date, priorityClass.time)} · {priorityClass.track} · Coach {priorityClass.coach}
                    </p>
                  </div>

                  {priorityCounts.pending > 0 ? (
                    <span style={{ padding: "6px 12px", borderRadius: "999px", border: `1px solid ${ADMIN_THEME.accentBorder}`, backgroundColor: ADMIN_THEME.accentBg, color: ADMIN_THEME.accent, fontSize: "11px", fontWeight: 800, textTransform: "uppercase" }}>
                      {priorityCounts.pending} pending
                    </span>
                  ) : (
                    <span style={{ padding: "6px 12px", borderRadius: "999px", border: "1px solid rgba(34,197,94,0.22)", backgroundColor: "rgba(34,197,94,0.10)", color: "#247A44", fontSize: "11px", fontWeight: 800, textTransform: "uppercase" }}>
                      All marked
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                  <AttendanceBar counts={priorityCounts} />
                </div>

                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  <span style={pillSummaryStyle("present")}>Present {priorityCounts.present}</span>
                  <span style={pillSummaryStyle("late")}>Late {priorityCounts.late}</span>
                  <span style={pillSummaryStyle("absent")}>Absent {priorityCounts.absent}</span>
                  <span style={pillSummaryStyle("pending")}>Pending {priorityCounts.pending}</span>
                </div>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {onOpenAttendance ? (
                    <ActionButton onClick={() => onOpenAttendance({ cohortId: selectedCohort.id, classId: priorityClass.id })} style={{ minWidth: "160px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        Manage Attendance <ArrowRight size={15} />
                      </span>
                    </ActionButton>
                  ) : null}
                  <ActionButton secondary onClick={() => bulkAttendance(priorityClass.id, "present")} style={{ minWidth: "120px" }}>
                    All Present
                  </ActionButton>
                  <ActionButton secondary onClick={() => bulkAttendance(priorityClass.id, "absent")} style={{ minWidth: "120px" }}>
                    All Absent
                  </ActionButton>
                </div>
              </div>
            </Surface>
          );
        })() : (
          <Surface style={{ padding: "16px" }}>
            <div style={{ padding: "12px", borderRadius: "14px", border: `1px dashed ${ADMIN_THEME.border}`, backgroundColor: ADMIN_THEME.surfaceSoft, display: "grid", gap: "8px" }}>
              <p style={{ color: ADMIN_THEME.heading, fontSize: "14px", fontWeight: 800, margin: 0 }}>No sessions scheduled yet.</p>
              <p style={{ color: ADMIN_THEME.muted, fontSize: "12px", lineHeight: 1.5, margin: 0 }}>Schedule the first class to start tracking attendance.</p>
              {onOpenTeachingOperations ? (
                <ActionButton onClick={() => onOpenTeachingOperations(selectedCohort.id)} style={{ justifySelf: "start", minWidth: "150px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <Plus size={15} /> Schedule Session
                  </span>
                </ActionButton>
              ) : null}
            </div>
          </Surface>
        )}

        {/* ═══ 4. ALL SESSIONS TABLE ═══ */}
        {sortedSessions.length > 0 ? (
          <Surface style={{ padding: "16px" }}>
            <div style={{ display: "grid", gap: "10px" }}>
              <SectionTitle
                eyebrow="Sessions"
                title="Attendance By Session"
                detail={`${sortedSessions.length} session${sortedSessions.length === 1 ? "" : "s"} scheduled`}
              />

              <div className="cd-session-table">
                <div className="cd-session-row cd-session-header">
                  <div className="cd-session-cell">Date</div>
                  <div className="cd-session-cell">Topic</div>
                  <div className="cd-session-cell">Coach</div>
                  <div className="cd-session-cell">Attendance</div>
                  <div className="cd-session-cell">Actions</div>
                </div>

                {sortedSessions.map((session) => {
                  const counts = getSessionAttendanceCounts(selectedCohort.students, session.id);
                  const isExpanded = expandedSessionId === session.id;
                  const isPriority = priorityClass?.id === session.id;

                  return (
                    <div key={session.id}>
                      <div
                        className="cd-session-row"
                        style={{
                          backgroundColor: isPriority ? "rgba(200,52,46,0.03)" : ADMIN_THEME.surface,
                          cursor: "pointer",
                        }}
                        onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                      >
                        <div className="cd-session-cell">
                          <div style={{ display: "grid", gap: "2px" }}>
                            <span style={{ fontSize: "12px", fontWeight: 700, color: ADMIN_THEME.heading }}>
                              {formatDateTime(session.date, session.time)}
                            </span>
                            {isPriority ? (
                              <span style={{ color: ADMIN_THEME.accent, fontSize: "9px", fontWeight: 800, textTransform: "uppercase" }}>
                                {getSessionTimestamp(session) >= Date.now() ? "Next up" : "Most recent"}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <div className="cd-session-cell" style={{ fontWeight: 700 }}>
                          {session.topic}
                          <div style={{ color: ADMIN_THEME.muted, fontSize: "11px", fontWeight: 400 }}>{session.track}</div>
                        </div>
                        <div className="cd-session-cell" style={{ color: ADMIN_THEME.muted, fontSize: "11px" }}>
                          {session.coach}
                        </div>
                        <div className="cd-session-cell">
                          <div style={{ display: "grid", gap: "4px" }}>
                            <AttendanceBar counts={counts} />
                            <div style={{ display: "flex", gap: "6px", fontSize: "10px" }}>
                              <span style={{ color: ATTENDANCE_COLORS.present.text }}>{counts.present}P</span>
                              <span style={{ color: ATTENDANCE_COLORS.late.text }}>{counts.late}L</span>
                              <span style={{ color: ATTENDANCE_COLORS.absent.text }}>{counts.absent}A</span>
                              {counts.pending > 0 ? <span style={{ color: ATTENDANCE_COLORS.pending.text }}>{counts.pending}?</span> : null}
                            </div>
                          </div>
                        </div>
                        <div className="cd-session-cell">
                          {onOpenAttendance ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenAttendance({ cohortId: selectedCohort.id, classId: session.id });
                              }}
                              style={{
                                padding: "5px 10px",
                                borderRadius: "8px",
                                border: `1px solid ${counts.pending > 0 ? ADMIN_THEME.accentBorder : ADMIN_THEME.border}`,
                                backgroundColor: counts.pending > 0 ? ADMIN_THEME.accentBg : ADMIN_THEME.surface,
                                color: counts.pending > 0 ? ADMIN_THEME.accent : ADMIN_THEME.heading,
                                fontSize: "10px",
                                fontWeight: 800,
                                textTransform: "uppercase",
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {counts.pending > 0 ? "Mark Now" : "Review"}
                            </button>
                          ) : null}
                        </div>
                      </div>

                      {isExpanded ? (
                        <div className="cd-expand-panel">
                          <ActionButton secondary onClick={() => bulkAttendance(session.id, "present")} style={{ minWidth: "110px", minHeight: "32px", fontSize: "10px" }}>
                            All Present
                          </ActionButton>
                          <ActionButton secondary onClick={() => bulkAttendance(session.id, "absent")} style={{ minWidth: "110px", minHeight: "32px", fontSize: "10px" }}>
                            All Absent
                          </ActionButton>
                          {onOpenAttendance ? (
                            <ActionButton onClick={() => onOpenAttendance({ cohortId: selectedCohort.id, classId: session.id })} style={{ minWidth: "150px", minHeight: "32px", fontSize: "10px" }}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                Open Attendance <ArrowRight size={13} />
                              </span>
                            </ActionButton>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </Surface>
        ) : null}

        {/* ═══ 5. ANNOUNCEMENTS ═══ */}
        <Surface style={{ padding: "16px" }}>
          <div style={{ display: "grid", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", alignItems: "flex-start" }}>
              <SectionTitle
                eyebrow="Announcements"
                title="Cohort Updates"
                detail={`${selectedCohort.announcements.length} total · ${activeAnnouncementCount} active`}
              />
              <ActionButton
                secondary={showAnnouncementForm}
                onClick={() => {
                  setShowAnnouncementForm(!showAnnouncementForm);
                  if (!showAnnouncementForm) setNewAnnouncement(emptyAnnouncementDraft());
                }}
                style={{ minWidth: "160px" }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  {showAnnouncementForm ? <X size={15} /> : <Plus size={15} />}
                  {showAnnouncementForm ? "Cancel" : "New Announcement"}
                </span>
              </ActionButton>
            </div>

            {/* compose form (toggled) */}
            {showAnnouncementForm ? (
              <div style={{ padding: "16px", borderRadius: "16px", border: `1px solid ${ADMIN_THEME.accentBorder}`, backgroundColor: "rgba(200,52,46,0.03)" }}>
                <form onSubmit={handleAnnouncementSubmit} className="cd-form-grid">
                  <div>
                    <FieldLabel>Target</FieldLabel>
                    <FieldShell>
                      <select
                        value={newAnnouncement.classId ?? ""}
                        onChange={(e) => setNewAnnouncement((c) => ({ ...c, classId: e.target.value }))}
                        style={inputStyle}
                      >
                        <option value="">Whole Cohort</option>
                        {selectedCohort.classes.map((session) => (
                          <option key={session.id} value={session.id}>
                            {formatDateTime(session.date, session.time)} · {session.topic}
                          </option>
                        ))}
                      </select>
                    </FieldShell>
                  </div>
                  <div>
                    <FieldLabel>Expires On</FieldLabel>
                    <FieldShell>
                      <input
                        type="date"
                        value={newAnnouncement.expiresAt}
                        onChange={(e) => setNewAnnouncement((c) => ({ ...c, expiresAt: e.target.value }))}
                        style={inputStyle}
                      />
                    </FieldShell>
                  </div>
                  <div className="cd-full-span">
                    <FieldLabel>Title</FieldLabel>
                    <FieldShell>
                      <input
                        value={newAnnouncement.title}
                        onChange={(e) => setNewAnnouncement((c) => ({ ...c, title: e.target.value }))}
                        placeholder="Reminder, update, or coaching note"
                        style={inputStyle}
                      />
                    </FieldShell>
                  </div>
                  <div className="cd-full-span">
                    <FieldLabel>Message</FieldLabel>
                    <FieldShell>
                      <textarea
                        value={newAnnouncement.message}
                        onChange={(e) => setNewAnnouncement((c) => ({ ...c, message: e.target.value }))}
                        placeholder="Write the update for this cohort."
                        style={textareaStyle}
                      />
                    </FieldShell>
                  </div>
                  <div className="cd-full-span" style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                    <ActionButton secondary type="button" onClick={() => setShowAnnouncementForm(false)} style={{ minWidth: "100px" }}>
                      Cancel
                    </ActionButton>
                    <ActionButton type="submit" style={{ minWidth: "150px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <Megaphone size={15} /> Send
                      </span>
                    </ActionButton>
                  </div>
                </form>
              </div>
            ) : null}

            {/* pinned announcements */}
            {pinnedAnnouncements.length > 0 ? (
              <div style={{ display: "grid", gap: "6px" }}>
                <p style={{ color: ADMIN_THEME.accent, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", margin: 0 }}>Pinned</p>
                <div className="cd-announce-grid">
                  {pinnedAnnouncements.map((announcement) => (
                    <AnnouncementCard
                      key={announcement.id}
                      announcement={announcement}
                      classes={selectedCohort.classes}
                      isEditing={editingAnnouncementId === announcement.id}
                      onPin={() => handleAnnouncementPin(announcement.id)}
                      onEdit={() => handleAnnouncementEdit(announcement)}
                      onDelete={() => handleAnnouncementDelete(announcement.id)}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {/* recent announcements */}
            {recentAnnouncements.length > 0 ? (
              <div style={{ display: "grid", gap: "6px" }}>
                {pinnedAnnouncements.length > 0 ? (
                  <p style={{ color: ADMIN_THEME.subtle, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", margin: 0 }}>Recent</p>
                ) : null}
                <div className="cd-announce-grid">
                  {recentAnnouncements.map((announcement) => (
                    <AnnouncementCard
                      key={announcement.id}
                      announcement={announcement}
                      classes={selectedCohort.classes}
                      isEditing={editingAnnouncementId === announcement.id}
                      onPin={() => handleAnnouncementPin(announcement.id)}
                      onEdit={() => handleAnnouncementEdit(announcement)}
                      onDelete={() => handleAnnouncementDelete(announcement.id)}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {selectedCohort.announcements.length === 0 ? (
              <p style={{ color: ADMIN_THEME.subtle, fontSize: "12px", lineHeight: 1.45, margin: 0 }}>
                No announcements yet. Create one to notify this cohort.
              </p>
            ) : null}
          </div>
        </Surface>
      </div>

      {/* ═══ EDIT ANNOUNCEMENT MODAL ═══ */}
      {editingAnnouncement ? (
        <div
          onClick={handleAnnouncementEditCancel}
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(22,18,14,0.38)", display: "grid", placeItems: "center", padding: "24px", zIndex: 45 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "min(680px, 100%)", padding: "18px", borderRadius: "20px", background: "linear-gradient(180deg, #FFFFFF 0%, #FBF8F4 100%)", border: `1px solid ${ADMIN_THEME.border}`, boxShadow: "0 24px 70px rgba(22,18,14,0.22)", display: "grid", gap: "12px" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start" }}>
              <div style={{ display: "grid", gap: "4px" }}>
                <p style={{ color: ADMIN_THEME.accent, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", margin: 0 }}>Cohort Update</p>
                <h3 style={{ color: ADMIN_THEME.heading, fontSize: "24px", fontFamily: "var(--font-heading)", margin: 0, lineHeight: 1 }}>Edit Announcement</h3>
                <p style={{ color: ADMIN_THEME.muted, fontSize: "12px", margin: 0 }}>Update the title, target, or message.</p>
              </div>
              <button
                type="button"
                onClick={handleAnnouncementEditCancel}
                style={{ width: "34px", height: "34px", borderRadius: "999px", border: `1px solid ${ADMIN_THEME.border}`, backgroundColor: ADMIN_THEME.surface, color: ADMIN_THEME.heading, display: "grid", placeItems: "center", cursor: "pointer" }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAnnouncementEditSubmit} className="cd-form-grid">
              <div>
                <FieldLabel>Target</FieldLabel>
                <FieldShell>
                  <select
                    value={editingAnnouncementDraft.classId ?? ""}
                    onChange={(e) => setEditingAnnouncementDraft((c) => ({ ...c, classId: e.target.value }))}
                    style={inputStyle}
                  >
                    <option value="">Whole Cohort</option>
                    {selectedCohort.classes.map((session) => (
                      <option key={session.id} value={session.id}>
                        {formatDateTime(session.date, session.time)} · {session.topic}
                      </option>
                    ))}
                  </select>
                </FieldShell>
              </div>
              <div>
                <FieldLabel>Expires On</FieldLabel>
                <FieldShell>
                  <input
                    type="date"
                    value={editingAnnouncementDraft.expiresAt}
                    onChange={(e) => setEditingAnnouncementDraft((c) => ({ ...c, expiresAt: e.target.value }))}
                    style={inputStyle}
                  />
                </FieldShell>
              </div>
              <div className="cd-full-span">
                <FieldLabel>Title</FieldLabel>
                <FieldShell>
                  <input
                    value={editingAnnouncementDraft.title}
                    onChange={(e) => setEditingAnnouncementDraft((c) => ({ ...c, title: e.target.value }))}
                    placeholder="Session reminder, arrival note, or parent update"
                    style={inputStyle}
                  />
                </FieldShell>
              </div>
              <div className="cd-full-span">
                <FieldLabel>Message</FieldLabel>
                <FieldShell>
                  <textarea
                    value={editingAnnouncementDraft.message}
                    onChange={(e) => setEditingAnnouncementDraft((c) => ({ ...c, message: e.target.value }))}
                    placeholder="Write the exact update this cohort should receive."
                    style={textareaStyle}
                  />
                </FieldShell>
              </div>
              <div className="cd-full-span" style={{ display: "flex", justifyContent: "flex-end", gap: "10px", flexWrap: "wrap" }}>
                <ActionButton secondary type="button" onClick={handleAnnouncementEditCancel} style={{ minWidth: "120px" }}>
                  Cancel
                </ActionButton>
                <ActionButton type="submit" style={{ minWidth: "162px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                    <Megaphone size={16} /> Save Update
                  </span>
                </ActionButton>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

/* ── Announcement card sub-component ── */

function AnnouncementCard({
  announcement,
  classes,
  isEditing,
  onPin,
  onEdit,
  onDelete,
}: {
  announcement: AnnouncementEntry;
  classes: Cohort["classes"];
  isEditing: boolean;
  onPin: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isExpired = announcement.expiresAt ? new Date(announcement.expiresAt) < new Date() : false;

  return (
    <div
      style={{
        padding: "12px",
        borderRadius: "14px",
        backgroundColor: ADMIN_THEME.surface,
        border: isEditing
          ? `1px solid ${ADMIN_THEME.accentBorder}`
          : announcement.pinned
            ? "1px solid rgba(200,52,46,0.15)"
            : `1px solid ${ADMIN_THEME.borderSoft}`,
        opacity: isExpired ? 0.6 : 1,
        display: "grid",
        gap: "6px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", alignItems: "flex-start" }}>
        <div style={{ display: "grid", gap: "2px" }}>
          <p style={{ color: ADMIN_THEME.accent, fontSize: "10px", textTransform: "uppercase", margin: 0 }}>
            {announcementTargetLabel(announcement.classId, classes)}
          </p>
          <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ color: ADMIN_THEME.subtle, fontSize: "10px", textTransform: "uppercase" }}>
              {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(announcement.createdAt))}
            </span>
            {announcement.pinned ? <span style={{ color: ADMIN_THEME.accent, fontSize: "9px", fontWeight: 800, textTransform: "uppercase" }}>Pinned</span> : null}
            {isExpired ? <span style={{ color: ADMIN_THEME.subtle, fontSize: "9px", fontWeight: 800, textTransform: "uppercase" }}>Expired</span> : null}
          </div>
        </div>

        <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
          {([
            { label: announcement.pinned ? "Unpin" : "Pin", action: onPin, highlight: announcement.pinned },
            { label: "Edit", action: onEdit, highlight: isEditing },
            { label: "Del", action: onDelete, highlight: true },
          ] as const).map((btn) => (
            <button
              key={btn.label}
              type="button"
              onClick={btn.action}
              style={{
                minHeight: "22px",
                padding: "0 7px",
                borderRadius: "999px",
                border: `1px solid ${btn.highlight ? ADMIN_THEME.accentBorder : ADMIN_THEME.border}`,
                backgroundColor: btn.highlight ? ADMIN_THEME.accentBg : ADMIN_THEME.surface,
                color: btn.highlight ? ADMIN_THEME.accent : ADMIN_THEME.muted,
                fontSize: "9px",
                fontWeight: 800,
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      <h4 style={{ color: ADMIN_THEME.heading, fontSize: "14px", fontWeight: 800, margin: 0 }}>{announcement.title}</h4>
      <p style={{ color: ADMIN_THEME.muted, fontSize: "12px", lineHeight: 1.4, margin: 0 }}>{announcement.message}</p>
    </div>
  );
}
