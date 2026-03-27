import { useEffect, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, CalendarDays, GraduationCap, Plus, X } from "lucide-react";
import {
  ActionButton,
  ADMIN_THEME,
  MetricCard,
  SectionTitle,
  STORAGE_KEY,
  Surface,
  formatDateTime,
  loadCohorts,
  type Cohort,
  type ScheduledClass,
  type SyllabusItem,
  type SyllabusStatus,
} from "./AdminDashboard";

const nestedCardStyle: CSSProperties = {
  border: `1px solid ${ADMIN_THEME.borderSoft}`,
  backgroundColor: ADMIN_THEME.surfaceSoft,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.75)",
};

const SYLLABUS_COLORS: Record<SyllabusStatus, { bg: string; text: string; border: string }> = {
  planned: { bg: "#F3EEE8", text: "#7E7063", border: "rgba(73,57,42,0.12)" },
  live: { bg: "rgba(200,52,46,0.10)", text: "#B6332C", border: "rgba(200,52,46,0.22)" },
  complete: { bg: "rgba(34,197,94,0.10)", text: "#247A44", border: "rgba(34,197,94,0.22)" },
};

const inputStyle: CSSProperties = {
  width: "100%",
  height: "42px",
  background: "transparent",
  border: "none",
  outline: "none",
  color: ADMIN_THEME.heading,
  fontSize: "13px",
  fontFamily: "var(--font-body)",
};

const textareaStyle: CSSProperties = {
  width: "100%",
  minHeight: "88px",
  padding: "10px 0",
  resize: "vertical",
  background: "transparent",
  border: "none",
  outline: "none",
  color: ADMIN_THEME.heading,
  fontSize: "13px",
  fontFamily: "var(--font-body)",
};

interface ClassDraft {
  date: string;
  time: string;
  track: string;
  coach: string;
  topic: string;
}

interface SyllabusDraft {
  weekLabel: string;
  title: string;
  objective: string;
  status: SyllabusStatus;
}

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function getInitialCohort(targetId?: string) {
  const cohorts = loadCohorts();
  return cohorts.find((cohort) => cohort.id === targetId) ?? cohorts[0];
}

function getTodayDate() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getDatePlusDays(dateString: string, days: number) {
  const [year, month, day] = dateString.split("-").map(Number);

  if (![year, month, day].every(Number.isFinite)) {
    return dateString;
  }

  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getSessionTimestamp(session: ScheduledClass) {
  return new Date(`${session.date}T${session.time}:00`).getTime();
}

function buildClassDraft(cohort: Cohort): ClassDraft {
  const orderedClasses = [...cohort.classes].sort((left, right) => getSessionTimestamp(left) - getSessionTimestamp(right));
  const lastClass = orderedClasses[orderedClasses.length - 1];

  return {
    date: lastClass ? getDatePlusDays(lastClass.date, 7) : getTodayDate(),
    time: lastClass?.time ?? "16:30",
    track: lastClass?.track ?? cohort.room,
    coach: lastClass?.coach ?? cohort.coach,
    topic: "",
  };
}

function buildSyllabusDraft(nextIndex: number): SyllabusDraft {
  return {
    weekLabel: `Week ${String(nextIndex).padStart(2, "0")}`,
    title: "",
    objective: "",
    status: "planned",
  };
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
        marginBottom: "6px",
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
        borderRadius: "12px",
        padding: "0 12px",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.75)",
      }}
    >
      {children}
    </div>
  );
}

interface AdminCohortTeachingPageProps {
  initialCohortId?: string;
  onBackToCohortDashboard?: (cohortId: string) => void;
}

export function AdminCohortTeachingPage({
  initialCohortId,
  onBackToCohortDashboard,
}: AdminCohortTeachingPageProps) {
  const [cohorts, setCohorts] = useState<Cohort[]>(() => loadCohorts());
  const [selectedCohortId, setSelectedCohortId] = useState(() => initialCohortId ?? loadCohorts()[0]?.id ?? "");
  const [classDraft, setClassDraft] = useState<ClassDraft>(() => {
    const initialCohort = getInitialCohort(initialCohortId);
    return initialCohort ? buildClassDraft(initialCohort) : { date: getTodayDate(), time: "16:30", track: "", coach: "", topic: "" };
  });
  const [syllabusDraft, setSyllabusDraft] = useState<SyllabusDraft>(() => {
    const initialCohort = getInitialCohort(initialCohortId);
    return initialCohort ? buildSyllabusDraft(initialCohort.syllabus.length + 1) : buildSyllabusDraft(1);
  });
  const [sessionSearch, setSessionSearch] = useState("");
  const [syllabusSearch, setSyllabusSearch] = useState("");
  const [classFilter, setClassFilter] = useState<"all" | "upcoming" | "past">("upcoming");
  const [syllabusFilter, setSyllabusFilter] = useState<"all" | SyllabusStatus>("all");
  const [isTeachingEditMode, setIsTeachingEditMode] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editingClassDraft, setEditingClassDraft] = useState<ClassDraft | null>(null);
  const [editingSyllabusId, setEditingSyllabusId] = useState<string | null>(null);
  const [editingSyllabusDraft, setEditingSyllabusDraft] = useState<SyllabusDraft | null>(null);

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

    setSessionSearch("");
    setSyllabusSearch("");
    setClassFilter("upcoming");
    setSyllabusFilter("all");
    setIsTeachingEditMode(false);
    setEditingClassId(null);
    setEditingClassDraft(null);
    setEditingSyllabusId(null);
    setEditingSyllabusDraft(null);
    setClassDraft(buildClassDraft(selectedCohort));
    setSyllabusDraft(buildSyllabusDraft(selectedCohort.syllabus.length + 1));
  }, [selectedCohortId]);

  function updateSelectedCohort(mutator: (cohort: Cohort) => Cohort) {
    if (!selectedCohort) {
      return;
    }

    setCohorts((current) =>
      current.map((cohort) => (cohort.id === selectedCohort.id ? mutator(cohort) : cohort)),
    );
  }

  function resetSyllabusForm(nextIndex = (selectedCohort?.syllabus.length ?? 0) + 1) {
    setEditingSyllabusId(null);
    setSyllabusDraft(buildSyllabusDraft(nextIndex));
  }

  function handleCloseClassEditModal() {
    setEditingClassId(null);
    setEditingClassDraft(null);
  }

  function handleCloseSyllabusEditModal() {
    setEditingSyllabusId(null);
    setEditingSyllabusDraft(null);
  }

  function handleToggleTeachingEditMode() {
    const nextValue = !isTeachingEditMode;
    setIsTeachingEditMode(nextValue);

    if (!nextValue) {
      handleCloseClassEditModal();
      handleCloseSyllabusEditModal();
    }
  }

  function handleClassSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedCohort || !classDraft.topic.trim() || !classDraft.date || !classDraft.time) {
      return;
    }

    const nextTrack = classDraft.track.trim() || selectedCohort.room;
    const nextCoach = classDraft.coach.trim() || selectedCohort.coach;

    const classId = createId("class");

    updateSelectedCohort((cohort) => ({
      ...cohort,
      classes: [
        ...cohort.classes,
        {
          id: classId,
          date: classDraft.date,
          time: classDraft.time,
          track: nextTrack,
          coach: nextCoach,
          topic: classDraft.topic.trim(),
        },
      ].sort((left, right) => getSessionTimestamp(left) - getSessionTimestamp(right)),
      students: cohort.students.map((student) => ({
        ...student,
        attendance: {
          ...student.attendance,
          [classId]: "pending",
        },
      })),
    }));

    setClassDraft({
      date: getDatePlusDays(classDraft.date, 7),
      time: classDraft.time,
      track: nextTrack,
      coach: nextCoach,
      topic: "",
    });
  }

  function handleClassEdit(session: ScheduledClass) {
    setEditingClassId(session.id);
    setEditingClassDraft({
      date: session.date,
      time: session.time,
      track: session.track,
      coach: session.coach,
      topic: session.topic,
    });
  }

  function handleClassEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedCohort || !editingClassId || !editingClassDraft || !editingClassDraft.topic.trim() || !editingClassDraft.date || !editingClassDraft.time) {
      return;
    }

    const nextTrack = editingClassDraft.track.trim() || selectedCohort.room;
    const nextCoach = editingClassDraft.coach.trim() || selectedCohort.coach;

    updateSelectedCohort((cohort) => ({
      ...cohort,
      classes: cohort.classes
        .map((session) =>
          session.id === editingClassId
            ? {
                ...session,
                date: editingClassDraft.date,
                time: editingClassDraft.time,
                track: nextTrack,
                coach: nextCoach,
                topic: editingClassDraft.topic.trim(),
              }
            : session,
        )
        .sort((left, right) => getSessionTimestamp(left) - getSessionTimestamp(right)),
    }));

    handleCloseClassEditModal();
  }

  function handleClassDelete(session: ScheduledClass) {
    if (typeof window !== "undefined" && !window.confirm(`Delete ${session.topic} from the class schedule?`)) {
      return;
    }

    updateSelectedCohort((cohort) => ({
      ...cohort,
      classes: cohort.classes.filter((entry) => entry.id !== session.id),
      students: cohort.students.map((student) => {
        const nextAttendance = { ...student.attendance };
        delete nextAttendance[session.id];

        return {
          ...student,
          attendance: nextAttendance,
        };
      }),
    }));

    if (editingClassId === session.id) {
      handleCloseClassEditModal();
    }
  }

  function handleSyllabusSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedCohort || !syllabusDraft.title.trim()) {
      return;
    }

    updateSelectedCohort((cohort) => ({
      ...cohort,
      syllabus: [
        {
          id: createId("syllabus"),
          weekLabel: syllabusDraft.weekLabel.trim() || `Week ${String(cohort.syllabus.length + 1).padStart(2, "0")}`,
          title: syllabusDraft.title.trim(),
          objective: syllabusDraft.objective.trim(),
          status: syllabusDraft.status,
        },
        ...cohort.syllabus,
      ],
    }));

    resetSyllabusForm(selectedCohort.syllabus.length + 2);
  }

  function handleSyllabusEdit(item: SyllabusItem) {
    setEditingSyllabusId(item.id);
    setEditingSyllabusDraft({
      weekLabel: item.weekLabel,
      title: item.title,
      objective: item.objective,
      status: item.status,
    });
  }

  function handleSyllabusEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedCohort || !editingSyllabusId || !editingSyllabusDraft || !editingSyllabusDraft.title.trim()) {
      return;
    }

    updateSelectedCohort((cohort) => ({
      ...cohort,
      syllabus: cohort.syllabus.map((item) =>
        item.id === editingSyllabusId
          ? {
              ...item,
              weekLabel: editingSyllabusDraft.weekLabel.trim() || item.weekLabel,
              title: editingSyllabusDraft.title.trim(),
              objective: editingSyllabusDraft.objective.trim(),
              status: editingSyllabusDraft.status,
            }
          : item,
      ),
    }));

    handleCloseSyllabusEditModal();
  }

  function handleSyllabusDelete(item: SyllabusItem) {
    if (typeof window !== "undefined" && !window.confirm(`Delete ${item.title} from the syllabus board?`)) {
      return;
    }

    updateSelectedCohort((cohort) => ({
      ...cohort,
      syllabus: cohort.syllabus.filter((entry) => entry.id !== item.id),
    }));

    if (editingSyllabusId === item.id) {
      handleCloseSyllabusEditModal();
    }
  }

  if (!selectedCohort) {
    return null;
  }

  const now = Date.now();
  const nextSession =
    [...selectedCohort.classes].sort((left, right) => getSessionTimestamp(left) - getSessionTimestamp(right)).find((session) => getSessionTimestamp(session) >= now) ??
    [...selectedCohort.classes].sort((left, right) => getSessionTimestamp(left) - getSessionTimestamp(right))[0];
  const liveModules = selectedCohort.syllabus.filter((item) => item.status === "live").length;
  const completedModules = selectedCohort.syllabus.filter((item) => item.status === "complete").length;
  const nextModule = selectedCohort.syllabus.find((item) => item.status === "live") ?? selectedCohort.syllabus[0];
  const editingClass = selectedCohort.classes.find((session) => session.id === editingClassId);
  const editingSyllabus = selectedCohort.syllabus.find((item) => item.id === editingSyllabusId);
  const normalizedSessionSearch = sessionSearch.trim().toLowerCase();
  const normalizedSyllabusSearch = syllabusSearch.trim().toLowerCase();
  const filteredClasses = selectedCohort.classes.filter((session) => {
    const matchesSearch = normalizedSessionSearch
      ? [session.topic, session.track, session.coach, session.date, session.time]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSessionSearch)
      : true;
    const matchesFilter =
      classFilter === "all"
        ? true
        : classFilter === "upcoming"
          ? getSessionTimestamp(session) >= now
          : getSessionTimestamp(session) < now;

    return matchesSearch && matchesFilter;
  });
  const filteredSyllabus = selectedCohort.syllabus.filter((item) => {
    const matchesSearch = normalizedSyllabusSearch
      ? [item.weekLabel, item.title, item.objective, item.status]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSyllabusSearch)
      : true;
    const matchesFilter = syllabusFilter === "all" ? true : item.status === syllabusFilter;

    return matchesSearch && matchesFilter;
  });

  return (
    <>
      <style>{`
        .cohort-teaching-grid {
          display: grid;
          gap: 14px;
        }
        .cohort-teaching-two-up {
          display: grid;
          grid-template-columns: minmax(300px, 360px) minmax(0, 1fr);
          gap: 12px;
          align-items: start;
        }
        .cohort-teaching-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }
        .cohort-teaching-full-span {
          grid-column: 1 / -1;
        }
        .cohort-teaching-card-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        @media (max-width: 1120px) {
          .cohort-teaching-two-up,
          .cohort-teaching-form-grid,
          .cohort-teaching-card-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div style={{ display: "grid", gap: "16px" }}>
        <Surface
          accent
          style={{
            padding: "22px",
            background:
              "radial-gradient(circle at top right, rgba(200,52,46,0.16), transparent 28%), linear-gradient(135deg, #FFFFFF 0%, #F8F4EF 100%)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: "18px", flexWrap: "wrap" }}>
            <div style={{ maxWidth: "760px", display: "grid", gap: "12px" }}>
              {onBackToCohortDashboard ? (
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <ActionButton secondary onClick={() => onBackToCohortDashboard(selectedCohort.id)} style={{ minWidth: "196px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                      <ArrowLeft size={16} /> Back To Cohort Dashboard
                    </span>
                  </ActionButton>
                </div>
              ) : null}

              <SectionTitle eyebrow="Teaching Operations" title={selectedCohort.name} detail={selectedCohort.program} />
              <p style={{ color: ADMIN_THEME.muted, fontSize: "15px", lineHeight: 1.7, margin: 0 }}>
                Schedule sessions and shape the syllabus from one focused workspace. Class planning, module sequencing,
                search, and safe edit controls live together here instead of crowding the main cohort dashboard.
              </p>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <span style={{ padding: "7px 10px", borderRadius: "999px", border: `1px solid ${ADMIN_THEME.accentBorder}`, backgroundColor: ADMIN_THEME.accentBg, color: ADMIN_THEME.accent, fontSize: "11px", letterSpacing: "0px", textTransform: "uppercase" }}>
                  {selectedCohort.cadence}
                </span>
                <span style={{ padding: "7px 10px", borderRadius: "999px", border: `1px solid ${ADMIN_THEME.border}`, backgroundColor: ADMIN_THEME.surfaceSoft, color: ADMIN_THEME.muted, fontSize: "11px", letterSpacing: "0px", textTransform: "uppercase" }}>
                  {selectedCohort.room}
                </span>
                <span style={{ padding: "7px 10px", borderRadius: "999px", border: `1px solid ${ADMIN_THEME.border}`, backgroundColor: ADMIN_THEME.surfaceSoft, color: ADMIN_THEME.muted, fontSize: "11px", letterSpacing: "0px", textTransform: "uppercase" }}>
                  Coach {selectedCohort.coach}
                </span>
              </div>
            </div>

            <div
              style={{
                minWidth: "280px",
                padding: "18px",
                borderRadius: "18px",
                border: `1px solid ${ADMIN_THEME.border}`,
                background: "linear-gradient(180deg, #FFFFFF 0%, #F7F2ED 100%)",
                boxShadow: "0 12px 30px rgba(70,46,25,0.08)",
                display: "grid",
                gap: "8px",
              }}
            >
              <p style={{ color: ADMIN_THEME.subtle, fontSize: "10px", letterSpacing: "0px", textTransform: "uppercase", margin: 0 }}>
                Next Teaching Focus
              </p>
              <h3 style={{ color: ADMIN_THEME.heading, fontSize: "26px", fontFamily: "var(--font-heading)", margin: 0, lineHeight: 1 }}>
                {nextSession ? nextSession.topic : nextModule?.title ?? "No teaching items yet"}
              </h3>
              <p style={{ color: ADMIN_THEME.muted, fontSize: "14px", margin: 0 }}>
                {nextSession
                  ? `${formatDateTime(nextSession.date, nextSession.time)} • ${nextSession.track}`
                  : nextModule
                    ? `${nextModule.weekLabel} • ${nextModule.status}`
                    : "Add a session or syllabus block to get started."}
              </p>
            </div>
          </div>
        </Surface>

        <div className="cohort-teaching-card-grid">
          <MetricCard
            icon={<CalendarDays size={20} />}
            label="Scheduled Sessions"
            value={String(selectedCohort.classes.length)}
            note={nextSession ? `Next: ${formatDateTime(nextSession.date, nextSession.time)}` : "No sessions scheduled yet"}
          />
          <MetricCard
            icon={<GraduationCap size={20} />}
            label="Syllabus Progress"
            value={`${completedModules}/${selectedCohort.syllabus.length}`}
            note={liveModules > 0 ? `${liveModules} live modules in motion` : "No live modules flagged right now"}
          />
        </div>

        <div className="cohort-teaching-two-up">
          <div className="cohort-teaching-grid">
            <Surface style={{ padding: "16px", alignSelf: "start" }}>
              <SectionTitle
                eyebrow="Class Planner"
                title="Schedule Class"
                detail={selectedCohort.cadence}
                titleStyle={{ fontSize: "24px" }}
              />
              <form onSubmit={handleClassSubmit} className="cohort-teaching-form-grid">
                <div>
                  <FieldLabel>Date</FieldLabel>
                  <FieldShell>
                    <input
                      type="date"
                      value={classDraft.date}
                      onChange={(event) => setClassDraft((current) => ({ ...current, date: event.target.value }))}
                      style={inputStyle}
                    />
                  </FieldShell>
                </div>
                <div>
                  <FieldLabel>Time</FieldLabel>
                  <FieldShell>
                    <input
                      type="time"
                      value={classDraft.time}
                      onChange={(event) => setClassDraft((current) => ({ ...current, time: event.target.value }))}
                      style={inputStyle}
                    />
                  </FieldShell>
                </div>
                <div>
                  <FieldLabel>Track</FieldLabel>
                  <FieldShell>
                    <input
                      value={classDraft.track}
                      onChange={(event) => setClassDraft((current) => ({ ...current, track: event.target.value }))}
                      placeholder={selectedCohort.room}
                      style={inputStyle}
                    />
                  </FieldShell>
                </div>
                <div>
                  <FieldLabel>Coach</FieldLabel>
                  <FieldShell>
                    <input
                      value={classDraft.coach}
                      onChange={(event) => setClassDraft((current) => ({ ...current, coach: event.target.value }))}
                      placeholder={selectedCohort.coach}
                      style={inputStyle}
                    />
                  </FieldShell>
                </div>
                <div className="cohort-teaching-full-span">
                  <FieldLabel>Session Topic</FieldLabel>
                  <FieldShell>
                    <input
                      value={classDraft.topic}
                      onChange={(event) => setClassDraft((current) => ({ ...current, topic: event.target.value }))}
                      placeholder="Set the drill or classroom focus for the session"
                      style={inputStyle}
                    />
                  </FieldShell>
                </div>
                <div className="cohort-teaching-full-span" style={{ display: "grid", gap: "10px" }}>
                  <p style={{ color: ADMIN_THEME.subtle, fontSize: "11px", lineHeight: 1.45, margin: 0 }}>
                    Every new session automatically adds a pending attendance placeholder for every student in this cohort.
                    After scheduling, the form rolls forward by one week to speed up recurring planning.
                  </p>
                  <ActionButton type="submit" style={{ minWidth: "158px", justifySelf: "end" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                      <Plus size={14} /> Schedule Class
                    </span>
                  </ActionButton>
                </div>
              </form>
            </Surface>

            <Surface style={{ padding: "16px", alignSelf: "start" }}>
              <SectionTitle
                eyebrow="Syllabus Builder"
                title="Add Syllabus Block"
                detail={`${selectedCohort.syllabus.length} current blocks`}
                titleStyle={{ fontSize: "24px" }}
              />
              <form onSubmit={handleSyllabusSubmit} className="cohort-teaching-form-grid">
                <div>
                  <FieldLabel>Week Label</FieldLabel>
                  <FieldShell>
                    <input
                      value={syllabusDraft.weekLabel}
                      onChange={(event) => setSyllabusDraft((current) => ({ ...current, weekLabel: event.target.value }))}
                      placeholder="Week 04"
                      style={inputStyle}
                    />
                  </FieldShell>
                </div>
                <div>
                  <FieldLabel>Status</FieldLabel>
                  <FieldShell>
                    <select
                      value={syllabusDraft.status}
                      onChange={(event) => setSyllabusDraft((current) => ({ ...current, status: event.target.value as SyllabusStatus }))}
                      style={inputStyle}
                    >
                      <option value="planned">Planned</option>
                      <option value="live">Live</option>
                      <option value="complete">Complete</option>
                    </select>
                  </FieldShell>
                </div>
                <div className="cohort-teaching-full-span">
                  <FieldLabel>Module Title</FieldLabel>
                  <FieldShell>
                    <input
                      value={syllabusDraft.title}
                      onChange={(event) => setSyllabusDraft((current) => ({ ...current, title: event.target.value }))}
                      placeholder="Braking release and exit drive"
                      style={inputStyle}
                    />
                  </FieldShell>
                </div>
                <div className="cohort-teaching-full-span">
                  <FieldLabel>Objective</FieldLabel>
                  <FieldShell>
                    <textarea
                      value={syllabusDraft.objective}
                      onChange={(event) => setSyllabusDraft((current) => ({ ...current, objective: event.target.value }))}
                      placeholder="Describe what students should leave the session knowing."
                      style={textareaStyle}
                    />
                  </FieldShell>
                </div>
                <div className="cohort-teaching-full-span" style={{ display: "grid", gap: "10px" }}>
                  <p style={{ color: ADMIN_THEME.subtle, fontSize: "11px", lineHeight: 1.45, margin: 0 }}>
                    Keep live, planned, and complete modules accurate here so coaches can see the real teaching sequence at a glance.
                  </p>
                  <ActionButton type="submit" style={{ minWidth: "162px", justifySelf: "end" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                      <Plus size={14} /> Add Syllabus
                    </span>
                  </ActionButton>
                </div>
              </form>
            </Surface>
          </div>

          <div className="cohort-teaching-grid">
            <Surface style={{ padding: "16px", alignSelf: "start" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "10px",
                  flexWrap: "wrap",
                  alignItems: "flex-start",
                  marginBottom: "10px",
                }}
              >
                <SectionTitle
                  eyebrow="Teaching Controls"
                  title="Sessions + Syllabus"
                  detail="Search and manage teaching items from one page"
                  titleStyle={{ fontSize: "24px" }}
                />
                <button
                  type="button"
                  onClick={handleToggleTeachingEditMode}
                  style={{
                    minHeight: "34px",
                    padding: "0 12px",
                    borderRadius: "999px",
                    border: `1px solid ${isTeachingEditMode ? ADMIN_THEME.accentBorder : ADMIN_THEME.border}`,
                    backgroundColor: isTeachingEditMode ? ADMIN_THEME.accentBg : ADMIN_THEME.surface,
                    color: isTeachingEditMode ? ADMIN_THEME.accent : ADMIN_THEME.heading,
                    fontSize: "10px",
                    fontWeight: 800,
                    letterSpacing: "0px",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  {isTeachingEditMode ? "Done Editing" : "Edit Teaching Items"}
                </button>
              </div>
              <p style={{ color: ADMIN_THEME.subtle, fontSize: "11px", lineHeight: 1.45, margin: 0 }}>
                Search classes and modules independently below. Turn on edit mode to reveal edit and delete actions across both lists.
              </p>
            </Surface>

            <Surface style={{ padding: "16px", alignSelf: "start" }}>
              <SectionTitle
                eyebrow="Class Timeline"
                title="Scheduled Sessions"
                detail={
                  classFilter === "all"
                    ? `${filteredClasses.length}/${selectedCohort.classes.length} shown`
                    : `${filteredClasses.length} ${classFilter}`
                }
                titleStyle={{ fontSize: "24px" }}
              />
              <div className="cohort-teaching-form-grid" style={{ marginBottom: "10px" }}>
                <div>
                  <FieldLabel>Search Sessions</FieldLabel>
                  <FieldShell>
                    <input
                      value={sessionSearch}
                      onChange={(event) => setSessionSearch(event.target.value)}
                      placeholder="Search topic, track, coach, or date"
                      style={inputStyle}
                    />
                  </FieldShell>
                </div>
                <div>
                  <FieldLabel>View</FieldLabel>
                  <FieldShell>
                    <select value={classFilter} onChange={(event) => setClassFilter(event.target.value as "all" | "upcoming" | "past")} style={inputStyle}>
                      <option value="upcoming">Upcoming</option>
                      <option value="all">All Sessions</option>
                      <option value="past">Past Sessions</option>
                    </select>
                  </FieldShell>
                </div>
              </div>
              <div style={{ display: "grid", gap: "8px" }}>
                {selectedCohort.classes.length === 0 ? (
                  <div
                    style={{
                      padding: "14px",
                      borderRadius: "14px",
                      border: `1px dashed ${ADMIN_THEME.border}`,
                      color: ADMIN_THEME.subtle,
                      fontSize: "13px",
                      backgroundColor: ADMIN_THEME.surfaceSoft,
                    }}
                  >
                    No sessions are scheduled for this cohort yet.
                  </div>
                ) : filteredClasses.length === 0 ? (
                  <div
                    style={{
                      padding: "14px",
                      borderRadius: "14px",
                      border: `1px dashed ${ADMIN_THEME.border}`,
                      color: ADMIN_THEME.subtle,
                      fontSize: "13px",
                      backgroundColor: ADMIN_THEME.surfaceSoft,
                    }}
                  >
                    No sessions match the current search or filter.
                  </div>
                ) : (
                  filteredClasses.map((session) => {
                    const isUpcoming = getSessionTimestamp(session) >= now;

                    return (
                      <div
                        key={session.id}
                        style={{
                          padding: "12px",
                          borderRadius: "14px",
                          display: "grid",
                          gap: "8px",
                          ...nestedCardStyle,
                          border:
                            editingClassId === session.id
                              ? `1px solid ${ADMIN_THEME.accentBorder}`
                              : nestedCardStyle.border,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap", alignItems: "flex-start" }}>
                          <div style={{ display: "grid", gap: "4px" }}>
                            <p style={{ color: ADMIN_THEME.accent, fontSize: "10px", letterSpacing: "0px", textTransform: "uppercase", margin: 0 }}>
                              {formatDateTime(session.date, session.time)}
                            </p>
                            <h4 style={{ color: ADMIN_THEME.heading, fontSize: "16px", fontFamily: "var(--font-body)", fontStyle: "italic", fontWeight: 800, margin: 0 }}>
                              {session.topic}
                            </h4>
                          </div>
                          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            <span
                              style={{
                                padding: "6px 9px",
                                borderRadius: "999px",
                                backgroundColor: isUpcoming ? ADMIN_THEME.accentBg : ADMIN_THEME.surface,
                                border: `1px solid ${isUpcoming ? ADMIN_THEME.accentBorder : ADMIN_THEME.borderSoft}`,
                                color: isUpcoming ? ADMIN_THEME.accent : ADMIN_THEME.muted,
                                fontSize: "10px",
                                letterSpacing: "0px",
                                textTransform: "uppercase",
                              }}
                            >
                              {isUpcoming ? "Upcoming" : "Past"}
                            </span>
                            {isTeachingEditMode ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleClassEdit(session)}
                                  style={{
                                    minHeight: "30px",
                                    padding: "0 9px",
                                    borderRadius: "999px",
                                    border: `1px solid ${ADMIN_THEME.border}`,
                                    backgroundColor:
                                      editingClassId === session.id ? ADMIN_THEME.accentBg : ADMIN_THEME.surface,
                                    color: ADMIN_THEME.heading,
                                    fontSize: "10px",
                                    fontWeight: 800,
                                    letterSpacing: "0px",
                                    textTransform: "uppercase",
                                    cursor: "pointer",
                                  }}
                                >
                                  {editingClassId === session.id ? "Editing" : "Edit"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleClassDelete(session)}
                                  style={{
                                    minHeight: "30px",
                                    padding: "0 9px",
                                    borderRadius: "999px",
                                    border: `1px solid ${ADMIN_THEME.accentBorder}`,
                                    backgroundColor: ADMIN_THEME.accentBg,
                                    color: ADMIN_THEME.accent,
                                    fontSize: "10px",
                                    fontWeight: 800,
                                    letterSpacing: "0px",
                                    textTransform: "uppercase",
                                    cursor: "pointer",
                                  }}
                                >
                                  Delete
                                </button>
                              </>
                            ) : null}
                          </div>
                        </div>
                        <p style={{ color: ADMIN_THEME.muted, fontSize: "12px", margin: 0 }}>
                          {session.track} | Coach {session.coach}
                        </p>
                        <p style={{ color: ADMIN_THEME.subtle, fontSize: "11px", lineHeight: 1.45, margin: 0 }}>
                          {selectedCohort.students.length} attendance placeholders are ready for this session.
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </Surface>

            <Surface style={{ padding: "16px", alignSelf: "start" }}>
              <SectionTitle
                eyebrow="Syllabus Board"
                title="Current Training Blocks"
                detail={
                  syllabusFilter === "all"
                    ? `${filteredSyllabus.length}/${selectedCohort.syllabus.length} shown`
                    : `${filteredSyllabus.length} ${syllabusFilter}`
                }
                titleStyle={{ fontSize: "24px" }}
              />
              <div className="cohort-teaching-form-grid" style={{ marginBottom: "10px" }}>
                <div>
                  <FieldLabel>Search Modules</FieldLabel>
                  <FieldShell>
                    <input
                      value={syllabusSearch}
                      onChange={(event) => setSyllabusSearch(event.target.value)}
                      placeholder="Search week, title, objective, or status"
                      style={inputStyle}
                    />
                  </FieldShell>
                </div>
                <div>
                  <FieldLabel>Status Filter</FieldLabel>
                  <FieldShell>
                    <select value={syllabusFilter} onChange={(event) => setSyllabusFilter(event.target.value as "all" | SyllabusStatus)} style={inputStyle}>
                      <option value="all">All Statuses</option>
                      <option value="planned">Planned</option>
                      <option value="live">Live</option>
                      <option value="complete">Complete</option>
                    </select>
                  </FieldShell>
                </div>
              </div>
              <div style={{ display: "grid", gap: "8px" }}>
                {selectedCohort.syllabus.length === 0 ? (
                  <div
                    style={{
                      padding: "14px",
                      borderRadius: "14px",
                      border: `1px dashed ${ADMIN_THEME.border}`,
                      color: ADMIN_THEME.subtle,
                      fontSize: "13px",
                      backgroundColor: ADMIN_THEME.surfaceSoft,
                    }}
                  >
                    No syllabus blocks have been added for this cohort yet.
                  </div>
                ) : filteredSyllabus.length === 0 ? (
                  <div
                    style={{
                      padding: "14px",
                      borderRadius: "14px",
                      border: `1px dashed ${ADMIN_THEME.border}`,
                      color: ADMIN_THEME.subtle,
                      fontSize: "13px",
                      backgroundColor: ADMIN_THEME.surfaceSoft,
                    }}
                  >
                    No syllabus blocks match the current search or filter.
                  </div>
                ) : (
                  filteredSyllabus.map((item) => {
                    const colors = SYLLABUS_COLORS[item.status];

                    return (
                      <div
                        key={item.id}
                        style={{
                          padding: "12px",
                          borderRadius: "14px",
                          display: "grid",
                          gap: "8px",
                          ...nestedCardStyle,
                          border:
                            editingSyllabusId === item.id
                              ? `1px solid ${ADMIN_THEME.accentBorder}`
                              : nestedCardStyle.border,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap", alignItems: "flex-start" }}>
                          <div style={{ display: "grid", gap: "4px" }}>
                            <p style={{ color: ADMIN_THEME.subtle, fontSize: "10px", letterSpacing: "0px", textTransform: "uppercase", margin: 0 }}>
                              {item.weekLabel}
                            </p>
                            <h4 style={{ color: ADMIN_THEME.heading, fontSize: "16px", fontFamily: "var(--font-body)", fontStyle: "italic", fontWeight: 800, margin: 0 }}>
                              {item.title}
                            </h4>
                          </div>
                          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            <span
                              style={{
                                padding: "6px 9px",
                                borderRadius: "999px",
                                backgroundColor: colors.bg,
                                border: `1px solid ${colors.border}`,
                                color: colors.text,
                                fontSize: "10px",
                                letterSpacing: "0px",
                                textTransform: "uppercase",
                              }}
                            >
                              {item.status}
                            </span>
                            {isTeachingEditMode ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleSyllabusEdit(item)}
                                  style={{
                                    minHeight: "30px",
                                    padding: "0 9px",
                                    borderRadius: "999px",
                                    border: `1px solid ${ADMIN_THEME.border}`,
                                    backgroundColor:
                                      editingSyllabusId === item.id ? ADMIN_THEME.accentBg : ADMIN_THEME.surface,
                                    color: ADMIN_THEME.heading,
                                    fontSize: "10px",
                                    fontWeight: 800,
                                    letterSpacing: "0px",
                                    textTransform: "uppercase",
                                    cursor: "pointer",
                                  }}
                                >
                                  {editingSyllabusId === item.id ? "Editing" : "Edit"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSyllabusDelete(item)}
                                  style={{
                                    minHeight: "30px",
                                    padding: "0 9px",
                                    borderRadius: "999px",
                                    border: `1px solid ${ADMIN_THEME.accentBorder}`,
                                    backgroundColor: ADMIN_THEME.accentBg,
                                    color: ADMIN_THEME.accent,
                                    fontSize: "10px",
                                    fontWeight: 800,
                                    letterSpacing: "0px",
                                    textTransform: "uppercase",
                                    cursor: "pointer",
                                  }}
                                >
                                  Delete
                                </button>
                              </>
                            ) : null}
                          </div>
                        </div>
                        <p style={{ color: ADMIN_THEME.muted, fontSize: "12px", lineHeight: 1.45, margin: 0 }}>
                          {item.objective || "No objective saved for this syllabus block yet."}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </Surface>
          </div>
        </div>
      </div>

      {editingClass && editingClassDraft ? (
        <div
          onClick={handleCloseClassEditModal}
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
              width: "min(640px, 100%)",
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
                  Scheduled Session
                </p>
                <h3 style={{ color: ADMIN_THEME.heading, fontSize: "24px", fontFamily: "var(--font-heading)", margin: 0, lineHeight: 1 }}>
                  Edit Class
                </h3>
                <p style={{ color: ADMIN_THEME.muted, fontSize: "12px", margin: 0 }}>
                  Update the session from this popup without repurposing the add-class form.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseClassEditModal}
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

            <form onSubmit={handleClassEditSubmit} className="cohort-teaching-form-grid">
              <div>
                <FieldLabel>Date</FieldLabel>
                <FieldShell>
                  <input
                    type="date"
                    value={editingClassDraft.date}
                    onChange={(event) => setEditingClassDraft((current) => (current ? { ...current, date: event.target.value } : current))}
                    style={inputStyle}
                  />
                </FieldShell>
              </div>
              <div>
                <FieldLabel>Time</FieldLabel>
                <FieldShell>
                  <input
                    type="time"
                    value={editingClassDraft.time}
                    onChange={(event) => setEditingClassDraft((current) => (current ? { ...current, time: event.target.value } : current))}
                    style={inputStyle}
                  />
                </FieldShell>
              </div>
              <div>
                <FieldLabel>Track</FieldLabel>
                <FieldShell>
                  <input
                    value={editingClassDraft.track}
                    onChange={(event) => setEditingClassDraft((current) => (current ? { ...current, track: event.target.value } : current))}
                    placeholder={selectedCohort.room}
                    style={inputStyle}
                  />
                </FieldShell>
              </div>
              <div>
                <FieldLabel>Coach</FieldLabel>
                <FieldShell>
                  <input
                    value={editingClassDraft.coach}
                    onChange={(event) => setEditingClassDraft((current) => (current ? { ...current, coach: event.target.value } : current))}
                    placeholder={selectedCohort.coach}
                    style={inputStyle}
                  />
                </FieldShell>
              </div>
              <div className="cohort-teaching-full-span">
                <FieldLabel>Session Topic</FieldLabel>
                <FieldShell>
                  <input
                    value={editingClassDraft.topic}
                    onChange={(event) => setEditingClassDraft((current) => (current ? { ...current, topic: event.target.value } : current))}
                    placeholder="Set the drill or classroom focus for the session"
                    style={inputStyle}
                  />
                </FieldShell>
              </div>
              <div
                className="cohort-teaching-full-span"
                style={{ display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "center", flexWrap: "wrap" }}
              >
                <p style={{ color: ADMIN_THEME.subtle, fontSize: "11px", lineHeight: 1.45, margin: 0 }}>
                  Save the revised session back into the teaching timeline from this popup.
                </p>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <ActionButton secondary type="button" onClick={handleCloseClassEditModal} style={{ minWidth: "118px", minHeight: "40px" }}>
                    Cancel
                  </ActionButton>
                  <ActionButton type="submit" style={{ minWidth: "132px", minHeight: "40px" }}>
                    Save Class
                  </ActionButton>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {editingSyllabus && editingSyllabusDraft ? (
        <div
          onClick={handleCloseSyllabusEditModal}
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
              width: "min(640px, 100%)",
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
                  Syllabus Block
                </p>
                <h3 style={{ color: ADMIN_THEME.heading, fontSize: "24px", fontFamily: "var(--font-heading)", margin: 0, lineHeight: 1 }}>
                  Edit Syllabus
                </h3>
                <p style={{ color: ADMIN_THEME.muted, fontSize: "12px", margin: 0 }}>
                  Update the module from this popup while keeping the add-syllabus form dedicated to new blocks.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseSyllabusEditModal}
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

            <form onSubmit={handleSyllabusEditSubmit} className="cohort-teaching-form-grid">
              <div>
                <FieldLabel>Week Label</FieldLabel>
                <FieldShell>
                  <input
                    value={editingSyllabusDraft.weekLabel}
                    onChange={(event) => setEditingSyllabusDraft((current) => (current ? { ...current, weekLabel: event.target.value } : current))}
                    placeholder="Week 04"
                    style={inputStyle}
                  />
                </FieldShell>
              </div>
              <div>
                <FieldLabel>Status</FieldLabel>
                <FieldShell>
                  <select
                    value={editingSyllabusDraft.status}
                    onChange={(event) => setEditingSyllabusDraft((current) => (current ? { ...current, status: event.target.value as SyllabusStatus } : current))}
                    style={inputStyle}
                  >
                    <option value="planned">Planned</option>
                    <option value="live">Live</option>
                    <option value="complete">Complete</option>
                  </select>
                </FieldShell>
              </div>
              <div className="cohort-teaching-full-span">
                <FieldLabel>Module Title</FieldLabel>
                <FieldShell>
                  <input
                    value={editingSyllabusDraft.title}
                    onChange={(event) => setEditingSyllabusDraft((current) => (current ? { ...current, title: event.target.value } : current))}
                    placeholder="Braking release and exit drive"
                    style={inputStyle}
                  />
                </FieldShell>
              </div>
              <div className="cohort-teaching-full-span">
                <FieldLabel>Objective</FieldLabel>
                <FieldShell>
                  <textarea
                    value={editingSyllabusDraft.objective}
                    onChange={(event) => setEditingSyllabusDraft((current) => (current ? { ...current, objective: event.target.value } : current))}
                    placeholder="Describe what students should leave the session knowing."
                    style={textareaStyle}
                  />
                </FieldShell>
              </div>
              <div
                className="cohort-teaching-full-span"
                style={{ display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "center", flexWrap: "wrap" }}
              >
                <p style={{ color: ADMIN_THEME.subtle, fontSize: "11px", lineHeight: 1.45, margin: 0 }}>
                  Save the revised syllabus block back into the teaching board from this popup.
                </p>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <ActionButton secondary type="button" onClick={handleCloseSyllabusEditModal} style={{ minWidth: "118px", minHeight: "40px" }}>
                    Cancel
                  </ActionButton>
                  <ActionButton type="submit" style={{ minWidth: "146px", minHeight: "40px" }}>
                    Save Syllabus
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
