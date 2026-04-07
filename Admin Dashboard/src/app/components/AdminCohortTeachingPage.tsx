import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  Btn, T, PageHeader, TableShell, TableHeader, Th, TableRow, Td, StatusChip, InlineSelect,
  FormField, FieldLabel, FieldShell, EmptyState, SectionLabel, Surface,
  inputStyle, textareaStyle, createId, syllabusTone, workflowTone,
  getAttendanceWorkflowLabel, getSessionAttendanceWorkflowStatus, getSessionTimestamp,
  loadCohorts, STORAGE_KEY,
  type Cohort, type ScheduledClass, type SyllabusStatus, type AttendanceWorkflowStatus, type ChipTone,
} from "./AdminDashboard";
import { BookOpen, CalendarDays, Plus, X } from "lucide-react";

function formatCompactDate(d: string) {
  const date = new Date(`${d}T00:00:00`);
  return Number.isNaN(date.getTime()) ? d : new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(date);
}

function formatTime(t: string) {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(`2026-01-01T${t}:00`));
}

function getDatePlusDays(dateStr: string, days: number) {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (![y, m, d].every(Number.isFinite)) return dateStr;
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getTodayDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildSessionDraft(cohort?: Cohort, session?: ScheduledClass) {
  const lastSession = session ?? (cohort ? [...cohort.classes].sort((a, b) => getSessionTimestamp(a) - getSessionTimestamp(b)).at(-1) : undefined);
  return {
    date: lastSession ? getDatePlusDays(lastSession.date, 7) : getTodayDate(),
    time: lastSession?.time ?? "16:30",
    track: lastSession?.track ?? cohort?.room ?? "",
    coach: lastSession?.coach ?? cohort?.coach ?? "",
    topic: session?.topic ?? "",
    seriesTitle: "",
    seriesCount: "6",
    seriesIntervalWeeks: "1",
  };
}

function buildSyllabusDraft(cohort?: Cohort) {
  const nextWeek = cohort ? cohort.syllabus.length + 1 : 1;
  return {
    weekLabel: `Week ${String(nextWeek).padStart(2, "0")}`,
    title: "",
    objective: "",
    status: "planned" as SyllabusStatus,
  };
}

type SessionCreateMode = "single" | "series";

function parsePositiveInteger(value: string, fallback: number) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function buildRecurringSessionTopic(seriesTitle: string, index: number) {
  const label = seriesTitle.trim() || "Session";
  return `${label} · Session ${String(index + 1).padStart(2, "0")}`;
}

function scheduleWorkflowTone(status: AttendanceWorkflowStatus, upcoming: boolean): ChipTone {
  return upcoming && status === "pending" ? "info" : workflowTone(status);
}

function scheduleSyllabusTone(status: SyllabusStatus): ChipTone {
  return status === "planned" ? "info" : syllabusTone(status);
}

function CenterPopup({
  open,
  title,
  headline,
  description,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  headline: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
}) {
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
          padding: T.space5,
          zIndex: 101,
        }}
      >
        <div
          onClick={(event) => event.stopPropagation()}
          style={{
            width: "min(560px, 100%)",
            borderRadius: T.radiusLg,
            border: `1px solid ${T.border}`,
            backgroundColor: T.surface,
            boxShadow: T.shadowLg,
            display: "grid",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: T.space3, padding: T.space4, borderBottom: `1px solid ${T.border}` }}>
            <div style={{ display: "grid", gap: "4px" }}>
              <SectionLabel>{title}</SectionLabel>
              <h2 style={{ color: T.heading, fontSize: T.text2xl, fontWeight: 700, lineHeight: 1.1, margin: 0 }}>{headline}</h2>
              <p style={{ color: T.muted, fontSize: T.textBase, lineHeight: 1.5, margin: 0 }}>{description}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: T.radiusSm,
                border: `1px solid ${T.border}`,
                backgroundColor: T.surface,
                color: T.muted,
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <X size={16} />
            </button>
          </div>

          <div style={{ padding: T.space4 }}>{children}</div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: T.space2, padding: T.space4, borderTop: `1px solid ${T.border}` }}>
            {footer}
          </div>
        </div>
      </div>
    </>
  );
}

interface Props {
  initialCohortId?: string;
  onSelectCohort?: (id: string) => void;
}

export function AdminSchedulePage({ initialCohortId, onSelectCohort }: Props) {
  const [cohorts, setCohorts] = useState<Cohort[]>(() => loadCohorts());
  const [selectedId, setSelectedId] = useState(() => initialCohortId ?? loadCohorts()[0]?.id ?? "");
  const [tab, setTab] = useState("sessions");
  const [sessionPopupOpen, setSessionPopupOpen] = useState(false);
  const [syllabusPopupOpen, setSyllabusPopupOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [sessionCreateMode, setSessionCreateMode] = useState<SessionCreateMode>("single");

  const cohort = cohorts.find((c) => c.id === selectedId) ?? cohorts[0];
  const activeCohorts = cohorts.filter((c) => !c.archived);
  const [sessionDraft, setSessionDraft] = useState(() => buildSessionDraft(cohort));
  const [syllabusDraft, setSyllabusDraft] = useState(() => buildSyllabusDraft(cohort));

  useEffect(() => { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cohorts)); }, [cohorts]);
  useEffect(() => { if (initialCohortId && cohorts.some((c) => c.id === initialCohortId)) setSelectedId(initialCohortId); }, [initialCohortId]);
  useEffect(() => {
    const nextCohort = cohorts.find((item) => item.id === selectedId) ?? cohorts[0];
    if (!nextCohort) return;
    setSessionDraft(buildSessionDraft(nextCohort));
    setSyllabusDraft(buildSyllabusDraft(nextCohort));
    setEditingSessionId(null);
    setSessionCreateMode("single");
    setSessionPopupOpen(false);
    setSyllabusPopupOpen(false);
  }, [selectedId]);

  function select(id: string) { setSelectedId(id); onSelectCohort?.(id); }
  function updateCohort(fn: (c: Cohort) => Cohort) { setCohorts((all) => all.map((c) => c.id === cohort?.id ? fn(c) : c)); }

  function openCreateSessionPopup() {
    setEditingSessionId(null);
    setSessionCreateMode("single");
    setSessionDraft(buildSessionDraft(cohort));
    setSessionPopupOpen(true);
  }

  function openEditSessionPopup(session: ScheduledClass) {
    setEditingSessionId(session.id);
    setSessionCreateMode("single");
    setSessionDraft(buildSessionDraft(cohort, session));
    setSessionPopupOpen(true);
  }

  function closeSessionPopup() {
    setSessionPopupOpen(false);
    setEditingSessionId(null);
    setSessionCreateMode("single");
    setSessionDraft(buildSessionDraft(cohort));
  }

  function closeSyllabusPopup() {
    setSyllabusPopupOpen(false);
    setSyllabusDraft(buildSyllabusDraft(cohort));
  }

  function submitSession(e: FormEvent) {
    e.preventDefault();
    if (!cohort) return;
    const seriesCount = parsePositiveInteger(sessionDraft.seriesCount, 6);
    const seriesIntervalWeeks = parsePositiveInteger(sessionDraft.seriesIntervalWeeks, 1);

    const nextSessions = editingSessionId || sessionCreateMode === "single"
      ? [{
          date: sessionDraft.date,
          time: sessionDraft.time,
          track: sessionDraft.track.trim(),
          coach: sessionDraft.coach.trim(),
          topic: sessionDraft.topic.trim(),
        }].filter((item) => item.topic)
      : Array.from({ length: seriesCount }, (_, index) => ({
          date: getDatePlusDays(sessionDraft.date, index * seriesIntervalWeeks * 7),
          time: sessionDraft.time,
          track: sessionDraft.track.trim(),
          coach: sessionDraft.coach.trim(),
          topic: buildRecurringSessionTopic(sessionDraft.seriesTitle, index),
        })).filter((item) => item.topic);

    if (nextSessions.length === 0) return;

    updateCohort((c) => ({
      ...c,
      classes: editingSessionId
        ? c.classes.map((item) => (
            item.id === editingSessionId
              ? {
                  ...item,
                  ...nextSessions[0],
                }
              : item
          ))
        : [
            ...c.classes,
            ...nextSessions.map((session) => ({
              id: createId("class"),
              ...session,
            })),
          ],
    }));

    if (editingSessionId) {
      closeSessionPopup();
      return;
    }

    setSessionDraft({
      date: getDatePlusDays(nextSessions.at(-1)?.date ?? sessionDraft.date, 7),
      time: sessionDraft.time,
      track: sessionDraft.track,
      coach: sessionDraft.coach,
      topic: "",
      seriesTitle: "",
      seriesCount: sessionDraft.seriesCount,
      seriesIntervalWeeks: sessionDraft.seriesIntervalWeeks,
    });
    setSessionPopupOpen(false);
    setSessionCreateMode("single");
  }

  function submitSyllabus(e: FormEvent) {
    e.preventDefault();
    if (!cohort || !syllabusDraft.title.trim()) return;
    updateCohort((c) => ({
      ...c,
      syllabus: [...c.syllabus, { id: createId("syllabus"), weekLabel: syllabusDraft.weekLabel.trim(), title: syllabusDraft.title.trim(), objective: syllabusDraft.objective.trim(), status: syllabusDraft.status }],
    }));
    setSyllabusDraft({ weekLabel: `Week ${String((cohort.syllabus.length || 0) + 2).padStart(2, "0")}`, title: "", objective: "", status: "planned" });
    setSyllabusPopupOpen(false);
  }

  function cancelSession(session: ScheduledClass) {
    const label = session.topic || `${formatCompactDate(session.date)} ${formatTime(session.time)}`;
    if (!window.confirm(`Cancel "${label}" for ${cohort.name}?`)) return;

    updateCohort((current) => ({
      ...current,
      classes: current.classes.filter((item) => item.id !== session.id),
      students: current.students.map((student) => {
        const nextAttendance = { ...student.attendance };
        delete nextAttendance[session.id];
        return { ...student, attendance: nextAttendance };
      }),
      announcements: current.announcements.filter((announcement) => announcement.classId !== session.id),
    }));
  }

  if (!cohort) return null;

  const sortedSessions = [...cohort.classes].sort((a, b) => getSessionTimestamp(a) - getSessionTimestamp(b));
  const sessionCols = "minmax(100px,1fr) 70px minmax(120px,1fr) 100px 90px 110px 168px";
  const syllabusCols = "80px minmax(140px,1fr) minmax(160px,1fr) 80px";
  const activeStudentCount = cohort.students.filter((student) => (student.status ?? "active") === "active").length;
  const primaryActionLabel = tab === "sessions" ? "Add Session" : "Add Week";
  const sessionPopupTitle = editingSessionId ? "Reschedule Session" : "Add Session";
  const sessionPopupDescription = editingSessionId
    ? "Update the selected session details."
    : "Choose between a one-off session and a recurring series, then confirm the shared schedule details.";
  const seriesCount = parsePositiveInteger(sessionDraft.seriesCount, 6);
  const seriesIntervalWeeks = parsePositiveInteger(sessionDraft.seriesIntervalWeeks, 1);
  const sessionSubmitLabel = editingSessionId
    ? "Save Changes"
    : sessionCreateMode === "series"
      ? `Create ${seriesCount} Sessions`
      : "Create Session";
  const seriesPreview = !editingSessionId && sessionCreateMode === "series"
    ? Array.from({ length: seriesCount }, (_, index) => ({
        topic: buildRecurringSessionTopic(sessionDraft.seriesTitle, index),
        date: getDatePlusDays(sessionDraft.date, index * seriesIntervalWeeks * 7),
      }))
    : [];
  const modeCards = [
    {
      id: "sessions",
      label: "Sessions",
      meta: `${sortedSessions.length} planned`,
      icon: <CalendarDays size={16} />,
    },
    {
      id: "syllabus",
      label: "Syllabus",
      meta: `${cohort.syllabus.length} weeks`,
      icon: <BookOpen size={16} />,
    },
  ] as const;
  const cohortDetails = [
    { label: "Program", value: cohort.program || "Not set" },
    { label: "Year", value: cohort.year || "Not set" },
    { label: "Students", value: `${activeStudentCount} active` },
    { label: "Coach", value: cohort.coach || "Unassigned" },
    { label: "Track", value: cohort.room || "Track TBD" },
  ] as const;

  return (
    <div style={{ display: "grid", gap: T.space3 }}>
      <PageHeader title="Schedule" />

      <Surface style={{ padding: T.space3 }}>
        <div style={{ display: "grid", gap: T.space2 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: T.space2 }}>
            <div style={{ display: "grid", gap: T.space2, padding: T.space3, borderRadius: T.radiusLg, border: `1px solid ${T.successBorder}`, background: `linear-gradient(180deg, ${T.successBg} 0%, ${T.surface} 100%)`, boxShadow: `inset 0 0 0 1px rgba(34,197,94,0.06)` }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: T.space3, alignItems: "flex-start" }}>
                <div style={{ display: "grid", gap: T.space1 }}>
                  <span style={{ color: T.success, fontSize: T.textXs, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Active Cohort</span>
                  <span style={{ color: T.heading, fontSize: T.textXl, fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.03em" }}>{cohort.name}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: T.space2, flexShrink: 0 }}>
                  <StatusChip tone="success" label="Active" />
                  <span style={{ width: "30px", height: "30px", borderRadius: T.radiusMd, display: "grid", placeItems: "center", backgroundColor: T.successBg, border: `1px solid ${T.successBorder}`, color: T.success }}>
                    <CalendarDays size={15} />
                  </span>
                </div>
              </div>

              <InlineSelect
                value={selectedId}
                onChange={select}
                style={{
                  width: "100%",
                  minWidth: "100%",
                  height: T.controlMd,
                  fontSize: T.textBase,
                  fontWeight: 700,
                  border: `1px solid ${T.accentBorder}`,
                  boxShadow: "0 8px 22px rgba(79,107,138,0.10)",
                  backgroundColor: T.surface,
                }}
              >
                {activeCohorts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </InlineSelect>

              <div
                style={{
                  display: "grid",
                  gap: T.space2,
                  paddingTop: T.space2,
                  borderTop: `1px solid ${T.successBorder}`,
                }}
              >
                <span style={{ color: T.success, fontSize: T.textXs, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Details
                </span>
                <dl
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                    columnGap: T.space4,
                    rowGap: T.space2,
                    margin: 0,
                  }}
                >
                  {cohortDetails.map((detail) => (
                    <div
                      key={detail.label}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "88px minmax(0, 1fr)",
                        gap: T.space2,
                        alignItems: "baseline",
                        minWidth: 0,
                      }}
                    >
                      <dt style={{ color: T.subtle, fontSize: T.textSm, fontWeight: 600, margin: 0 }}>
                        {detail.label}
                      </dt>
                      <dd style={{ color: T.heading, fontSize: T.textSm, fontWeight: 700, lineHeight: 1.35, margin: 0, minWidth: 0 }}>
                        {detail.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            <div style={{ display: "grid", gap: T.space2, padding: T.space3, borderRadius: T.radiusLg, border: `1px solid ${T.border}`, backgroundColor: T.surface }}>
              <div style={{ display: "grid", gap: T.space1 }}>
                <span style={{ color: T.subtle, fontSize: T.textXs, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Planning View</span>
                <span style={{ color: T.heading, fontSize: T.textLg, fontWeight: 700, lineHeight: 1.1 }}>Delivery View</span>
              </div>

              <div style={{ display: "grid", gap: T.space1 }}>
                {modeCards.map((mode) => {
                  const isActive = tab === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setTab(mode.id)}
                      aria-pressed={isActive}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: T.space3,
                        padding: "10px 12px",
                        borderRadius: T.radiusMd,
                        border: isActive ? "1px solid rgba(34,197,94,0.22)" : `1px solid ${T.border}`,
                        backgroundColor: isActive ? "rgba(34,197,94,0.10)" : T.surfaceSoft,
                        color: T.heading,
                        textAlign: "left",
                        cursor: "pointer",
                        transition: "background 0.12s ease, border-color 0.12s ease",
                      }}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", gap: T.space3, minWidth: 0 }}>
                        <span style={{ width: "28px", height: "28px", borderRadius: T.radiusSm, display: "grid", placeItems: "center", backgroundColor: isActive ? "rgba(34,197,94,0.14)" : T.surface, border: `1px solid ${isActive ? "rgba(34,197,94,0.22)" : T.border}` }}>
                          {mode.icon}
                        </span>
                        <span style={{ fontSize: T.textBase, fontWeight: 700, lineHeight: 1.1 }}>{mode.label}</span>
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: T.space2 }}>
                        <span style={{ color: T.subtle, fontSize: T.textXs, fontWeight: 700, whiteSpace: "nowrap" }}>{mode.meta}</span>
                        {isActive ? <StatusChip tone="success" label="Active" /> : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "grid", gap: T.space2, padding: T.space3, borderRadius: T.radiusLg, border: `1px solid ${T.accentBorder}`, background: `linear-gradient(180deg, rgba(79,107,138,0.08) 0%, ${T.surface} 100%)` }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: T.space3, alignItems: "flex-start" }}>
                <div style={{ display: "grid", gap: T.space1 }}>
                  <span style={{ color: T.subtle, fontSize: T.textXs, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Primary Action</span>
                  <span style={{ color: T.heading, fontSize: T.textLg, fontWeight: 700, lineHeight: 1.1 }}>{primaryActionLabel}</span>
                </div>
                <span style={{ width: "30px", height: "30px", borderRadius: T.radiusMd, display: "grid", placeItems: "center", backgroundColor: T.accent, color: "#FFFFFF", boxShadow: T.shadowMd, flexShrink: 0 }}>
                  <Plus size={15} />
                </span>
              </div>

              <Btn onClick={() => tab === "sessions" ? openCreateSessionPopup() : setSyllabusPopupOpen(true)} style={{ justifyContent: "space-between", width: "100%" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: T.space2 }}>
                  <Plus size={15} />
                  {primaryActionLabel}
                </span>
                <span style={{ color: "rgba(255,255,255,0.76)", fontSize: T.textXs, fontWeight: 700 }}>
                  {tab === "sessions" ? "Series Ready" : "Curriculum"}
                </span>
              </Btn>

              <div style={{ display: "flex", gap: T.space2, flexWrap: "wrap" }}>
                {tab === "sessions"
                  ? <StatusChip tone="info" label="Single or recurring" />
                  : <StatusChip tone="info" label={`${cohort.syllabus.length + 1}th week next`} />}
                <StatusChip tone="info" label={tab === "sessions" ? `${sortedSessions.length} sessions planned` : `${cohort.syllabus.length} weeks recorded`} />
              </div>
            </div>
          </div>
        </div>
      </Surface>

      {tab === "sessions" ? (
        <Surface style={{ padding: T.space5 }}>
          <div style={{ display: "grid", gap: T.space3 }}>
            <SectionLabel>Session Plan</SectionLabel>
            <TableShell>
              <TableHeader columns={sessionCols}>
                <Th>Date</Th>
                <Th>Time</Th>
                <Th>Topic</Th>
                <Th>Track</Th>
                <Th>Coach</Th>
                <Th>Attendance</Th>
                <Th align="right">Actions</Th>
              </TableHeader>
              {sortedSessions.length === 0 ? (
                <EmptyState icon={<CalendarDays size={24} />} title="No sessions scheduled" description="Create your first session to get started." action={<Btn onClick={openCreateSessionPopup}>+ Add Session</Btn>} />
              ) : sortedSessions.map((s) => {
                const wf = getSessionAttendanceWorkflowStatus(s, cohort.students);
                const upcoming = getSessionTimestamp(s) >= Date.now();
                const label = upcoming && wf === "pending" ? "Scheduled" : getAttendanceWorkflowLabel(wf);
                const tone = scheduleWorkflowTone(wf, upcoming);
                return (
                  <TableRow key={s.id} columns={sessionCols}>
                    <Td bold>{formatCompactDate(s.date)}</Td>
                    <Td muted>{formatTime(s.time)}</Td>
                    <Td>{s.topic || "–"}</Td>
                    <Td muted>{s.track}</Td>
                    <Td muted>{s.coach}</Td>
                    <Td><StatusChip tone={tone} label={label} /></Td>
                    <Td align="right">
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: T.space2, flexWrap: "wrap" }}>
                        <Btn variant="secondary" size="compact" onClick={() => openEditSessionPopup(s)}>Reschedule</Btn>
                        <Btn variant="danger" size="compact" onClick={() => cancelSession(s)}>Cancel</Btn>
                      </div>
                    </Td>
                  </TableRow>
                );
              })}
            </TableShell>
          </div>
        </Surface>
      ) : (
        <Surface style={{ padding: T.space5 }}>
          <div style={{ display: "grid", gap: T.space3 }}>
            <SectionLabel>Syllabus</SectionLabel>
            <TableShell>
              <TableHeader columns={syllabusCols}>
                <Th>Week</Th>
                <Th>Topic</Th>
                <Th>Objective</Th>
                <Th>Status</Th>
              </TableHeader>
              {cohort.syllabus.length === 0 ? (
                <EmptyState icon={<CalendarDays size={24} />} title="No syllabus entries" description="Add your first week to the curriculum." action={<Btn onClick={() => setSyllabusPopupOpen(true)}>+ Add Week</Btn>} />
              ) : cohort.syllabus.map((s) => (
                <TableRow key={s.id} columns={syllabusCols}>
                  <Td bold>{s.weekLabel}</Td>
                  <Td>{s.title}</Td>
                  <Td muted>{s.objective || "–"}</Td>
                  <Td><StatusChip tone={scheduleSyllabusTone(s.status)} label={s.status.charAt(0).toUpperCase() + s.status.slice(1)} /></Td>
                </TableRow>
              ))}
            </TableShell>
          </div>
        </Surface>
      )}

      <CenterPopup
        open={sessionPopupOpen}
        title={sessionPopupTitle}
        headline={cohort.name}
        description={sessionPopupDescription}
        onClose={closeSessionPopup}
        footer={(
          <>
            <Btn variant="secondary" onClick={closeSessionPopup}>Cancel</Btn>
            <Btn type="submit" onClick={() => { const form = document.getElementById("session-form") as HTMLFormElement | null; form?.requestSubmit(); }}>
              {sessionSubmitLabel}
            </Btn>
          </>
        )}
      >
        <form id="session-form" onSubmit={submitSession} style={{ display: "grid", gap: T.space3 }}>
          {!editingSessionId ? (
            <div style={{ display: "grid", gap: T.space2 }}>
              <FieldLabel>Create Mode</FieldLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: T.space2 }}>
                {([
                  { id: "single", label: "Single Session", note: "Create one session" },
                  { id: "series", label: "Recurring Series", note: "Repeat across future weeks" },
                ] as const).map((option) => {
                  const isActive = sessionCreateMode === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        setSessionCreateMode(option.id);
                        if (option.id === "series") {
                          setSessionDraft((current) => ({
                            ...current,
                            seriesTitle: current.seriesTitle || current.topic || "",
                          }));
                          return;
                        }

                        setSessionDraft((current) => ({
                          ...current,
                          topic: current.topic || current.seriesTitle || "",
                        }));
                      }}
                      aria-pressed={isActive}
                      style={{
                        display: "grid",
                        gap: "2px",
                        padding: "12px",
                        borderRadius: T.radiusMd,
                        border: isActive ? `1px solid ${T.accentBorder}` : `1px solid ${T.border}`,
                        backgroundColor: isActive ? T.accentBg : T.surfaceSoft,
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                    >
                      <span style={{ color: T.heading, fontSize: T.textBase, fontWeight: 700, lineHeight: 1.1 }}>{option.label}</span>
                      <span style={{ color: T.muted, fontSize: T.textXs, lineHeight: 1.35 }}>{option.note}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div style={{ display: "grid", gap: T.space2 }}>
            <FieldLabel>Shared Schedule Details</FieldLabel>
            <div style={{ display: "grid", gap: T.space2, padding: T.space3, borderRadius: T.radiusMd, border: `1px solid ${T.border}`, backgroundColor: T.surfaceSoft }}>
              {!editingSessionId && sessionCreateMode === "series" ? (
                <p style={{ color: T.subtle, fontSize: T.textSm, lineHeight: 1.45, margin: 0 }}>
                  These details apply to every session in the recurring series.
                </p>
              ) : null}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: T.space2 }}>
                <FormField label="Date"><input type="date" value={sessionDraft.date} onChange={(e) => setSessionDraft({ ...sessionDraft, date: e.target.value })} style={inputStyle} /></FormField>
                <FormField label="Time"><input type="time" value={sessionDraft.time} onChange={(e) => setSessionDraft({ ...sessionDraft, time: e.target.value })} style={inputStyle} /></FormField>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: T.space2 }}>
                <FormField label="Track"><input value={sessionDraft.track} onChange={(e) => setSessionDraft({ ...sessionDraft, track: e.target.value })} placeholder="e.g. Indoor Clockwise" style={inputStyle} /></FormField>
                <FormField label="Coach"><input value={sessionDraft.coach} onChange={(e) => setSessionDraft({ ...sessionDraft, coach: e.target.value })} placeholder="e.g. Coach Kareem" style={inputStyle} /></FormField>
              </div>
            </div>
          </div>

          <FormField label={editingSessionId || sessionCreateMode === "single" ? "Session Topic" : "Series Title"}>
            {editingSessionId || sessionCreateMode === "single" ? (
              <input
                value={sessionDraft.topic}
                onChange={(e) => setSessionDraft({ ...sessionDraft, topic: e.target.value })}
                placeholder="Session topic"
                style={inputStyle}
                required
              />
            ) : (
              <div style={{ display: "grid", gap: T.space3 }}>
                <input
                  value={sessionDraft.seriesTitle}
                  onChange={(e) => setSessionDraft({ ...sessionDraft, seriesTitle: e.target.value })}
                  placeholder="e.g. Driver Development"
                  style={inputStyle}
                  required
                />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: T.space2 }}>
                  <FormField label="Number of Sessions">
                    <input
                      type="number"
                      min={2}
                      max={24}
                      value={sessionDraft.seriesCount}
                      onChange={(e) => setSessionDraft({ ...sessionDraft, seriesCount: e.target.value })}
                      style={inputStyle}
                    />
                  </FormField>
                  <FormField label="Repeat Every (Weeks)">
                    <input
                      type="number"
                      min={1}
                      max={8}
                      value={sessionDraft.seriesIntervalWeeks}
                      onChange={(e) => setSessionDraft({ ...sessionDraft, seriesIntervalWeeks: e.target.value })}
                      style={inputStyle}
                    />
                  </FormField>
                </div>
              </div>
            )}
          </FormField>
          {!editingSessionId && sessionCreateMode === "series" ? (
            <div style={{ display: "grid", gap: T.space2 }}>
              <FieldLabel>Series Preview</FieldLabel>
              <div style={{ display: "grid", gap: T.space2, padding: T.space3, borderRadius: T.radiusMd, border: `1px solid ${T.border}`, backgroundColor: T.surfaceSoft }}>
                <p style={{ color: T.subtle, fontSize: T.textSm, lineHeight: 1.45, margin: 0 }}>
                  Sessions repeat every {seriesIntervalWeeks} {seriesIntervalWeeks === 1 ? "week" : "weeks"} from the starting date.
                </p>
                <div style={{ display: "grid", gap: T.space2 }}>
                  {seriesPreview.slice(0, 8).map((session, index) => (
                    <div key={`${session.date}-${index}`} style={{ display: "grid", gridTemplateColumns: "32px minmax(0, 1fr) auto", gap: T.space2, alignItems: "center", padding: "8px 10px", borderRadius: T.radiusSm, border: `1px solid ${T.borderSoft}`, backgroundColor: T.surface }}>
                      <span style={{ color: T.subtle, fontSize: T.textSm, fontWeight: 700 }}>{index + 1}</span>
                      <span style={{ color: T.heading, fontSize: T.textSm, fontWeight: 600, lineHeight: 1.35 }}>{session.topic}</span>
                      <span style={{ color: T.muted, fontSize: T.textXs, fontWeight: 600 }}>{formatCompactDate(session.date)}</span>
                    </div>
                  ))}
                  {seriesPreview.length > 8 ? (
                    <p style={{ color: T.subtle, fontSize: T.textXs, lineHeight: 1.4, margin: 0 }}>
                      +{seriesPreview.length - 8} more sessions will be created in this series.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </form>
      </CenterPopup>

      <CenterPopup
        open={syllabusPopupOpen}
        title="Add Syllabus Week"
        headline={cohort.name}
        description="Add the next syllabus week for this cohort."
        onClose={closeSyllabusPopup}
        footer={(
          <>
            <Btn variant="secondary" onClick={closeSyllabusPopup}>Cancel</Btn>
            <Btn type="submit" onClick={() => { const form = document.getElementById("syllabus-form") as HTMLFormElement | null; form?.requestSubmit(); }}>Save Week</Btn>
          </>
        )}
      >
        <form id="syllabus-form" onSubmit={submitSyllabus} style={{ display: "grid", gap: T.space3 }}>
          <FormField label="Week"><input value={syllabusDraft.weekLabel} onChange={(e) => setSyllabusDraft({ ...syllabusDraft, weekLabel: e.target.value })} style={inputStyle} /></FormField>
          <FormField label="Title"><input value={syllabusDraft.title} onChange={(e) => setSyllabusDraft({ ...syllabusDraft, title: e.target.value })} placeholder="Topic title" style={inputStyle} required /></FormField>
          <FormField label="Objective"><textarea value={syllabusDraft.objective} onChange={(e) => setSyllabusDraft({ ...syllabusDraft, objective: e.target.value })} placeholder="Learning objectives" style={textareaStyle} /></FormField>
          <div>
            <FieldLabel>Status</FieldLabel>
            <FieldShell>
              <select value={syllabusDraft.status} onChange={(e) => setSyllabusDraft({ ...syllabusDraft, status: e.target.value as SyllabusStatus })} style={{ ...inputStyle, cursor: "pointer" }}>
                <option value="planned">Planned</option>
                <option value="live">Live</option>
                <option value="complete">Complete</option>
              </select>
            </FieldShell>
          </div>
        </form>
      </CenterPopup>
    </div>
  );
}
