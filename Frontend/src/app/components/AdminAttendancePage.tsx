import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CalendarDays, Check, Clock3, MoreHorizontal, X } from "lucide-react";
import type { AttendanceWorkflowStatus, Cohort, ScheduledClass } from "../types";
import { T, workflowTone } from "../theme";
import {
  formatDateTime,
  getAttendanceWorkflowLabel,
  getSessionAttendanceCounts,
  getSessionAttendanceMarkedCount,
  getSessionAttendanceWorkflowStatus,
  setSessionAttendanceWorkflowStatus,
} from "../utils";
import { loadCohorts, STORAGE_KEY } from "../storage";
import {
  Breadcrumbs, Btn, EmptyState, FilterBar, InlineSelect, PageHeader, SearchInput,
  SectionLabel, StatusChip, Surface, TableHeader, TableRow, TableShell, Td, Th,
} from "./shared";

type AttendanceBucket = "present" | "late" | "absent" | "pending";
type AttendanceFilter = "all" | AttendanceBucket;
type AttendanceStep = "cohort" | "session" | "register";
type CohortStatusFilter = "all" | "active" | "inactive";
type SessionWorkflowFilter = "all" | "upcoming" | AttendanceWorkflowStatus;
type StudentStatusFilter = "all" | "active" | "withdrawn";

type SessionOption = {
  session: ScheduledClass;
  workflow: AttendanceWorkflowStatus;
  upcoming: boolean;
  priority: number;
};

function ts(date: string, time: string) {
  return new Date(`${date}T${time}:00`).getTime();
}

function mapState(value?: string): AttendanceBucket {
  if (value === "present" || value === "late" || value === "absent") return value;
  return "pending";
}

function formatWorkflowTime(value?: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function getPreferredClassId(classes: Cohort["classes"], preferredClassId?: string) {
  if (preferredClassId && classes.some((session) => session.id === preferredClassId)) return preferredClassId;
  if (classes.length === 0) return "";
  const now = Date.now();
  const ordered = [...classes].sort((left, right) => ts(left.date, left.time) - ts(right.date, right.time));
  return (ordered.find((session) => ts(session.date, session.time) >= now) ?? ordered[ordered.length - 1])?.id ?? "";
}

function getSessionOptions(cohort: Cohort): SessionOption[] {
  const now = Date.now();
  return [...cohort.classes]
    .map((session) => {
      const workflow = getSessionAttendanceWorkflowStatus(session, cohort.students);
      const upcoming = ts(session.date, session.time) >= now;
      let priority = 3;
      if (!upcoming && workflow === "pending") priority = 0;
      else if (!upcoming && workflow === "saved") priority = 1;
      else if (upcoming) priority = 2;
      return { session, workflow, upcoming, priority };
    })
    .sort((left, right) => {
      if (left.priority !== right.priority) return left.priority - right.priority;
      if (left.upcoming && right.upcoming) return ts(left.session.date, left.session.time) - ts(right.session.date, right.session.time);
      return ts(right.session.date, right.session.time) - ts(left.session.date, left.session.time);
    });
}

function getSessionStatusMeta(option: SessionOption) {
  if (option.upcoming && option.workflow === "pending") {
    return { label: "Upcoming", tone: "neutral" as const };
  }
  return { label: getAttendanceWorkflowLabel(option.workflow), tone: workflowTone(option.workflow) };
}

function stateButtonColor(state: AttendanceBucket, active: boolean) {
  if (!active) return { bg: T.surface, border: T.border, color: T.muted };
  if (state === "present") return { bg: T.successBg, border: T.successBorder, color: T.success };
  if (state === "late") return { bg: T.warningBg, border: T.warningBorder, color: T.warning };
  if (state === "absent") return { bg: T.dangerBg, border: T.dangerBorder, color: T.danger };
  return { bg: T.surfaceSoft, border: T.border, color: T.heading };
}

interface AdminAttendancePageProps {
  initialCohortId?: string;
  initialClassId?: string;
  onBackToDashboard?: () => void;
  allowCohortSwitch?: boolean;
  onSelectionChange?: (context: { cohortId: string; classId: string }) => void;
  onOpenCohortsPage?: () => void;
  onOpenCohortPage?: (cohortId: string) => void;
}

export function AdminAttendancePage({
  initialCohortId,
  initialClassId,
  onBackToDashboard,
  allowCohortSwitch = true,
  onSelectionChange,
  onOpenCohortsPage,
  onOpenCohortPage,
}: AdminAttendancePageProps) {
  const [cohorts, setCohorts] = useState<Cohort[]>(() => loadCohorts());
  const [selectedCohortId, setSelectedCohortId] = useState(() => initialCohortId ?? "");
  const [selectedClassId, setSelectedClassId] = useState(() => initialClassId ?? "");
  const [cohortSearch, setCohortSearch] = useState("");
  const [cohortYearFilter, setCohortYearFilter] = useState("all");
  const [cohortProgramFilter, setCohortProgramFilter] = useState("all");
  const [cohortStatusFilter, setCohortStatusFilter] = useState<CohortStatusFilter>("all");
  const [sessionSearch, setSessionSearch] = useState("");
  const [sessionStatusFilter, setSessionStatusFilter] = useState<SessionWorkflowFilter>("all");
  const [studentSearch, setStudentSearch] = useState("");
  const [studentStatusFilter, setStudentStatusFilter] = useState<StudentStatusFilter>("all");
  const [attendanceFilter, setAttendanceFilter] = useState<AttendanceFilter>("all");
  const [step, setStep] = useState<AttendanceStep>(() => (initialClassId ? "register" : initialCohortId ? "session" : "cohort"));
  const lastAppliedContextRef = useRef<string>("");

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cohorts));
  }, [cohorts]);

  const selectableCohorts = cohorts;
  const selectedCohort = selectableCohorts.find((item) => item.id === selectedCohortId);
  const cohort = selectedCohort ?? selectableCohorts[0];

  useEffect(() => {
    if (!initialCohortId || !selectableCohorts.some((item) => item.id === initialCohortId)) return;
    const contextKey = `${initialCohortId}::${initialClassId ?? ""}`;
    if (lastAppliedContextRef.current === contextKey) return;
    lastAppliedContextRef.current = contextKey;
    setSelectedCohortId(initialCohortId);
    setSelectedClassId(initialClassId ?? "");
    setStep(initialClassId ? "register" : "session");
  }, [initialClassId, initialCohortId, selectableCohorts]);

  useEffect(() => {
    setSessionSearch("");
    setSessionStatusFilter("all");
    setStudentSearch("");
    setStudentStatusFilter("all");
    setAttendanceFilter("all");
  }, [selectedCohortId]);

  useEffect(() => {
    if (!selectedCohort) return;
    const preferred = getPreferredClassId(selectedCohort.classes, initialClassId);
    if (!selectedClassId || !selectedCohort.classes.some((session) => session.id === selectedClassId)) {
      setSelectedClassId(preferred);
    }
  }, [initialClassId, selectedClassId, selectedCohort]);

  useEffect(() => {
    if (selectedCohortId) {
      onSelectionChange?.({ cohortId: selectedCohortId, classId: step === "register" ? selectedClassId : "" });
    }
  }, [onSelectionChange, selectedClassId, selectedCohortId, step]);

  useEffect(() => {
    if (step === "register" && !initialClassId && !selectedClassId) {
      setStep("session");
    }
  }, [initialClassId, selectedClassId, step]);

  function handleHeaderBack() {
    if (step === "register") {
      setStep("session");
      return;
    }
    if (step === "session" && allowCohortSwitch) {
      setStep("cohort");
      return;
    }
    onBackToDashboard?.();
  }

  const backButton = (onBackToDashboard || step !== "cohort") ? (
    <Btn
      variant="secondary"
      onClick={handleHeaderBack}
      style={{ boxShadow: T.shadow, borderColor: T.accentBorder, backgroundColor: T.surfaceTint, color: T.heading }}
    >
      <ArrowLeft size={14} />
      Back
    </Btn>
  ) : undefined;

  if (selectableCohorts.length === 0) {
    return (
      <div style={{ display: "grid", gap: T.space4 }}>
        <PageHeader title="Sessions" leading={backButton} />
        <Surface style={{ padding: T.space5 }}>
          <EmptyState icon={<CalendarDays size={20} />} title="No cohorts" description="Create a cohort before taking attendance." />
        </Surface>
      </div>
    );
  }

  const sessionOptions = cohort ? getSessionOptions(cohort) : [];
  const session = cohort?.classes.find((item) => item.id === selectedClassId) ?? cohort?.classes[0];
  const activeStudents = cohort ? cohort.students.filter((student) => (student.status ?? "active") === "active") : [];
  const activeCounts = activeStudents.reduce((acc, student) => {
    const state = mapState(session ? student.attendance[session.id] : undefined);
    acc[state] += 1;
    return acc;
  }, { present: 0, late: 0, absent: 0, pending: 0 });
  const markedCount = activeCounts.present + activeCounts.late + activeCounts.absent;
  const totalCount = activeStudents.length;
  const allStudents = cohort?.students ?? [];

  const programOptions = useMemo(
    () => Array.from(new Set(cohorts.map((item) => item.program).filter(Boolean))).sort((left, right) => left.localeCompare(right)),
    [cohorts],
  );

  const cohortRows = useMemo(() => (
    cohorts
      .map((item) => {
        const options = getSessionOptions(item);
        const nextActionableSession = options[0]?.session;
        const activeCount = item.students.filter((student) => (student.status ?? "active") === "active").length;
        const pendingCount = options.filter((option) => !option.upcoming && option.workflow === "pending").length;
        return { item, nextActionableSession, activeCount, pendingCount };
      })
      .filter(({ item }) => {
        const query = cohortSearch.trim().toLowerCase();
        const status = item.archived ? "inactive" : "active";
        return (!query || item.name.toLowerCase().includes(query))
          && (cohortYearFilter === "all" || item.year === cohortYearFilter)
          && (cohortProgramFilter === "all" || item.program === cohortProgramFilter)
          && (cohortStatusFilter === "all" || status === cohortStatusFilter);
      })
      .sort((left, right) => Number(left.item.archived) - Number(right.item.archived) || left.item.name.localeCompare(right.item.name))
  ), [cohortProgramFilter, cohortSearch, cohortStatusFilter, cohortYearFilter, cohorts]);

  const cohortYearOptions = useMemo(
    () => Array.from(new Set(cohorts.map((item) => item.year).filter(Boolean))).sort((left, right) => right.localeCompare(left)),
    [cohorts],
  );

  const visibleSessionOptions = useMemo(() => {
    const query = sessionSearch.trim().toLowerCase();
    return sessionOptions.filter((option) => {
      const status = option.upcoming ? "upcoming" : option.workflow;
      const matchesQuery = !query || [option.session.topic, option.session.track, option.session.coach].some((value) => value.toLowerCase().includes(query));
      return matchesQuery
        && (sessionStatusFilter === "all" || status === sessionStatusFilter);
    });
  }, [sessionOptions, sessionSearch, sessionStatusFilter]);

  const scopedStudents = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();
    return allStudents.filter((student) => {
      const status = student.status ?? "active";
      return (!query || student.name.toLowerCase().includes(query))
        && (studentStatusFilter === "all" || status === studentStatusFilter);
    });
  }, [allStudents, studentSearch, studentStatusFilter]);

  const scopedCounts = scopedStudents.reduce((acc, student) => {
    const state = mapState(session ? student.attendance[session.id] : undefined);
    acc[state] += 1;
    return acc;
  }, { present: 0, late: 0, absent: 0, pending: 0 });

  const visibleStudents = useMemo(() => (
    scopedStudents.filter((student) => {
      const state = mapState(session ? student.attendance[session.id] : undefined);
      return attendanceFilter === "all" || state === attendanceFilter;
    })
  ), [attendanceFilter, scopedStudents, session]);

  const workflowStatus: AttendanceWorkflowStatus = session && cohort ? getSessionAttendanceWorkflowStatus(session, cohort.students) : "pending";
  const workflowLabel = session && ts(session.date, session.time) > Date.now() && workflowStatus === "pending" ? "Not Started" : getAttendanceWorkflowLabel(workflowStatus);
  const workflowTime = workflowStatus === "submitted" ? session?.attendanceSubmittedAt : session?.attendanceSavedAt;
  const canSave = Boolean(selectedClassId) && markedCount > 0;
  const canSubmit = Boolean(selectedClassId) && markedCount > 0 && activeCounts.pending === 0;
  const sessionSubtitle = session ? `${formatDateTime(session.date, session.time)} · ${session.track} · ${session.coach}` : "Select a session";
  const activeCohortCount = cohorts.filter((item) => !item.archived).length;
  const pendingCohortCount = cohortRows.filter(({ pendingCount }) => pendingCount > 0).length;
  const pendingSessionCount = sessionOptions.filter((option) => !option.upcoming && option.workflow === "pending").length;
  const directoryItems = step === "cohort"
    ? [
        { label: "Cohorts", onClick: onOpenCohortsPage },
        { label: "Sessions", current: true },
      ]
    : step === "session" && cohort
      ? [
          { label: "Cohorts", onClick: onOpenCohortsPage },
          { label: cohort.name, onClick: () => onOpenCohortPage?.(cohort.id) },
          { label: "Sessions", current: true },
        ]
      : step === "register" && cohort
        ? [
            { label: "Cohorts", onClick: onOpenCohortsPage },
            { label: cohort.name, onClick: () => onOpenCohortPage?.(cohort.id) },
            { label: "Sessions", onClick: sessionOptions.length > 0 ? () => setStep("session") : undefined },
            { label: session?.topic || "Register", current: true },
          ]
        : [];

  const headerChips = step === "cohort" ? (
    <>
      <StatusChip tone="success" label={`${activeCohortCount} active cohorts`} />
      <StatusChip tone="neutral" label={`${cohortRows.length} shown`} />
      <StatusChip tone={pendingCohortCount > 0 ? "danger" : "neutral"} label={`${pendingCohortCount} need attendance`} />
    </>
  ) : step === "session" && cohort ? (
    <>
      <StatusChip tone="neutral" label={cohort.name} />
      <StatusChip tone="success" label={`${activeStudents.length} active students`} />
      <StatusChip tone={pendingSessionCount > 0 ? "danger" : "neutral"} label={`${pendingSessionCount} pending sessions`} />
    </>
  ) : step === "register" && cohort ? (
    <>
      <StatusChip tone="neutral" label={cohort.name} />
      <StatusChip tone={workflowTone(workflowStatus)} label={workflowLabel} />
      <StatusChip tone="success" label={`${activeStudents.length} active students`} />
    </>
  ) : null;

  function chooseCohort(cohortId: string) {
    const nextCohort = selectableCohorts.find((item) => item.id === cohortId);
    setSelectedCohortId(cohortId);
    setSelectedClassId(getPreferredClassId(nextCohort?.classes ?? []));
    setSessionSearch("");
    setSessionStatusFilter("all");
    setStep("session");
  }

  function chooseSession(classId: string) {
    setSelectedClassId(classId);
    setStudentSearch("");
    setStudentStatusFilter("all");
    setAttendanceFilter("all");
    setStep("register");
  }

  function updateCohort(mutator: (value: Cohort) => Cohort) {
    if (!cohort) return;
    setCohorts((current) => current.map((item) => (item.id === cohort.id ? mutator(item) : item)));
  }

  function setAttendance(studentId: string, state: AttendanceBucket) {
    if (!selectedClassId || !cohort) return;
    updateCohort((current) => {
      const students = current.students.map((student) =>
        student.id === studentId ? { ...student, attendance: { ...student.attendance, [selectedClassId]: state } } : student,
      );
      const nextCounts = getSessionAttendanceCounts(students, selectedClassId);
      const nextStatus = getSessionAttendanceMarkedCount(nextCounts) > 0 ? "saved" : "pending";
      return {
        ...current,
        students,
        classes: current.classes.map((item) => (item.id === selectedClassId ? setSessionAttendanceWorkflowStatus(item, nextStatus) : item)),
      };
    });
  }

  function bulkSet(state: AttendanceBucket) {
    if (!selectedClassId || !cohort) return;
    updateCohort((current) => {
      const students = current.students.map((student) =>
        (student.status ?? "active") === "active"
          ? { ...student, attendance: { ...student.attendance, [selectedClassId]: state } }
          : student,
      );
      return {
        ...current,
        students,
        classes: current.classes.map((item) => (item.id === selectedClassId ? setSessionAttendanceWorkflowStatus(item, "saved") : item)),
      };
    });
  }

  function saveDraft() {
    if (!canSave) return;
    updateCohort((current) => ({
      ...current,
      classes: current.classes.map((item) => (item.id === selectedClassId ? setSessionAttendanceWorkflowStatus(item, "saved") : item)),
    }));
  }

  function submitAttendance() {
    if (!canSubmit) return;
    if (!window.confirm(`Submit attendance for ${totalCount} students?`)) return;
    updateCohort((current) => ({
      ...current,
      classes: current.classes.map((item) => (item.id === selectedClassId ? setSessionAttendanceWorkflowStatus(item, "submitted") : item)),
    }));
  }

  const cohortCols = "minmax(170px,1.15fr) 72px 150px 96px 110px minmax(220px,1.25fr) 100px 128px";
  const sessionCols = "120px 88px minmax(220px,1.4fr) 120px 120px 120px 128px";
  const registerCols = "minmax(220px,1fr) 104px 68px 68px 68px 68px";

  return (
    <div style={{ display: "grid", gap: T.space4 }}>
      <PageHeader title="Sessions" leading={backButton} directory={directoryItems.length > 0 ? <Breadcrumbs items={directoryItems} /> : undefined}>
        {headerChips}
      </PageHeader>

      {step === "cohort" ? (
        <>
          <FilterBar>
            <SearchInput value={cohortSearch} onChange={setCohortSearch} placeholder="Search cohorts" />
            <InlineSelect value={cohortYearFilter} onChange={setCohortYearFilter} style={{ minWidth: "140px" }}>
              <option value="all">All Years</option>
              {cohortYearOptions.map((year) => <option key={year} value={year}>{year}</option>)}
            </InlineSelect>
            <InlineSelect value={cohortProgramFilter} onChange={setCohortProgramFilter} style={{ minWidth: "180px" }}>
              <option value="all">All Programs</option>
              {programOptions.map((program) => <option key={program} value={program}>{program}</option>)}
            </InlineSelect>
            <InlineSelect value={cohortStatusFilter} onChange={(value) => setCohortStatusFilter(value as CohortStatusFilter)} style={{ minWidth: "160px" }}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="all">All Status</option>
            </InlineSelect>
          </FilterBar>

          <Surface style={{ padding: T.space5 }}>
            <div style={{ display: "grid", gap: T.space3 }}>
              {cohortRows.length === 0 ? (
                <EmptyState icon={<CalendarDays size={20} />} title="No cohorts found" />
              ) : (
                <TableShell>
                  <TableHeader columns={cohortCols}>
                    <Th>Cohort</Th>
                    <Th align="center">Year</Th>
                    <Th>Program</Th>
                    <Th align="center">Students</Th>
                    <Th align="center">Pending</Th>
                    <Th>Next Session</Th>
                    <Th>Status</Th>
                    <Th align="right">Action</Th>
                  </TableHeader>
                  {cohortRows.map(({ item, nextActionableSession, activeCount, pendingCount }) => {
                    const isActive = !item.archived;
                    return (
                      <TableRow key={item.id} columns={cohortCols} onClick={() => chooseCohort(item.id)}>
                        <Td bold>{item.name}</Td>
                        <Td align="center" muted>{item.year}</Td>
                        <Td muted>{item.program || "—"}</Td>
                        <Td align="center" muted>{activeCount}</Td>
                        <Td align="center">
                          <StatusChip tone={pendingCount > 0 ? "danger" : "neutral"} label={pendingCount > 0 ? String(pendingCount) : "0"} />
                        </Td>
                        <Td muted>{nextActionableSession ? `${nextActionableSession.topic || "Session"} · ${formatDateTime(nextActionableSession.date, nextActionableSession.time)}` : "No sessions"}</Td>
                        <Td>
                          <StatusChip tone={isActive ? "success" : "neutral"} label={isActive ? "Active" : "Inactive"} />
                        </Td>
                        <Td align="right">
                          <Btn variant="secondary" size="compact" onClick={() => chooseCohort(item.id)}>
                            Open Sessions
                          </Btn>
                        </Td>
                      </TableRow>
                    );
                  })}
                </TableShell>
              )}
            </div>
          </Surface>
        </>
      ) : null}

      {step === "session" && cohort ? (
        <>
          <FilterBar>
            <SearchInput value={sessionSearch} onChange={setSessionSearch} placeholder="Search sessions" />
            <InlineSelect value={sessionStatusFilter} onChange={(value) => setSessionStatusFilter(value as SessionWorkflowFilter)} style={{ minWidth: "180px" }}>
              <option value="all">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="pending">Needs Attendance</option>
              <option value="saved">Saved Draft</option>
              <option value="submitted">Submitted</option>
            </InlineSelect>
          </FilterBar>

          <Surface style={{ padding: T.space5 }}>
            <div style={{ display: "grid", gap: T.space3 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: T.space3, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ display: "grid", gap: "6px", minWidth: 0 }}>
                  <SectionLabel>Sessions</SectionLabel>
                  <h2 style={{ color: T.heading, fontSize: T.text4xl, fontWeight: 800, margin: 0, lineHeight: 1.02, letterSpacing: "-0.04em" }}>
                    {cohort.name}
                  </h2>
                  <div style={{ display: "flex", alignItems: "center", gap: T.space2, flexWrap: "wrap" }}>
                    <StatusChip tone="neutral" label={`Year ${cohort.year}`} />
                    {cohort.program ? <StatusChip tone="neutral" label={cohort.program} /> : null}
                  </div>
                </div>
                <span style={{ color: T.subtle, fontSize: T.textSm, fontWeight: 600 }}>
                  {visibleSessionOptions.length} session{visibleSessionOptions.length === 1 ? "" : "s"}
                </span>
              </div>

              {visibleSessionOptions.length === 0 ? (
                <EmptyState icon={<CalendarDays size={20} />} title={sessionOptions.length === 0 ? "No sessions for this cohort" : "No sessions match filters"} />
              ) : (
                <TableShell>
                  <TableHeader columns={sessionCols}>
                    <Th>Date</Th>
                    <Th>Time</Th>
                    <Th>Session</Th>
                    <Th>Track</Th>
                    <Th>Coach</Th>
                    <Th>Status</Th>
                    <Th align="right">Action</Th>
                  </TableHeader>
                  {visibleSessionOptions.map((option) => {
                    const status = getSessionStatusMeta(option);
                    return (
                      <TableRow key={option.session.id} columns={sessionCols} onClick={() => chooseSession(option.session.id)}>
                        <Td bold>{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${option.session.date}T00:00:00`))}</Td>
                        <Td muted>{new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(`2026-01-01T${option.session.time}:00`))}</Td>
                        <Td>{option.session.topic || "Session"}</Td>
                        <Td muted>{option.session.track || "—"}</Td>
                        <Td muted>{option.session.coach || "—"}</Td>
                        <Td><StatusChip tone={status.tone} label={status.label} /></Td>
                        <Td align="right">
                          <Btn variant="secondary" size="compact" onClick={() => chooseSession(option.session.id)}>
                            Open Register
                          </Btn>
                        </Td>
                      </TableRow>
                    );
                  })}
                </TableShell>
              )}
            </div>
          </Surface>
        </>
      ) : null}

      {step === "register" && cohort ? (
        <>
          <Surface style={{ padding: T.space5 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: T.space4, flexWrap: "wrap", alignItems: "flex-start" }}>
              <div style={{ display: "grid", gap: T.space2, minWidth: 0 }}>
                <SectionLabel>Attendance Register</SectionLabel>
                <h2 style={{ color: T.heading, fontSize: T.text3xl, fontWeight: 800, margin: 0, lineHeight: 1.04, letterSpacing: "-0.04em" }}>
                  {cohort.name}
                </h2>
                <div style={{ display: "flex", alignItems: "center", gap: T.space2, flexWrap: "wrap" }}>
                  <span style={{ color: T.heading, fontSize: T.textMd, fontWeight: 700 }}>
                    {session?.topic || "Attendance Register"}
                  </span>
                  <StatusChip tone="neutral" label={`Year ${cohort.year}`} />
                  <StatusChip tone={workflowTone(workflowStatus)} label={workflowLabel} />
                  {workflowTime ? <StatusChip tone="neutral" label={formatWorkflowTime(workflowTime)} /> : null}
                  <StatusChip tone="success" label={`${activeStudents.length} active`} />
                </div>
                <p style={{ color: T.muted, fontSize: T.textBase, lineHeight: 1.55, margin: 0 }}>{sessionSubtitle}</p>
              </div>

              <div style={{ display: "flex", gap: T.space2, flexWrap: "wrap", justifyContent: "flex-end" }}>
                {sessionOptions.length > 0 ? <Btn variant="secondary" onClick={() => setStep("session")}>Change Session</Btn> : null}
                {allowCohortSwitch ? <Btn variant="secondary" onClick={() => setStep("cohort")}>Change Cohort</Btn> : null}
                <Btn variant="secondary" onClick={saveDraft} disabled={!canSave}>Save Draft</Btn>
                <Btn onClick={submitAttendance} disabled={!canSubmit}>Submit Attendance</Btn>
              </div>
            </div>
          </Surface>

          <FilterBar>
            <SearchInput value={studentSearch} onChange={setStudentSearch} placeholder="Search students" />
            <InlineSelect value={studentStatusFilter} onChange={(value) => setStudentStatusFilter(value as StudentStatusFilter)} style={{ minWidth: "170px" }}>
              <option value="active">Active</option>
              <option value="withdrawn">Inactive</option>
              <option value="all">All Status</option>
            </InlineSelect>
            <div style={{ display: "flex", alignItems: "center", gap: T.space2, flexWrap: "wrap", marginLeft: "auto" }}>
              <Btn
                variant="secondary"
                onClick={() => bulkSet("present")}
                disabled={!selectedClassId}
                style={{ background: T.successBg, border: `1px solid ${T.successBorder}`, color: T.success }}
              >
                All Present
              </Btn>
              <Btn
                variant="secondary"
                onClick={() => bulkSet("absent")}
                disabled={!selectedClassId}
                style={{ background: T.dangerBg, border: `1px solid ${T.dangerBorder}`, color: T.danger }}
              >
                All Absent
              </Btn>
            </div>
            {(["all", "present", "late", "absent", "pending"] as const).map((item) => {
              const active = attendanceFilter === item;
              const count = item === "all" ? scopedStudents.length : scopedCounts[item];
              const colors = stateButtonColor(item === "all" ? "pending" : item, active);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setAttendanceFilter(item)}
                  style={{
                    height: T.controlMd,
                    padding: `0 ${T.space4}`,
                    borderRadius: T.radiusMd,
                    border: `1px solid ${colors.border}`,
                    backgroundColor: colors.bg,
                    color: colors.color,
                    fontSize: T.textSm,
                    fontWeight: 700,
                    textTransform: "capitalize",
                    cursor: "pointer",
                  }}
                >
                  {item === "all" ? "All" : item} · {count}
                </button>
              );
            })}
          </FilterBar>

          <Surface style={{ padding: T.space5 }}>
            <div style={{ display: "grid", gap: T.space3 }}>
              <SectionLabel>Student Register</SectionLabel>

              <TableShell>
                <TableHeader columns={registerCols}>
                  <Th>Student</Th>
                  <Th align="center">Status</Th>
                  <Th align="center">Present</Th>
                  <Th align="center">Late</Th>
                  <Th align="center">Absent</Th>
                  <Th align="center">Pending</Th>
                </TableHeader>
                <div style={{ maxHeight: "640px", overflowY: "auto" }}>
                  {visibleStudents.length === 0 ? (
                    <div style={{ padding: `${T.space6} ${T.space5}`, textAlign: "center", color: T.muted, fontSize: T.textBase }}>No students match this filter.</div>
                  ) : (
                    visibleStudents.map((student) => {
                      const currentState = mapState(session ? student.attendance[session.id] : undefined);
                      const studentStatus = student.status ?? "active";
                      const isActionable = studentStatus === "active";
                      return (
                        <TableRow key={student.id} columns={registerCols}>
                          <Td bold>{student.name}</Td>
                          <Td align="center">
                            <StatusChip tone={studentStatus === "active" ? "success" : "neutral"} label={studentStatus === "active" ? "Active" : "Inactive"} />
                          </Td>
                          {(["present", "late", "absent", "pending"] as const).map((item) => {
                            const active = currentState === item;
                            const colors = stateButtonColor(item, active);
                            const icons = {
                              present: <Check size={15} />,
                              late: <Clock3 size={15} />,
                              absent: <X size={15} />,
                              pending: <MoreHorizontal size={15} />,
                            };
                            return (
                              <div key={item} style={{ display: "flex", justifyContent: "center" }}>
                                <button
                                  type="button"
                                  onClick={() => setAttendance(student.id, item)}
                                  aria-label={`Mark ${student.name} as ${item}`}
                                  disabled={!isActionable}
                                  style={{
                                    width: "34px",
                                    height: "34px",
                                    borderRadius: T.radiusSm,
                                    border: `1px solid ${colors.border}`,
                                    backgroundColor: colors.bg,
                                    color: colors.color,
                                    display: "grid",
                                    placeItems: "center",
                                    cursor: isActionable ? "pointer" : "not-allowed",
                                    opacity: isActionable ? 1 : 0.45,
                                  }}
                                >
                                  {icons[item]}
                                </button>
                              </div>
                            );
                          })}
                        </TableRow>
                      );
                    })
                  )}
                </div>
              </TableShell>
            </div>
          </Surface>
        </>
      ) : null}
    </div>
  );
}
