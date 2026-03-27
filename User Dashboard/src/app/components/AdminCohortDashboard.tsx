import { useEffect, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  FileText,
  GraduationCap,
  Megaphone,
  Users,
  X,
} from "lucide-react";
import {
  ActionButton,
  ADMIN_THEME,
  MetricCard,
  SectionTitle,
  STORAGE_KEY,
  Surface,
  formatDateTime,
  loadCohorts,
  type AnnouncementEntry,
  type AttendanceState,
  type Cohort,
} from "./AdminDashboard";

const nestedCardStyle: CSSProperties = {
  border: `1px solid ${ADMIN_THEME.borderSoft}`,
  backgroundColor: ADMIN_THEME.surfaceSoft,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.75)",
};

const ATTENDANCE_COLORS: Record<AttendanceState, { bg: string; text: string; border: string }> = {
  pending: { bg: "#F3EEE8", text: "#7E7063", border: "rgba(73,57,42,0.12)" },
  present: { bg: "rgba(34,197,94,0.10)", text: "#247A44", border: "rgba(34,197,94,0.22)" },
  late: { bg: "rgba(245,158,11,0.12)", text: "#9D6100", border: "rgba(245,158,11,0.22)" },
  absent: { bg: "rgba(200,52,46,0.10)", text: "#B6332C", border: "rgba(200,52,46,0.22)" },
};

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function getSessionTimestamp(session: Cohort["classes"][number]) {
  return new Date(`${session.date}T${session.time}:00`).getTime();
}

function getPriorityClass(classes: Cohort["classes"]) {
  const ordered = [...classes].sort((left, right) => getSessionTimestamp(left) - getSessionTimestamp(right));
  const now = Date.now();

  return ordered.find((session) => getSessionTimestamp(session) >= now) ?? ordered[ordered.length - 1];
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label
      style={{
        display: "block",
        color: ADMIN_THEME.subtle,
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0px",
        textTransform: "uppercase",
        marginBottom: "8px",
      }}
    >
      {children}
    </label>
  );
}

function FieldShell({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        backgroundColor: ADMIN_THEME.inputBg,
        border: `1px solid ${ADMIN_THEME.inputBorder}`,
        borderRadius: "14px",
        padding: "0 14px",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.75)",
      }}
    >
      {children}
    </div>
  );
}

const inputStyle: CSSProperties = {
  width: "100%",
  height: "46px",
  background: "transparent",
  border: "none",
  outline: "none",
  color: ADMIN_THEME.heading,
  fontSize: "14px",
  fontFamily: "var(--font-body)",
};

const textareaStyle: CSSProperties = {
  width: "100%",
  minHeight: "96px",
  padding: "12px 0",
  resize: "vertical",
  background: "transparent",
  border: "none",
  outline: "none",
  color: ADMIN_THEME.heading,
  fontSize: "14px",
  fontFamily: "var(--font-body)",
};

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

function announcementTargetLabel(classId: string | undefined, classes: Cohort["classes"]) {
  if (!classId) {
    return "Whole cohort";
  }

  const targetClass = classes.find((session) => session.id === classId);

  if (!targetClass) {
    return "Archived class target";
  }

  return `${formatDateTime(targetClass.date, targetClass.time)} · ${targetClass.topic}`;
}

function emptyAnnouncementDraft(classId = "") {
  return {
    classId,
    title: "",
    message: "",
  };
}

interface AdminCohortDashboardProps {
  initialCohortId?: string;
  onOpenAttendance?: (context: { cohortId: string; classId: string }) => void;
  onOpenCohortManagement?: (cohortId: string) => void;
  onOpenTeachingOperations?: (cohortId: string) => void;
  onBackToLanding?: () => void;
}

export function AdminCohortDashboard({
  initialCohortId,
  onOpenAttendance,
  onOpenCohortManagement,
  onOpenTeachingOperations,
  onBackToLanding,
}: AdminCohortDashboardProps) {
  const [cohorts, setCohorts] = useState<Cohort[]>(() => loadCohorts());
  const [selectedCohortId, setSelectedCohortId] = useState(() => initialCohortId ?? loadCohorts()[0]?.id ?? "");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [newAnnouncement, setNewAnnouncement] = useState<{
    classId: string | null;
    title: string;
    message: string;
  }>(() => emptyAnnouncementDraft());
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);
  const [editingAnnouncementDraft, setEditingAnnouncementDraft] = useState<{
    classId: string | null;
    title: string;
    message: string;
  }>(() => emptyAnnouncementDraft());

  const selectedCohort = cohorts.find((cohort) => cohort.id === selectedCohortId) ?? cohorts[0];

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cohorts));
  }, [cohorts]);

  useEffect(() => {
    if (initialCohortId && cohorts.some((cohort) => cohort.id === initialCohortId)) {
      setSelectedCohortId(initialCohortId);
    }
  }, [cohorts, initialCohortId]);

  useEffect(() => {
    if (!selectedCohort) {
      return;
    }

    if (!selectedClassId || !selectedCohort.classes.some((session) => session.id === selectedClassId)) {
      setSelectedClassId(selectedCohort.classes[0]?.id ?? "");
    }
  }, [selectedClassId, selectedCohort]);

  useEffect(() => {
    if (!selectedCohort) {
      return;
    }

    setNewAnnouncement((current) => {
      const nextClassId =
        current.classId === null
          ? selectedClassId || ""
          : current.classId && selectedCohort.classes.some((session) => session.id === current.classId)
            ? current.classId
            : selectedClassId || "";

      if (nextClassId === current.classId) {
        return current;
      }

      return {
        ...current,
        classId: nextClassId,
      };
    });
  }, [selectedClassId, selectedCohort]);

  function updateSelectedCohort(mutator: (cohort: Cohort) => Cohort) {
    if (!selectedCohort) {
      return;
    }

    setCohorts((current) =>
      current.map((cohort) => (cohort.id === selectedCohort.id ? mutator(cohort) : cohort)),
    );
  }

  function handleAnnouncementSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedCohort || !newAnnouncement.title.trim() || !newAnnouncement.message.trim()) {
      return;
    }

    const title = newAnnouncement.title.trim();
    const message = newAnnouncement.message.trim();
    const classId = newAnnouncement.classId || undefined;

    updateSelectedCohort((cohort) => ({
      ...cohort,
      announcements: [
        {
          id: createId("announcement"),
          classId,
          title,
          message,
          createdAt: new Date().toISOString(),
        },
        ...cohort.announcements,
      ],
    }));

    setNewAnnouncement(emptyAnnouncementDraft(selectedClassId || ""));
  }

  function handleAnnouncementEdit(announcement: AnnouncementEntry) {
    setEditingAnnouncementId(announcement.id);
    setEditingAnnouncementDraft({
      classId: announcement.classId ?? "",
      title: announcement.title,
      message: announcement.message,
    });
  }

  function handleAnnouncementEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedCohort || !editingAnnouncementId || !editingAnnouncementDraft.title.trim() || !editingAnnouncementDraft.message.trim()) {
      return;
    }

    const title = editingAnnouncementDraft.title.trim();
    const message = editingAnnouncementDraft.message.trim();
    const classId = editingAnnouncementDraft.classId || undefined;

    updateSelectedCohort((cohort) => ({
      ...cohort,
      announcements: cohort.announcements.map((announcement) =>
        announcement.id === editingAnnouncementId
          ? {
              ...announcement,
              classId,
              title,
              message,
            }
          : announcement,
      ),
    }));

    handleAnnouncementEditCancel();
  }

  function handleAnnouncementDelete(announcementId: string) {
    if (typeof window !== "undefined" && !window.confirm("Delete this announcement?")) {
      return;
    }

    updateSelectedCohort((cohort) => ({
      ...cohort,
      announcements: cohort.announcements.filter((announcement) => announcement.id !== announcementId),
    }));

    if (editingAnnouncementId === announcementId) {
      handleAnnouncementEditCancel();
    }
  }

  function handleAnnouncementEditCancel() {
    setEditingAnnouncementId(null);
    setEditingAnnouncementDraft(emptyAnnouncementDraft());
  }

  function bulkAttendance(nextState: AttendanceState) {
    if (!selectedCohort || !selectedClassId) {
      return;
    }

    updateSelectedCohort((cohort) => ({
      ...cohort,
      students: cohort.students.map((student) => ({
        ...student,
        attendance: {
          ...student.attendance,
          [selectedClassId]: nextState,
        },
      })),
    }));
  }

  if (!selectedCohort) {
    return null;
  }

  const selectedClass =
    selectedCohort.classes.find((session) => session.id === selectedClassId) ?? selectedCohort.classes[0];
  const priorityClass = getPriorityClass(selectedCohort.classes);
  const completedSyllabus = selectedCohort.syllabus.filter((item) => item.status === "complete").length;
  const liveSyllabus = selectedCohort.syllabus.filter((item) => item.status === "live").length;
  const occupiedSeats = `${selectedCohort.students.length}/${selectedCohort.capacity}`;
  const paceCounts = selectedCohort.students.reduce(
    (counts, student) => {
      if (student.pace === "Fast Track") {
        counts.fastTrack += 1;
      } else if (student.pace === "Needs Support") {
        counts.needsSupport += 1;
      } else {
        counts.steady += 1;
      }

      return counts;
    },
    { steady: 0, fastTrack: 0, needsSupport: 0 },
  );
  const attendanceCounts = selectedCohort.students.reduce(
    (counts, student) => {
      const state = selectedClass ? student.attendance[selectedClass.id] ?? "pending" : "pending";
      counts[state] += 1;
      return counts;
    },
    { pending: 0, present: 0, late: 0, absent: 0 },
  );
  const classLinkedAnnouncements = selectedCohort.announcements.filter((announcement) => Boolean(announcement.classId)).length;
  const availableSeats = Math.max(selectedCohort.capacity - selectedCohort.students.length, 0);
  const teachingLeadModule = selectedCohort.syllabus.find((item) => item.status === "live") ?? selectedCohort.syllabus[0];
  const announcementCardMinHeight = 118;
  const announcementListGap = 6;
  const hasAnnouncements = selectedCohort.announcements.length > 0;
  const editingAnnouncement = selectedCohort.announcements.find((announcement) => announcement.id === editingAnnouncementId);
  const announcementScrollLimit = 3;
  const announcementListMaxHeight =
    selectedCohort.announcements.length > announcementScrollLimit
      ? `${announcementCardMinHeight * announcementScrollLimit + announcementListGap * (announcementScrollLimit - 1)}px`
      : undefined;

  return (
    <>
      <style>{`
        .cohort-grid {
          display: grid;
          grid-template-columns: minmax(300px, 360px) minmax(0, 1fr);
          gap: 16px;
          align-items: start;
        }
        .cohort-metrics {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }
        .cohort-middle-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(280px, 360px);
          gap: 10px;
          align-items: start;
        }
        .cohort-rail-stack {
          display: grid;
          gap: 9px;
          align-content: start;
        }
        .cohort-stack {
          display: grid;
          gap: 10px;
          align-content: start;
        }
        .cohort-cta-stack {
          display: grid;
          gap: 10px;
          align-content: start;
        }
        .cohort-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }
        .cohort-full-span {
          grid-column: 1 / -1;
        }
        @media (max-width: 1120px) {
          .cohort-grid,
          .cohort-middle-grid,
          .cohort-metrics,
          .cohort-form-grid,
          .cohort-cta-stack {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div style={{ display: "grid", gap: "16px" }}>
        <Surface
          accent
          style={{
            padding: "28px",
            background:
              "radial-gradient(circle at top right, rgba(200,52,46,0.18), transparent 30%), linear-gradient(135deg, #FFFFFF 0%, #F8F4EF 100%)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "repeating-linear-gradient(120deg, transparent 0, transparent 18px, rgba(200,52,46,0.025) 18px, rgba(200,52,46,0.025) 20px)",
              pointerEvents: "none",
            }}
          />

          <div style={{ display: "flex", justifyContent: "space-between", gap: "18px", flexWrap: "wrap", position: "relative" }}>
            <div style={{ maxWidth: "760px", display: "grid", gap: "16px" }}>
              {onBackToLanding ? (
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <ActionButton secondary onClick={onBackToLanding} style={{ minWidth: "176px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                      <ArrowLeft size={16} /> Back To Cohorts
                    </span>
                  </ActionButton>
                </div>
              ) : null}

              <SectionTitle eyebrow="Cohort Dashboard" title={selectedCohort.name} detail={selectedCohort.program} />

              <p style={{ color: ADMIN_THEME.muted, fontSize: "16px", lineHeight: 1.7, margin: "0 0 18px 0" }}>
                Operate this cohort as its own desk. Attendance, announcements, and reporting stay here, while student operations
                and teaching planning now run through dedicated cohort workspaces to keep this dashboard lighter.
              </p>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <span style={{ padding: "8px 12px", borderRadius: "999px", border: `1px solid ${ADMIN_THEME.accentBorder}`, backgroundColor: ADMIN_THEME.accentBg, color: ADMIN_THEME.accent, fontSize: "12px", letterSpacing: "0px", textTransform: "uppercase" }}>
                  {selectedCohort.cadence}
                </span>
                <span style={{ padding: "8px 12px", borderRadius: "999px", border: `1px solid ${ADMIN_THEME.border}`, backgroundColor: ADMIN_THEME.surfaceSoft, color: ADMIN_THEME.muted, fontSize: "12px", letterSpacing: "0px", textTransform: "uppercase" }}>
                  {selectedCohort.room}
                </span>
                <span style={{ padding: "8px 12px", borderRadius: "999px", border: `1px solid ${ADMIN_THEME.border}`, backgroundColor: ADMIN_THEME.surfaceSoft, color: ADMIN_THEME.muted, fontSize: "12px", letterSpacing: "0px", textTransform: "uppercase" }}>
                  Coach {selectedCohort.coach}
                </span>
              </div>
            </div>

            <div
              style={{
                width: "min(316px, 100%)",
                minHeight: "295px",
                padding: "16px",
                borderRadius: "18px",
                border: `1px solid ${ADMIN_THEME.border}`,
                background: "linear-gradient(180deg, #FFFFFF 0%, #F7F2ED 100%)",
                boxShadow: "0 12px 30px rgba(70,46,25,0.08)",
                display: "grid",
                alignContent: "start",
              }}
            >
              <p style={{ color: ADMIN_THEME.subtle, fontSize: "10px", letterSpacing: "0px", textTransform: "uppercase", margin: "0 0 10px 0" }}>
                Current Focus
              </p>
              <h3 style={{ color: ADMIN_THEME.heading, fontSize: "26px", fontFamily: "var(--font-heading)", margin: "0 0 8px 0", lineHeight: 1 }}>
                {selectedClass ? selectedClass.track.toUpperCase() : selectedCohort.name.toUpperCase()}
              </h3>
              <p style={{ color: ADMIN_THEME.muted, fontSize: "14px", margin: "0 0 14px 0" }}>
                {selectedClass ? selectedClass.topic : selectedCohort.program}
              </p>
              <p style={{ color: ADMIN_THEME.subtle, fontSize: "13px", margin: 0 }}>
                {priorityClass ? `${formatDateTime(priorityClass.date, priorityClass.time)} · ${priorityClass.coach}` : "No class scheduled yet"}
              </p>
            </div>
          </div>
        </Surface>

        <div className="cohort-metrics">
          <MetricCard icon={<Users size={20} />} label="Seat Fill" value={occupiedSeats} note={`${paceCounts.fastTrack} fast track · ${paceCounts.steady} steady · ${paceCounts.needsSupport} support`} />
          <MetricCard icon={<CalendarDays size={20} />} label="Scheduled Sessions" value={String(selectedCohort.classes.length)} note={priorityClass ? `Next: ${formatDateTime(priorityClass.date, priorityClass.time)}` : "Add the next class to start the queue"} />
          <MetricCard icon={<FileText size={20} />} label="Reports Logged" value={String(selectedCohort.reports.length)} note="Coaching notes saved for this cohort" />
          <MetricCard icon={<GraduationCap size={20} />} label="Syllabus" value={`${completedSyllabus}/${selectedCohort.syllabus.length}`} note={liveSyllabus > 0 ? `${liveSyllabus} live modules in progress` : "No live modules flagged right now"} />
        </div>

        <div className="cohort-grid">
          <div className="cohort-rail-stack">
            <Surface
              style={{
                padding: "19px",
                alignSelf: "start",
                display: "grid",
                alignContent: "start",
              }}
            >
              <SectionTitle
                eyebrow="Announcement Log"
                title="Recent Updates"
                detail={!hasAnnouncements ? `${selectedCohort.announcements.length} stored` : undefined}
                subdetail={hasAnnouncements ? `${selectedCohort.announcements.length} stored` : undefined}
              />
              <div
                style={{
                  display: "grid",
                  gap: `${announcementListGap}px`,
                  maxHeight: announcementListMaxHeight,
                  overflowY: announcementListMaxHeight ? "auto" : undefined,
                  paddingRight: announcementListMaxHeight ? "2px" : undefined,
                }}
              >
                {!hasAnnouncements ? (
                  <p style={{ color: ADMIN_THEME.subtle, fontSize: "12px", lineHeight: 1.45, margin: 0 }}>
                    No cohort-specific announcements yet.
                  </p>
                ) : (
                  selectedCohort.announcements.map((announcement: AnnouncementEntry) => (
                    <div
                      key={announcement.id}
                      style={{
                        padding: "10px",
                        minHeight: `${announcementCardMinHeight}px`,
                        borderRadius: "16px",
                        ...nestedCardStyle,
                        border:
                          editingAnnouncementId === announcement.id
                            ? `1px solid ${ADMIN_THEME.accentBorder}`
                            : nestedCardStyle.border,
                      }}
                    >
                      <div style={{ display: "grid", gap: "4px", marginBottom: "5px" }}>
                        <div style={{ display: "grid", gap: "4px" }}>
                          <p style={{ color: ADMIN_THEME.accent, fontSize: "10px", letterSpacing: "0px", textTransform: "uppercase", margin: 0 }}>
                            {announcementTargetLabel(announcement.classId, selectedCohort.classes)}
                          </p>
                          <span style={{ color: ADMIN_THEME.subtle, fontSize: "10px", letterSpacing: "0px", textTransform: "uppercase", margin: 0 }}>
                            {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(announcement.createdAt))}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                          <button
                            type="button"
                            onClick={() => handleAnnouncementEdit(announcement)}
                            style={{
                              minHeight: "26px",
                              padding: "0 8px",
                              borderRadius: "999px",
                              border: `1px solid ${ADMIN_THEME.border}`,
                              backgroundColor:
                                editingAnnouncementId === announcement.id ? ADMIN_THEME.accentBg : ADMIN_THEME.surface,
                              color: ADMIN_THEME.heading,
                              fontSize: "9px",
                              fontWeight: 800,
                              letterSpacing: "0px",
                              textTransform: "uppercase",
                              cursor: "pointer",
                            }}
                          >
                            {editingAnnouncementId === announcement.id ? "Editing" : "Edit"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAnnouncementDelete(announcement.id)}
                            style={{
                              minHeight: "26px",
                              padding: "0 8px",
                              borderRadius: "999px",
                              border: `1px solid ${ADMIN_THEME.accentBorder}`,
                              backgroundColor: ADMIN_THEME.accentBg,
                              color: ADMIN_THEME.accent,
                              fontSize: "9px",
                              fontWeight: 800,
                              letterSpacing: "0px",
                              textTransform: "uppercase",
                              cursor: "pointer",
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <h4 style={{ color: ADMIN_THEME.heading, fontSize: "16px", fontFamily: "var(--font-body)", fontStyle: "italic", fontWeight: 800, margin: "0 0 4px 0" }}>
                        {announcement.title}
                      </h4>
                      <p style={{ color: ADMIN_THEME.muted, fontSize: "12px", lineHeight: 1.45, margin: 0 }}>{announcement.message}</p>
                    </div>
                  ))
                )}
              </div>
              {hasAnnouncements ? (
                <p style={{ color: ADMIN_THEME.subtle, fontSize: "10px", lineHeight: 1.45, margin: "6px 0 0 0" }}>
                  {classLinkedAnnouncements > 0
                    ? `${classLinkedAnnouncements} updates are tied to a specific scheduled class.`
                    : "All saved updates currently apply to the whole cohort."}
                </p>
              ) : null}
            </Surface>

            <Surface style={{ padding: "19px", alignSelf: "start" }}>
              <SectionTitle eyebrow="Class Timeline" title="Upcoming Sessions" subdetail={`${selectedCohort.classes.length} scheduled`} />
              <div style={{ display: "grid", gap: "8px" }}>
                {selectedCohort.classes.map((session) => {
                  const active = selectedClass?.id === session.id;

                  return (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => setSelectedClassId(session.id)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "14px 15px",
                        minHeight: "112px",
                        borderRadius: "16px",
                        border: `1px solid ${active ? ADMIN_THEME.accentBorder : ADMIN_THEME.borderSoft}`,
                        background: active
                          ? "linear-gradient(135deg, rgba(200,52,46,0.08) 0%, #FFFFFF 100%)"
                          : ADMIN_THEME.surfaceSoft,
                        cursor: "pointer",
                        display: "grid",
                        alignContent: "start",
                      }}
                    >
                      <p style={{ color: active ? ADMIN_THEME.accent : ADMIN_THEME.subtle, fontSize: "10px", fontWeight: 500, letterSpacing: "0px", textTransform: "uppercase", margin: "0 0 6px 0" }}>
                        {session.track}
                      </p>
                      <h4 style={{ color: ADMIN_THEME.heading, fontSize: "17px", fontFamily: "var(--font-body)", fontStyle: "italic", fontWeight: 800, margin: "0 0 5px 0" }}>
                        {session.topic}
                      </h4>
                      <p style={{ color: ADMIN_THEME.muted, fontSize: "13px", margin: 0 }}>{formatDateTime(session.date, session.time)} · {session.coach}</p>
                    </button>
                  );
                })}
              </div>
            </Surface>
          </div>

          <div className="cohort-stack">
            <Surface style={{ padding: "19px", alignSelf: "start" }}>
              <div style={{ display: "grid", gap: "12px", marginBottom: "12px" }}>
                <p
                  style={{
                    color: ADMIN_THEME.accent,
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0px",
                    textTransform: "uppercase",
                    margin: 0,
                  }}
                >
                  Attendance
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
                  <h2
                    style={{
                      color: ADMIN_THEME.heading,
                      fontSize: "28px",
                      fontFamily: "var(--font-heading)",
                      fontWeight: 900,
                      letterSpacing: "0px",
                      textTransform: "uppercase",
                      margin: 0,
                      lineHeight: 1,
                    }}
                  >
                    Mark Attendance
                  </h2>
                  <div style={{ display: "grid", gap: "8px", justifyItems: "end" }}>
                    <span
                      style={{
                        color: ADMIN_THEME.subtle,
                        fontSize: "12px",
                        letterSpacing: "0px",
                        textTransform: "uppercase",
                      }}
                    >
                      {selectedClass ? formatDateTime(selectedClass.date, selectedClass.time) : "Select a class"}
                    </span>
                    <ActionButton
                      onClick={() => {
                        if (onOpenAttendance) {
                          onOpenAttendance({
                            cohortId: selectedCohort.id,
                            classId: selectedClass?.id ?? "",
                          });
                          return;
                        }

                        bulkAttendance("present");
                      }}
                      style={{ minWidth: "171px" }}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                        Mark Attendance <ArrowRight size={16} />
                      </span>
                    </ActionButton>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <span style={pillSummaryStyle("present")}>Present {attendanceCounts.present}</span>
                  <span style={pillSummaryStyle("late")}>Late {attendanceCounts.late}</span>
                  <span style={pillSummaryStyle("absent")}>Absent {attendanceCounts.absent}</span>
                  <span style={pillSummaryStyle("pending")}>Pending {attendanceCounts.pending}</span>
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <ActionButton secondary onClick={() => bulkAttendance("present")} style={{ minWidth: "156px" }}>Mark All Present</ActionButton>
                  <ActionButton secondary onClick={() => bulkAttendance("absent")} style={{ minWidth: "148px" }}>Mark All Absent</ActionButton>
                </div>
              </div>
            </Surface>

            <div className="cohort-middle-grid">
              <Surface style={{ padding: "19px", minHeight: "224px", alignSelf: "start" }}>
                <SectionTitle
                  eyebrow="Announcements"
                  title="Send Cohort Update"
                  detail={selectedCohort.name}
                />
                <form onSubmit={handleAnnouncementSubmit} className="cohort-form-grid">
                  <div className="cohort-full-span">
                    <FieldLabel>Relevant Class</FieldLabel>
                    <FieldShell>
                      <select
                        value={newAnnouncement.classId ?? ""}
                        onChange={(event) =>
                          setNewAnnouncement((current) => ({
                            ...current,
                            classId: event.target.value,
                          }))
                        }
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
                  <div className="cohort-full-span">
                    <FieldLabel>Announcement Title</FieldLabel>
                    <FieldShell>
                      <input
                        value={newAnnouncement.title}
                        onChange={(event) =>
                          setNewAnnouncement((current) => ({
                            ...current,
                            title: event.target.value,
                          }))
                        }
                        placeholder="Session reminder, arrival note, or parent update"
                        style={inputStyle}
                      />
                    </FieldShell>
                  </div>
                  <div className="cohort-full-span">
                    <FieldLabel>Message</FieldLabel>
                    <FieldShell>
                      <textarea
                        value={newAnnouncement.message}
                        onChange={(event) =>
                          setNewAnnouncement((current) => ({
                            ...current,
                            message: event.target.value,
                          }))
                        }
                        placeholder="Write the exact update this cohort should receive."
                        style={textareaStyle}
                      />
                    </FieldShell>
                  </div>
                  <div className="cohort-full-span" style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                    <p style={{ color: ADMIN_THEME.subtle, fontSize: "12px", margin: 0 }}>
                      Target a specific class when the update is only relevant to one session, or leave it cohort-wide for general communication.
                    </p>
                    <ActionButton type="submit" style={{ minWidth: "176px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                        <Megaphone size={16} /> Send Update
                      </span>
                    </ActionButton>
                  </div>
                </form>
              </Surface>

              <div className="cohort-cta-stack">
                <Surface style={{ padding: "19px", minHeight: "108px", alignSelf: "start" }}>
                  <SectionTitle eyebrow="Cohort Management" title="Manage Students" subdetail={selectedCohort.name} />
                  <div style={{ display: "grid", gap: "10px" }}>
                    <p style={{ color: ADMIN_THEME.muted, fontSize: "13px", lineHeight: 1.65, margin: 0 }}>
                      Student search, coach reports, enrollment, and roster edits now live together in cohort management so
                      staff can work from the student list without bouncing between panels.
                    </p>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <span
                        style={{
                          padding: "7px 10px",
                          borderRadius: "999px",
                          backgroundColor: ADMIN_THEME.accentBg,
                          border: `1px solid ${ADMIN_THEME.accentBorder}`,
                          color: ADMIN_THEME.accent,
                          fontSize: "10px",
                          letterSpacing: "0px",
                          textTransform: "uppercase",
                        }}
                      >
                        {selectedCohort.students.length} students
                      </span>
                      <span
                        style={{
                          padding: "7px 10px",
                          borderRadius: "999px",
                          backgroundColor: ADMIN_THEME.surfaceSoft,
                          border: `1px solid ${ADMIN_THEME.borderSoft}`,
                          color: ADMIN_THEME.muted,
                          fontSize: "10px",
                          letterSpacing: "0px",
                          textTransform: "uppercase",
                        }}
                      >
                        {selectedCohort.reports.length} reports
                      </span>
                      <span
                        style={{
                          padding: "7px 10px",
                          borderRadius: "999px",
                          backgroundColor: ADMIN_THEME.surfaceSoft,
                          border: `1px solid ${ADMIN_THEME.borderSoft}`,
                          color: ADMIN_THEME.muted,
                          fontSize: "10px",
                          letterSpacing: "0px",
                          textTransform: "uppercase",
                        }}
                      >
                        {availableSeats} seats open
                      </span>
                    </div>
                    <ActionButton
                      onClick={() => onOpenCohortManagement?.(selectedCohort.id)}
                      style={{ justifySelf: "start", minWidth: "210px" }}
                    >
                      Open Cohort Management
                    </ActionButton>
                  </div>
                </Surface>

                <Surface style={{ padding: "19px", minHeight: "108px", alignSelf: "start" }}>
                  <SectionTitle eyebrow="Teaching Operations" title="Schedule + Syllabus" subdetail={selectedCohort.name} />
                  <div style={{ display: "grid", gap: "10px" }}>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <span
                        style={{
                          padding: "7px 10px",
                          borderRadius: "999px",
                          backgroundColor: ADMIN_THEME.accentBg,
                          border: `1px solid ${ADMIN_THEME.accentBorder}`,
                          color: ADMIN_THEME.accent,
                          fontSize: "10px",
                          letterSpacing: "0px",
                          textTransform: "uppercase",
                        }}
                      >
                        {selectedCohort.classes.length} sessions
                      </span>
                      <span
                        style={{
                          padding: "7px 10px",
                          borderRadius: "999px",
                          backgroundColor: ADMIN_THEME.surfaceSoft,
                          border: `1px solid ${ADMIN_THEME.borderSoft}`,
                          color: ADMIN_THEME.muted,
                          fontSize: "10px",
                          letterSpacing: "0px",
                          textTransform: "uppercase",
                        }}
                      >
                        {selectedCohort.syllabus.length} modules
                      </span>
                      <span
                        style={{
                          padding: "7px 10px",
                          borderRadius: "999px",
                          backgroundColor: ADMIN_THEME.surfaceSoft,
                          border: `1px solid ${ADMIN_THEME.borderSoft}`,
                          color: ADMIN_THEME.muted,
                          fontSize: "10px",
                          letterSpacing: "0px",
                          textTransform: "uppercase",
                        }}
                      >
                        {liveSyllabus} live
                      </span>
                    </div>
                    <div style={{ display: "grid", gap: "4px" }}>
                      <p style={{ color: ADMIN_THEME.heading, fontSize: "14px", fontWeight: 700, margin: 0 }}>
                        {priorityClass ? `Next session: ${priorityClass.topic}` : "No session scheduled yet"}
                      </p>
                      <p style={{ color: ADMIN_THEME.subtle, fontSize: "11px", lineHeight: 1.45, margin: 0 }}>
                        {teachingLeadModule
                          ? `Lead module: ${teachingLeadModule.weekLabel} - ${teachingLeadModule.title}`
                          : "Add a syllabus block to define the next teaching objective."}
                      </p>
                    </div>
                    <ActionButton
                      onClick={() => onOpenTeachingOperations?.(selectedCohort.id)}
                      style={{ justifySelf: "start", minWidth: "210px" }}
                    >
                      Open Teaching Operations
                    </ActionButton>
                  </div>
                </Surface>
              </div>
            </div>

            <Surface style={{ padding: "19px", alignSelf: "start" }}>
              <SectionTitle eyebrow="Report Log" title="Recent Reports" detail={`${selectedCohort.reports.length} stored`} />
              <div style={{ display: "grid", gap: "8px" }}>
                {selectedCohort.reports.length === 0 ? (
                  <div
                    style={{
                      padding: "18px",
                      borderRadius: "16px",
                      border: `1px dashed ${ADMIN_THEME.border}`,
                      color: ADMIN_THEME.subtle,
                      fontSize: "14px",
                      backgroundColor: ADMIN_THEME.surfaceSoft,
                    }}
                  >
                    No reports logged yet for this cohort.
                  </div>
                ) : (
                  selectedCohort.reports.map((report) => {
                    const student = selectedCohort.students.find((entry) => entry.id === report.studentId);

                    return (
                      <div
                        key={report.id}
                        style={{
                          padding: "13px 12px",
                          minHeight: "131px",
                          borderRadius: "16px",
                          ...nestedCardStyle,
                        }}
                      >
                        <p style={{ color: ADMIN_THEME.accent, fontSize: "10px", letterSpacing: "0px", textTransform: "uppercase", margin: "0 0 6px 0" }}>
                          {student?.name ?? "Student"} · {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(report.createdAt))}
                        </p>
                        <h4 style={{ color: ADMIN_THEME.heading, fontSize: "18px", fontFamily: "var(--font-body)", fontStyle: "italic", fontWeight: 800, margin: "0 0 8px 0" }}>
                          {report.title}
                        </h4>
                        <p style={{ color: ADMIN_THEME.muted, fontSize: "14px", lineHeight: 1.6, margin: "0 0 8px 0" }}>{report.summary}</p>
                        {report.recommendation ? (
                          <p style={{ color: ADMIN_THEME.subtle, fontSize: "13px", lineHeight: 1.5, margin: 0 }}>
                            Next step: {report.recommendation}
                          </p>
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>
            </Surface>
          </div>
        </div>
      </div>

      {editingAnnouncement ? (
        <div
          onClick={handleAnnouncementEditCancel}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(22,18,14,0.38)",
            display: "grid",
            placeItems: "center",
            padding: "24px",
            zIndex: 45,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "min(680px, 100%)",
              padding: "18px",
              borderRadius: "20px",
              background: "linear-gradient(180deg, #FFFFFF 0%, #FBF8F4 100%)",
              border: `1px solid ${ADMIN_THEME.border}`,
              boxShadow: "0 24px 70px rgba(22,18,14,0.22)",
              display: "grid",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start" }}>
              <div style={{ display: "grid", gap: "4px" }}>
                <p style={{ color: ADMIN_THEME.accent, fontSize: "10px", fontWeight: 700, letterSpacing: "0px", textTransform: "uppercase", margin: 0 }}>
                  Cohort Update
                </p>
                <h3 style={{ color: ADMIN_THEME.heading, fontSize: "24px", fontFamily: "var(--font-heading)", margin: 0, lineHeight: 1 }}>
                  Edit Announcement
                </h3>
                <p style={{ color: ADMIN_THEME.muted, fontSize: "12px", margin: 0 }}>
                  Update the title, target, or message here without reusing the send-update form.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAnnouncementEditCancel}
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "999px",
                  border: `1px solid ${ADMIN_THEME.border}`,
                  backgroundColor: ADMIN_THEME.surface,
                  color: ADMIN_THEME.heading,
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAnnouncementEditSubmit} className="cohort-form-grid">
              <div className="cohort-full-span">
                <FieldLabel>Relevant Class</FieldLabel>
                <FieldShell>
                  <select
                    value={editingAnnouncementDraft.classId ?? ""}
                    onChange={(event) =>
                      setEditingAnnouncementDraft((current) => ({
                        ...current,
                        classId: event.target.value,
                      }))
                    }
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
              <div className="cohort-full-span">
                <FieldLabel>Announcement Title</FieldLabel>
                <FieldShell>
                  <input
                    value={editingAnnouncementDraft.title}
                    onChange={(event) =>
                      setEditingAnnouncementDraft((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    placeholder="Session reminder, arrival note, or parent update"
                    style={inputStyle}
                  />
                </FieldShell>
              </div>
              <div className="cohort-full-span">
                <FieldLabel>Message</FieldLabel>
                <FieldShell>
                  <textarea
                    value={editingAnnouncementDraft.message}
                    onChange={(event) =>
                      setEditingAnnouncementDraft((current) => ({
                        ...current,
                        message: event.target.value,
                      }))
                    }
                    placeholder="Write the exact update this cohort should receive."
                    style={textareaStyle}
                  />
                </FieldShell>
              </div>
              <div className="cohort-full-span" style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                <p style={{ color: ADMIN_THEME.subtle, fontSize: "12px", margin: 0 }}>
                  Save the revised announcement back into the recent updates log from this popup.
                </p>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <ActionButton secondary type="button" onClick={handleAnnouncementEditCancel} style={{ minWidth: "138px" }}>
                    Cancel
                  </ActionButton>
                  <ActionButton type="submit" style={{ minWidth: "162px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                      <Megaphone size={16} /> Save Update
                    </span>
                  </ActionButton>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
