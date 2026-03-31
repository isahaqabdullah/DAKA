import { useEffect, useMemo, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, FileText, Users } from "lucide-react";
import {
  ActionButton,
  ADMIN_THEME,
  CohortSwitcher,
  SectionTitle,
  STORAGE_KEY,
  Surface,
  loadCohorts,
  type Cohort,
  type ReportEntry,
  type StudentRecord,
} from "./AdminDashboard";

type WeeklyGrade = "A" | "B" | "C" | "D";

interface WeeklyReportDraft {
  grade: WeeklyGrade | "";
  remark: string;
}

const GRADE_OPTIONS: WeeklyGrade[] = ["A", "B", "C", "D"];

const nestedCardStyle: CSSProperties = {
  border: `1px solid ${ADMIN_THEME.borderSoft}`,
  backgroundColor: ADMIN_THEME.surfaceSoft,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.75)",
};

const inputStyle: CSSProperties = {
  width: "100%",
  height: "40px",
  background: "transparent",
  border: "none",
  outline: "none",
  color: ADMIN_THEME.heading,
  fontSize: "13px",
  fontFamily: "var(--font-body)",
};

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function emptyWeeklyReportDraft(): WeeklyReportDraft {
  return {
    grade: "",
    remark: "",
  };
}

function parseWeekIndex(value: string) {
  const match = value.match(/(\d+)/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function sortWeekLabels(values: string[]) {
  return [...new Set(values)].sort((left, right) => parseWeekIndex(left) - parseWeekIndex(right) || left.localeCompare(right));
}

function buildWeekOptions(cohort?: Cohort) {
  if (!cohort) {
    return ["Week 01"];
  }

  const syllabusWeeks = cohort.syllabus.map((item) => item.weekLabel);
  const reportWeeks = cohort.reports.map((report) => report.weekLabel).filter(Boolean) as string[];
  const classWeeks = cohort.classes.map((_, index) => `Week ${String(index + 1).padStart(2, "0")}`);
  const merged = [...syllabusWeeks, ...reportWeeks, ...classWeeks];

  return merged.length > 0 ? sortWeekLabels(merged) : ["Week 01"];
}

function getReportWeekLabel(report: ReportEntry, fallbackIndex = 0) {
  if (report.weekLabel?.trim()) {
    return report.weekLabel.trim();
  }

  const titleWeek = report.title.match(/Week\s*\d+/i)?.[0];
  if (titleWeek) {
    return titleWeek.replace(/\s+/g, " ").replace("week", "Week");
  }

  return `Week ${String(fallbackIndex + 1).padStart(2, "0")}`;
}

function normalizeGrade(value?: string): WeeklyGrade | "" {
  return GRADE_OPTIONS.includes(value as WeeklyGrade) ? (value as WeeklyGrade) : "";
}

function getReportRemark(report?: ReportEntry) {
  return report?.remark?.trim() || report?.summary || "";
}

function findWeeklyReport(reports: ReportEntry[], studentId: string, weekLabel: string) {
  return reports.find((report) => report.studentId === studentId && getReportWeekLabel(report) === weekLabel);
}

function buildWeekDrafts(cohort: Cohort | undefined, weekLabel: string) {
  if (!cohort) {
    return {};
  }

  return cohort.students.reduce<Record<string, WeeklyReportDraft>>((map, student) => {
    const existingReport = findWeeklyReport(cohort.reports, student.id, weekLabel);
    map[student.id] = {
      grade: normalizeGrade(existingReport?.grade),
      remark: getReportRemark(existingReport),
    };
    return map;
  }, {});
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function pacePillStyle(pace: StudentRecord["pace"]): CSSProperties {
  if (pace === "Fast Track") {
    return {
      padding: "4px 8px",
      borderRadius: "999px",
      backgroundColor: "rgba(34,197,94,0.10)",
      border: "1px solid rgba(34,197,94,0.22)",
      color: "#247A44",
      fontSize: "9px",
      letterSpacing: "0px",
      textTransform: "uppercase",
    };
  }

  if (pace === "Needs Support") {
    return {
      padding: "4px 8px",
      borderRadius: "999px",
      backgroundColor: "rgba(245,158,11,0.12)",
      border: "1px solid rgba(245,158,11,0.22)",
      color: "#9D6100",
      fontSize: "9px",
      letterSpacing: "0px",
      textTransform: "uppercase",
    };
  }

  return {
    padding: "4px 8px",
    borderRadius: "999px",
    backgroundColor: "#F2ECE6",
    border: `1px solid ${ADMIN_THEME.borderSoft}`,
    color: ADMIN_THEME.muted,
    fontSize: "9px",
    letterSpacing: "0px",
    textTransform: "uppercase",
  };
}

function statusPillStyle(status: "saved" | "ready" | "pending" | "grade_required"): CSSProperties {
  if (status === "saved") {
    return {
      padding: "4px 8px",
      borderRadius: "999px",
      backgroundColor: "rgba(34,197,94,0.10)",
      border: "1px solid rgba(34,197,94,0.22)",
      color: "#247A44",
      fontSize: "9px",
      fontWeight: 800,
      letterSpacing: "0px",
      textTransform: "uppercase",
    };
  }

  if (status === "ready") {
    return {
      padding: "4px 8px",
      borderRadius: "999px",
      backgroundColor: ADMIN_THEME.accentBg,
      border: `1px solid ${ADMIN_THEME.accentBorder}`,
      color: ADMIN_THEME.accent,
      fontSize: "9px",
      fontWeight: 800,
      letterSpacing: "0px",
      textTransform: "uppercase",
    };
  }

  if (status === "grade_required") {
    return {
      padding: "4px 8px",
      borderRadius: "999px",
      backgroundColor: "rgba(245,158,11,0.12)",
      border: "1px solid rgba(245,158,11,0.22)",
      color: "#9D6100",
      fontSize: "9px",
      fontWeight: 800,
      letterSpacing: "0px",
      textTransform: "uppercase",
    };
  }

  return {
    padding: "4px 8px",
    borderRadius: "999px",
    backgroundColor: ADMIN_THEME.surface,
    border: `1px solid ${ADMIN_THEME.border}`,
    color: ADMIN_THEME.subtle,
    fontSize: "9px",
    fontWeight: 800,
    letterSpacing: "0px",
    textTransform: "uppercase",
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

interface AdminCohortReportsPageProps {
  initialCohortId?: string;
  initialStudentId?: string;
  onBackToCohortDashboard?: (cohortId: string) => void;
  onOpenCohortManagement?: (cohortId: string) => void;
  onSelectCohort?: (cohortId: string) => void;
  onSelectStudent?: (studentId: string) => void;
}

export function AdminCohortReportsPage({
  initialCohortId,
  initialStudentId,
  onBackToCohortDashboard,
  onOpenCohortManagement,
  onSelectCohort,
  onSelectStudent,
}: AdminCohortReportsPageProps) {
  const [cohorts, setCohorts] = useState<Cohort[]>(() => loadCohorts());
  const [selectedCohortId, setSelectedCohortId] = useState(() => initialCohortId ?? loadCohorts()[0]?.id ?? "");
  const [selectedWeekLabel, setSelectedWeekLabel] = useState("Week 01");
  const [studentSearch, setStudentSearch] = useState("");
  const [weekDrafts, setWeekDrafts] = useState<Record<string, WeeklyReportDraft>>({});
  const [focusedStudentId, setFocusedStudentId] = useState(initialStudentId ?? "");

  const selectedCohort = cohorts.find((cohort) => cohort.id === selectedCohortId) ?? cohorts[0];

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cohorts));
  }, [cohorts]);

  useEffect(() => {
    if (initialCohortId && cohorts.some((cohort) => cohort.id === initialCohortId)) {
      setSelectedCohortId(initialCohortId);
    }
  }, [cohorts, initialCohortId]);

  const weekOptions = useMemo(() => buildWeekOptions(selectedCohort), [selectedCohort]);
  const weekOptionKey = weekOptions.join("|");

  useEffect(() => {
    if (!selectedCohort) {
      return;
    }

    setSelectedWeekLabel((current) => {
      if (weekOptions.includes(current)) {
        return current;
      }

      if (initialStudentId) {
        const latestReportForStudent = [...selectedCohort.reports]
          .filter((report) => report.studentId === initialStudentId)
          .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];
        const preferredWeek = latestReportForStudent ? getReportWeekLabel(latestReportForStudent) : "";

        if (preferredWeek && weekOptions.includes(preferredWeek)) {
          return preferredWeek;
        }
      }

      return weekOptions[0] ?? "Week 01";
    });
  }, [initialStudentId, selectedCohort, weekOptionKey, weekOptions]);

  useEffect(() => {
    setWeekDrafts(buildWeekDrafts(selectedCohort, selectedWeekLabel));
  }, [selectedCohort, selectedWeekLabel]);

  useEffect(() => {
    if (!selectedCohort) {
      return;
    }

    if (initialStudentId && selectedCohort.students.some((student) => student.id === initialStudentId)) {
      setFocusedStudentId(initialStudentId);
      return;
    }

    if (focusedStudentId && selectedCohort.students.some((student) => student.id === focusedStudentId)) {
      return;
    }

    setFocusedStudentId("");
  }, [focusedStudentId, initialStudentId, selectedCohort]);

  useEffect(() => {
    if (focusedStudentId) {
      onSelectStudent?.(focusedStudentId);
    }
  }, [focusedStudentId, onSelectStudent]);

  function updateSelectedCohort(mutator: (cohort: Cohort) => Cohort) {
    if (!selectedCohort) {
      return;
    }

    setCohorts((current) =>
      current.map((cohort) => (cohort.id === selectedCohort.id ? mutator(cohort) : cohort)),
    );
  }

  function updateStudentDraft(studentId: string, patch: Partial<WeeklyReportDraft>) {
    setFocusedStudentId(studentId);
    setWeekDrafts((current) => ({
      ...current,
      [studentId]: {
        ...(current[studentId] ?? emptyWeeklyReportDraft()),
        ...patch,
      },
    }));
  }

  function handleWeekSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedCohort) {
      return;
    }

    const now = new Date().toISOString();

    updateSelectedCohort((cohort) => {
      const existingWeekReports = new Map(
        cohort.reports
          .filter((report) => getReportWeekLabel(report) === selectedWeekLabel)
          .map((report) => [report.studentId, report]),
      );

      const additions: ReportEntry[] = [];
      const nextReports = cohort.reports.map((report) => {
        if (getReportWeekLabel(report) !== selectedWeekLabel) {
          return report;
        }

        const draft = weekDrafts[report.studentId] ?? emptyWeeklyReportDraft();
        if (!draft.grade) {
          return report;
        }

        const nextRemark = draft.remark.trim();
        const existingGrade = normalizeGrade(report.grade);
        const existingRemark = getReportRemark(report).trim();

        if (draft.grade === existingGrade && nextRemark === existingRemark) {
          return report;
        }

        return {
          ...report,
          title: `${selectedWeekLabel} grade · ${draft.grade}`,
          summary: nextRemark,
          recommendation: "",
          weekLabel: selectedWeekLabel,
          grade: draft.grade,
          remark: nextRemark,
          createdAt: now,
        };
      });

      cohort.students.forEach((student) => {
        const draft = weekDrafts[student.id] ?? emptyWeeklyReportDraft();
        if (!draft.grade || existingWeekReports.has(student.id)) {
          return;
        }

        const nextRemark = draft.remark.trim();
        additions.push({
          id: createId("report"),
          studentId: student.id,
          title: `${selectedWeekLabel} grade · ${draft.grade}`,
          summary: nextRemark,
          recommendation: "",
          weekLabel: selectedWeekLabel,
          grade: draft.grade,
          remark: nextRemark,
          createdAt: now,
        });
      });

      return {
        ...cohort,
        reports: [...additions, ...nextReports],
      };
    });
  }

  const normalizedStudentSearch = studentSearch.trim().toLowerCase();
  const activeStudentCount = selectedCohort?.students.filter((student) => (student.status ?? "active") === "active").length ?? 0;

  const filteredStudents = useMemo(() => {
    if (!selectedCohort) {
      return [];
    }

    return [...selectedCohort.students]
      .filter((student) =>
        !normalizedStudentSearch
          ? true
          : [student.name, student.guardian, student.pace, student.notes]
              .join(" ")
              .toLowerCase()
              .includes(normalizedStudentSearch),
      )
      .sort((left, right) => {
        if ((left.status ?? "active") !== (right.status ?? "active")) {
          return (left.status ?? "active") === "active" ? -1 : 1;
        }

        return left.name.localeCompare(right.name);
      });
  }, [normalizedStudentSearch, selectedCohort]);

  const weekReportMap = useMemo(() => {
    if (!selectedCohort) {
      return new Map<string, ReportEntry>();
    }

    return new Map(
      selectedCohort.reports
        .filter((report) => getReportWeekLabel(report) === selectedWeekLabel)
        .map((report) => [report.studentId, report]),
    );
  }, [selectedCohort, selectedWeekLabel]);

  const completionCount = selectedCohort?.students.filter((student) => {
    if ((student.status ?? "active") !== "active") {
      return false;
    }

    return Boolean((weekDrafts[student.id] ?? emptyWeeklyReportDraft()).grade);
  }).length ?? 0;

  const readyCount = selectedCohort?.students.filter((student) => {
    const draft = weekDrafts[student.id] ?? emptyWeeklyReportDraft();
    const existingReport = weekReportMap.get(student.id);
    const nextRemark = draft.remark.trim();
    const existingRemark = getReportRemark(existingReport).trim();
    const existingGrade = normalizeGrade(existingReport?.grade);

    if (!draft.grade) {
      return false;
    }

    if (!existingReport) {
      return true;
    }

    return draft.grade !== existingGrade || nextRemark !== existingRemark;
  }).length ?? 0;

  const savedCount = selectedCohort?.students.filter((student) => {
    const existingReport = weekReportMap.get(student.id);
    if (!existingReport) {
      return false;
    }

    const draft = weekDrafts[student.id] ?? emptyWeeklyReportDraft();
    return draft.grade === normalizeGrade(existingReport.grade) && draft.remark.trim() === getReportRemark(existingReport).trim();
  }).length ?? 0;

  const remarkOnlyCount = selectedCohort?.students.filter((student) => {
    const draft = weekDrafts[student.id] ?? emptyWeeklyReportDraft();
    return !draft.grade && Boolean(draft.remark.trim());
  }).length ?? 0;

  if (!selectedCohort) {
    return null;
  }

  return (
    <>
      <style>{`
        .weekly-report-toolbar {
          display: grid;
          grid-template-columns: minmax(180px, 220px) minmax(220px, 1fr);
          gap: 10px;
          align-items: end;
        }
        .weekly-report-column-labels,
        .weekly-report-row {
          display: grid;
          grid-template-columns: minmax(220px, 1.1fr) minmax(210px, 0.95fr) minmax(240px, 1.2fr);
          gap: 10px;
          align-items: start;
        }
        @media (max-width: 1120px) {
          .weekly-report-toolbar,
          .weekly-report-column-labels,
          .weekly-report-row {
            grid-template-columns: 1fr;
          }
          .weekly-report-column-labels {
            display: none;
          }
        }
      `}</style>

      <div style={{ display: "grid", gap: "12px" }}>
        <Surface style={{ padding: "14px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", alignItems: "flex-start" }}>
            <div style={{ display: "grid", gap: "8px", maxWidth: "820px" }}>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-start" }}>
                {onBackToCohortDashboard ? (
                  <button
                    type="button"
                    onClick={() => onBackToCohortDashboard(selectedCohort.id)}
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "12px",
                      border: `1px solid ${ADMIN_THEME.border}`,
                      backgroundColor: ADMIN_THEME.surface,
                      color: ADMIN_THEME.heading,
                      display: "grid",
                      placeItems: "center",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    <ArrowLeft size={16} />
                  </button>
                ) : null}
                <div style={{ display: "grid", gap: "8px", flex: "1 1 420px" }}>
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                    <SectionTitle
                      eyebrow="Student Progress"
                      title="Week-Wise Marking"
                      detail={`${selectedCohort.name} · ${selectedCohort.program}`}
                      titleStyle={{ fontSize: "24px" }}
                    />
                    <CohortSwitcher
                      cohorts={cohorts}
                      selectedCohortId={selectedCohort.id}
                      onSelect={(cohortId) => {
                        setSelectedCohortId(cohortId);
                        onSelectCohort?.(cohortId);
                      }}
                    />
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <span
                  style={{
                    padding: "7px 10px",
                    borderRadius: "999px",
                    border: `1px solid ${ADMIN_THEME.accentBorder}`,
                    backgroundColor: ADMIN_THEME.accentBg,
                    color: ADMIN_THEME.accent,
                    fontSize: "11px",
                    letterSpacing: "0px",
                    textTransform: "uppercase",
                  }}
                >
                  {selectedCohort.cadence}
                </span>
                <span
                  style={{
                    padding: "7px 10px",
                    borderRadius: "999px",
                    border: `1px solid ${ADMIN_THEME.border}`,
                    backgroundColor: ADMIN_THEME.surfaceSoft,
                    color: ADMIN_THEME.muted,
                    fontSize: "11px",
                    letterSpacing: "0px",
                    textTransform: "uppercase",
                  }}
                >
                  Coach {selectedCohort.coach}
                </span>
                <span
                  style={{
                    padding: "7px 10px",
                    borderRadius: "999px",
                    border: `1px solid ${ADMIN_THEME.border}`,
                    backgroundColor: ADMIN_THEME.surfaceSoft,
                    color: ADMIN_THEME.muted,
                    fontSize: "11px",
                    letterSpacing: "0px",
                    textTransform: "uppercase",
                  }}
                >
                  {activeStudentCount} active students
                </span>
              </div>
            </div>

            {onOpenCohortManagement ? (
              <ActionButton secondary onClick={() => onOpenCohortManagement(selectedCohort.id)} style={{ minWidth: "176px", minHeight: "40px" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  <Users size={14} /> Manage Students
                </span>
              </ActionButton>
            ) : null}
          </div>
        </Surface>

        <Surface style={{ padding: "14px" }}>
          <form onSubmit={handleWeekSubmit} style={{ display: "grid", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", alignItems: "flex-start" }}>
              <div style={{ display: "grid", gap: "8px", flex: "1 1 520px" }}>
                <SectionTitle
                  eyebrow="Weekly Board"
                  title={selectedWeekLabel}
                  detail={`${completionCount}/${activeStudentCount} graded · ${readyCount} ready to save`}
                  titleStyle={{ fontSize: "22px" }}
                />
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <span style={statusPillStyle("saved")}>{savedCount} saved</span>
                  <span style={statusPillStyle("ready")}>{readyCount} unsaved</span>
                  <span style={statusPillStyle("pending")}>{Math.max(activeStudentCount - completionCount, 0)} pending</span>
                  {remarkOnlyCount > 0 ? <span style={statusPillStyle("grade_required")}>{remarkOnlyCount} need grade</span> : null}
                </div>
              </div>

              <ActionButton type="submit" style={{ minWidth: "170px", minHeight: "40px" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  <FileText size={14} /> Save {readyCount} Updates
                </span>
              </ActionButton>
            </div>

            <div className="weekly-report-toolbar">
              <div>
                <FieldLabel>Week</FieldLabel>
                <FieldShell>
                  <select
                    value={selectedWeekLabel}
                    onChange={(event) => setSelectedWeekLabel(event.target.value)}
                    style={inputStyle}
                  >
                    {weekOptions.map((weekLabel) => (
                      <option key={weekLabel} value={weekLabel}>
                        {weekLabel}
                      </option>
                    ))}
                  </select>
                </FieldShell>
              </div>

              <div>
                <FieldLabel>Search Students</FieldLabel>
                <FieldShell>
                  <input
                    value={studentSearch}
                    onChange={(event) => setStudentSearch(event.target.value)}
                    placeholder="Search student, guardian, or pace"
                    style={inputStyle}
                  />
                </FieldShell>
              </div>
            </div>

            {selectedCohort.students.length === 0 ? (
              <div
                style={{
                  padding: "14px",
                  borderRadius: "14px",
                  border: `1px dashed ${ADMIN_THEME.border}`,
                  backgroundColor: ADMIN_THEME.surfaceSoft,
                  display: "grid",
                  gap: "10px",
                }}
              >
                <p style={{ color: ADMIN_THEME.subtle, fontSize: "13px", lineHeight: 1.55, margin: 0 }}>
                  This cohort has no students yet. Add the roster first, then weekly reports can be marked here in one pass.
                </p>
                {onOpenCohortManagement ? (
                  <ActionButton
                    secondary
                    onClick={() => onOpenCohortManagement(selectedCohort.id)}
                    style={{ justifySelf: "start", minWidth: "188px", minHeight: "40px" }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                      <Users size={14} /> Open Cohort Management
                    </span>
                  </ActionButton>
                ) : null}
              </div>
            ) : filteredStudents.length === 0 ? (
              <div
                style={{
                  padding: "14px",
                  borderRadius: "14px",
                  border: `1px dashed ${ADMIN_THEME.border}`,
                  backgroundColor: ADMIN_THEME.surfaceSoft,
                  color: ADMIN_THEME.subtle,
                  fontSize: "13px",
                }}
              >
                No students match this search.
              </div>
            ) : (
              <>
                <div
                  className="weekly-report-column-labels"
                  style={{
                    padding: "0 6px",
                    color: ADMIN_THEME.subtle,
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0px",
                    textTransform: "uppercase",
                  }}
                >
                  <span>Student</span>
                  <span>Grade</span>
                  <span>Remark</span>
                </div>

                <div style={{ display: "grid", gap: "6px" }}>
                  {filteredStudents.map((student) => {
                    const draft = weekDrafts[student.id] ?? emptyWeeklyReportDraft();
                    const existingReport = weekReportMap.get(student.id);
                    const draftRemark = draft.remark.trim();
                    const existingRemark = getReportRemark(existingReport).trim();
                    const existingGrade = normalizeGrade(existingReport?.grade);
                    const hasExisting = Boolean(existingReport);
                    const isChanged = Boolean(draft.grade) && (!hasExisting || draft.grade !== existingGrade || draftRemark !== existingRemark);
                    const needsGrade = !draft.grade && Boolean(draftRemark);
                    const status = hasExisting && !isChanged ? "saved" : needsGrade ? "grade_required" : isChanged ? "ready" : "pending";
                    const helperText = hasExisting
                      ? isChanged
                        ? "Will update existing report"
                        : `Saved ${formatShortDate(existingReport.createdAt)}`
                      : draft.grade
                        ? "New report ready"
                        : "Waiting for grade";

                    return (
                      <div
                        key={student.id}
                        className="weekly-report-row"
                        style={{
                          padding: "10px 12px",
                          borderRadius: "14px",
                          ...nestedCardStyle,
                          border:
                            focusedStudentId === student.id
                              ? `1px solid ${ADMIN_THEME.accentBorder}`
                              : nestedCardStyle.border,
                          background:
                            focusedStudentId === student.id
                              ? "linear-gradient(135deg, rgba(200,52,46,0.08) 0%, #FFFFFF 100%)"
                              : nestedCardStyle.backgroundColor,
                          opacity: (student.status ?? "active") === "withdrawn" ? 0.62 : 1,
                        }}
                      >
                        <div style={{ display: "grid", gap: "4px" }}>
                          <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                            <h4 style={{ color: ADMIN_THEME.heading, fontSize: "14px", fontWeight: 800, margin: 0 }}>
                              {student.name}
                            </h4>
                            <span style={pacePillStyle(student.pace)}>{student.pace}</span>
                            {(student.status ?? "active") === "withdrawn" ? (
                              <span
                                style={{
                                  padding: "4px 7px",
                                  borderRadius: "999px",
                                  border: `1px solid ${ADMIN_THEME.border}`,
                                  backgroundColor: ADMIN_THEME.surface,
                                  color: ADMIN_THEME.subtle,
                                  fontSize: "8px",
                                  fontWeight: 800,
                                  textTransform: "uppercase",
                                }}
                              >
                                Withdrawn
                              </span>
                            ) : null}
                          </div>
                          <p style={{ color: ADMIN_THEME.muted, fontSize: "11px", margin: 0 }}>
                            Age {student.age} · Guardian {student.guardian}
                          </p>
                          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                            <span style={statusPillStyle(status)}>{status === "saved" ? "Saved" : status === "ready" ? "Ready" : status === "grade_required" ? "Pick Grade" : "Pending"}</span>
                            <span style={{ color: ADMIN_THEME.subtle, fontSize: "10px" }}>{helperText}</span>
                          </div>
                        </div>

                        <div style={{ display: "grid", gap: "6px" }}>
                          <div style={{ color: ADMIN_THEME.subtle, fontSize: "10px", fontWeight: 700, textTransform: "uppercase" }}>
                            Choose grade
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "6px" }}>
                            {GRADE_OPTIONS.map((grade) => {
                              const active = draft.grade === grade;

                              return (
                                <button
                                  key={grade}
                                  type="button"
                                  aria-pressed={active}
                                  onClick={() => updateStudentDraft(student.id, { grade })}
                                  style={{
                                    minHeight: "36px",
                                    borderRadius: "12px",
                                    border: `1px solid ${active ? ADMIN_THEME.accentBorder : ADMIN_THEME.borderSoft}`,
                                    background: active ? "linear-gradient(135deg, rgba(200,52,46,0.08) 0%, #FFFFFF 100%)" : ADMIN_THEME.surfaceSoft,
                                    color: active ? ADMIN_THEME.accent : ADMIN_THEME.heading,
                                    fontSize: "12px",
                                    fontFamily: "var(--font-body)",
                                    fontWeight: 800,
                                    letterSpacing: "0px",
                                    textTransform: "uppercase",
                                    cursor: "pointer",
                                  }}
                                >
                                  {grade}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div style={{ display: "grid", gap: "6px" }}>
                          <div style={{ color: ADMIN_THEME.subtle, fontSize: "10px", fontWeight: 700, textTransform: "uppercase" }}>
                            Optional remark
                          </div>
                          <FieldShell>
                            <input
                              value={draft.remark}
                              onFocus={() => setFocusedStudentId(student.id)}
                              onChange={(event) => updateStudentDraft(student.id, { remark: event.target.value })}
                              placeholder="Add a short weekly remark"
                              aria-label={`Weekly remark for ${student.name}`}
                              style={inputStyle}
                            />
                          </FieldShell>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                  <p style={{ color: ADMIN_THEME.subtle, fontSize: "11px", lineHeight: 1.5, margin: 0 }}>
                    Only rows with a selected grade are saved for this week. Existing entries for the same week update in place instead of duplicating.
                  </p>
                  <ActionButton type="submit" style={{ minWidth: "170px", minHeight: "40px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                      <FileText size={14} /> Save {readyCount} Updates
                    </span>
                  </ActionButton>
                </div>
              </>
            )}
          </form>
        </Surface>
      </div>
    </>
  );
}
