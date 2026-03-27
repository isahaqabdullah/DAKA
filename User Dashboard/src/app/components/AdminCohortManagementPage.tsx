import { useEffect, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, FileText, Plus, X } from "lucide-react";
import {
  ActionButton,
  ADMIN_THEME,
  SectionTitle,
  STORAGE_KEY,
  Surface,
  loadCohorts,
  type Cohort,
  type StudentPace,
  type StudentRecord,
} from "./AdminDashboard";

const nestedCardStyle: CSSProperties = {
  border: `1px solid ${ADMIN_THEME.borderSoft}`,
  backgroundColor: ADMIN_THEME.surfaceSoft,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.75)",
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
  minHeight: "84px",
  padding: "10px 0",
  resize: "vertical",
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

function emptyStudentDraft() {
  return {
    name: "",
    age: "",
    guardian: "",
    pace: "Steady" as StudentPace,
    notes: "",
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

function pacePillStyle(pace: StudentPace): CSSProperties {
  if (pace === "Fast Track") {
    return {
      padding: "6px 9px",
      borderRadius: "999px",
      backgroundColor: "rgba(34,197,94,0.10)",
      border: "1px solid rgba(34,197,94,0.22)",
      color: "#247A44",
      fontSize: "10px",
      letterSpacing: "0px",
      textTransform: "uppercase",
    };
  }

  if (pace === "Needs Support") {
    return {
      padding: "6px 9px",
      borderRadius: "999px",
      backgroundColor: "rgba(245,158,11,0.12)",
      border: "1px solid rgba(245,158,11,0.22)",
      color: "#9D6100",
      fontSize: "10px",
      letterSpacing: "0px",
      textTransform: "uppercase",
    };
  }

  return {
    padding: "6px 9px",
    borderRadius: "999px",
    backgroundColor: "#F2ECE6",
    border: `1px solid ${ADMIN_THEME.borderSoft}`,
    color: ADMIN_THEME.muted,
    fontSize: "10px",
    letterSpacing: "0px",
    textTransform: "uppercase",
  };
}

function attendanceBreakdown(student: StudentRecord) {
  const counts = Object.values(student.attendance).reduce(
    (summary, status) => {
      summary[status] += 1;
      return summary;
    },
    { pending: 0, present: 0, late: 0, absent: 0 },
  );

  const parts = ([
    ["present", "present"],
    ["late", "late"],
    ["absent", "absent"],
    ["pending", "pending"],
  ] as const)
    .filter(([status]) => counts[status] > 0)
    .map(([status, label]) => `${counts[status]} ${label}`);

  return parts.length > 0 ? parts.join(" · ") : "No attendance registered yet";
}

interface AdminCohortManagementPageProps {
  initialCohortId?: string;
  onBackToCohortDashboard?: (cohortId: string) => void;
}

export function AdminCohortManagementPage({
  initialCohortId,
  onBackToCohortDashboard,
}: AdminCohortManagementPageProps) {
  const [cohorts, setCohorts] = useState<Cohort[]>(() => loadCohorts());
  const [selectedCohortId, setSelectedCohortId] = useState(() => initialCohortId ?? loadCohorts()[0]?.id ?? "");
  const [studentDraft, setStudentDraft] = useState(() => emptyStudentDraft());
  const [studentSearch, setStudentSearch] = useState("");
  const [isRosterEditMode, setIsRosterEditMode] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editingStudentDraft, setEditingStudentDraft] = useState(() => emptyStudentDraft());
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [reportModalStudentId, setReportModalStudentId] = useState<string | null>(null);
  const [newReport, setNewReport] = useState({
    studentId: "",
    title: "",
    summary: "",
    recommendation: "",
  });

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

    setSelectedStudentId((current) =>
      current && selectedCohort.students.some((student) => student.id === current) ? current : null,
    );
    setReportModalStudentId((current) =>
      current && selectedCohort.students.some((student) => student.id === current) ? current : null,
    );
    setNewReport((current) => ({
      ...current,
      studentId:
        current.studentId && selectedCohort.students.some((student) => student.id === current.studentId)
          ? current.studentId
          : selectedCohort.students[0]?.id ?? "",
    }));
  }, [selectedCohort]);

  function resetStudentForm() {
    setStudentDraft(emptyStudentDraft());
  }

  function handleCloseStudentEditModal() {
    setEditingStudentId(null);
    setEditingStudentDraft(emptyStudentDraft());
  }

  function handleToggleRosterEditMode() {
    const nextEditMode = !isRosterEditMode;
    setIsRosterEditMode(nextEditMode);

    if (!nextEditMode) {
      handleCloseStudentEditModal();
    }
  }

  function updateSelectedCohort(mutator: (cohort: Cohort) => Cohort) {
    if (!selectedCohort) {
      return;
    }

    setCohorts((current) =>
      current.map((cohort) => (cohort.id === selectedCohort.id ? mutator(cohort) : cohort)),
    );
  }

  function handleStudentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedCohort || !studentDraft.name.trim()) {
      return;
    }

    const trimmedStudent = {
      name: studentDraft.name.trim(),
      age: studentDraft.age.trim() || "TBC",
      guardian: studentDraft.guardian.trim() || "Pending",
      pace: studentDraft.pace,
      notes: studentDraft.notes.trim(),
    };

    const attendance = selectedCohort.classes.reduce<StudentRecord["attendance"]>((map, session) => {
      map[session.id] = "pending";
      return map;
    }, {});

    updateSelectedCohort((cohort) => ({
      ...cohort,
      students: [
        ...cohort.students,
        {
          id: createId("student"),
          ...trimmedStudent,
          attendance,
        },
      ],
    }));

    resetStudentForm();
  }

  function handleStudentEdit(student: StudentRecord) {
    setReportModalStudentId(null);
    setSelectedStudentId(student.id);
    setEditingStudentId(student.id);
    setEditingStudentDraft({
      name: student.name,
      age: student.age,
      guardian: student.guardian,
      pace: student.pace,
      notes: student.notes,
    });
  }

  function handleStudentEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedCohort || !editingStudentId || !editingStudentDraft.name.trim()) {
      return;
    }

    const trimmedStudent = {
      name: editingStudentDraft.name.trim(),
      age: editingStudentDraft.age.trim() || "TBC",
      guardian: editingStudentDraft.guardian.trim() || "Pending",
      pace: editingStudentDraft.pace,
      notes: editingStudentDraft.notes.trim(),
    };

    updateSelectedCohort((cohort) => ({
      ...cohort,
      students: cohort.students.map((student) =>
        student.id === editingStudentId
          ? {
              ...student,
              ...trimmedStudent,
            }
          : student,
      ),
    }));

    setSelectedStudentId(editingStudentId);
    handleCloseStudentEditModal();
  }

  function handleStudentDelete(student: StudentRecord) {
    const relatedReports = selectedCohort?.reports.filter((report) => report.studentId === student.id).length ?? 0;
    const confirmationMessage =
      relatedReports > 0
        ? `Delete ${student.name} and ${relatedReports} related report${relatedReports === 1 ? "" : "s"}?`
        : `Delete ${student.name} from this cohort?`;

    if (typeof window !== "undefined" && !window.confirm(confirmationMessage)) {
      return;
    }

    updateSelectedCohort((cohort) => ({
      ...cohort,
      students: cohort.students.filter((entry) => entry.id !== student.id),
      reports: cohort.reports.filter((report) => report.studentId !== student.id),
    }));

    if (editingStudentId === student.id) {
      handleCloseStudentEditModal();
    }

    if (selectedStudentId === student.id) {
      setSelectedStudentId(null);
    }

    if (reportModalStudentId === student.id) {
      setReportModalStudentId(null);
    }

    setNewReport((current) => ({
      ...current,
      studentId: current.studentId === student.id ? "" : current.studentId,
    }));
  }

  function handleReportSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedCohort || !newReport.studentId || !newReport.title.trim() || !newReport.summary.trim()) {
      return;
    }

    updateSelectedCohort((cohort) => ({
      ...cohort,
      reports: [
        {
          id: createId("report"),
          studentId: newReport.studentId,
          title: newReport.title.trim(),
          summary: newReport.summary.trim(),
          recommendation: newReport.recommendation.trim(),
          createdAt: new Date().toISOString(),
        },
        ...cohort.reports,
      ],
    }));

    setSelectedStudentId(newReport.studentId);
    setReportModalStudentId(null);
    setNewReport((current) => ({
      ...current,
      title: "",
      summary: "",
      recommendation: "",
    }));
  }

  function handleStartReport(student: StudentRecord) {
    setSelectedStudentId(student.id);
    setReportModalStudentId(student.id);
    setNewReport({
      studentId: student.id,
      title: `${student.name.split(" ")[0]} progress report`,
      summary: "",
      recommendation: "",
    });
  }

  function handleCloseReportModal() {
    setReportModalStudentId(null);
    setNewReport((current) => ({
      ...current,
      title: "",
      summary: "",
      recommendation: "",
    }));
  }

  if (!selectedCohort) {
    return null;
  }

  const availableSeats = Math.max(selectedCohort.capacity - selectedCohort.students.length, 0);
  const editingStudent = selectedCohort.students.find((student) => student.id === editingStudentId);
  const reportModalStudent = selectedCohort.students.find((student) => student.id === reportModalStudentId);
  const normalizedStudentSearch = studentSearch.trim().toLowerCase();
  const filteredStudents = normalizedStudentSearch
    ? selectedCohort.students.filter((student) =>
        [
          student.name,
          student.guardian,
          student.pace,
          student.age,
          student.notes,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedStudentSearch),
      )
    : selectedCohort.students;

  return (
    <>
      <style>{`
        .cohort-management-grid {
          display: grid;
          gap: 14px;
        }
        .cohort-management-two-up {
          display: grid;
          grid-template-columns: minmax(300px, 360px) minmax(0, 1fr);
          gap: 12px;
          align-items: start;
        }
        .cohort-management-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }
        .cohort-management-full-span {
          grid-column: 1 / -1;
        }
        @media (max-width: 1120px) {
          .cohort-management-two-up,
          .cohort-management-form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="cohort-management-grid">
        <Surface
          accent
          style={{
            padding: "18px",
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

          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", position: "relative" }}>
            <div style={{ maxWidth: "760px", display: "grid", gap: "10px" }}>
              {onBackToCohortDashboard ? (
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <ActionButton
                    secondary
                    onClick={() => onBackToCohortDashboard(selectedCohort.id)}
                    style={{ minWidth: "186px", minHeight: "40px" }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                      <ArrowLeft size={14} /> Back To Cohort Dashboard
                    </span>
                  </ActionButton>
                </div>
              ) : null}

              <SectionTitle
                eyebrow="Cohort Management"
                title={selectedCohort.name}
                detail={selectedCohort.program}
                titleStyle={{ fontSize: "24px" }}
              />

              <p style={{ color: ADMIN_THEME.muted, fontSize: "13px", lineHeight: 1.5, margin: "0 0 4px 0", maxWidth: "640px" }}>
                Move enrollment and roster maintenance into one focused workspace. Add new students, update profiles,
                and remove archived records here so the main cohort dashboard stays operational instead of overloaded.
              </p>

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
                  {selectedCohort.room}
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
                  {selectedCohort.students.length} active students
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
                  {selectedCohort.reports.length} reports
                </span>
              </div>
            </div>

            <div
              style={{
                minWidth: "228px",
                padding: "12px",
                borderRadius: "16px",
                border: `1px solid ${ADMIN_THEME.border}`,
                background: "linear-gradient(180deg, #FFFFFF 0%, #F7F2ED 100%)",
                boxShadow: "0 12px 30px rgba(70,46,25,0.08)",
              }}
            >
              <p style={{ color: ADMIN_THEME.subtle, fontSize: "10px", letterSpacing: "0px", textTransform: "uppercase", margin: "0 0 6px 0" }}>
                Management Focus
              </p>
              <h3 style={{ color: ADMIN_THEME.heading, fontSize: "20px", fontFamily: "var(--font-heading)", margin: "0 0 4px 0", lineHeight: 1 }}>
                STUDENT ROSTER
              </h3>
              <p style={{ color: ADMIN_THEME.muted, fontSize: "12px", lineHeight: 1.45, margin: "0 0 8px 0" }}>
                Keep enrollment, guardian details, pace bands, and coach notes clean in one place.
              </p>
              <p style={{ color: ADMIN_THEME.subtle, fontSize: "12px", margin: 0 }}>
                {availableSeats > 0
                  ? `${availableSeats} seats still available in this cohort.`
                  : "This cohort is currently at capacity."}
              </p>
            </div>
          </div>
        </Surface>

        <div className="cohort-management-two-up">
          <Surface style={{ padding: "16px", alignSelf: "start" }}>
            <SectionTitle
              eyebrow="Enrollment"
              title="Add Student To Cohort"
              subdetail={selectedCohort.name}
              titleStyle={{ fontSize: "24px" }}
            />
            <form onSubmit={handleStudentSubmit} className="cohort-management-form-grid">
              <div>
                <FieldLabel>Student Name</FieldLabel>
                <FieldShell>
                  <input
                    value={studentDraft.name}
                    onChange={(event) => setStudentDraft((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Enter full name"
                    style={inputStyle}
                  />
                </FieldShell>
              </div>
              <div>
                <FieldLabel>Age</FieldLabel>
                <FieldShell>
                  <input
                    value={studentDraft.age}
                    onChange={(event) => setStudentDraft((current) => ({ ...current, age: event.target.value }))}
                    placeholder="12"
                    style={inputStyle}
                  />
                </FieldShell>
              </div>
              <div>
                <FieldLabel>Guardian</FieldLabel>
                <FieldShell>
                  <input
                    value={studentDraft.guardian}
                    onChange={(event) => setStudentDraft((current) => ({ ...current, guardian: event.target.value }))}
                    placeholder="Parent or guardian"
                    style={inputStyle}
                  />
                </FieldShell>
              </div>
              <div>
                <FieldLabel>Progress Pace</FieldLabel>
                <FieldShell>
                  <select
                    value={studentDraft.pace}
                    onChange={(event) => setStudentDraft((current) => ({ ...current, pace: event.target.value as StudentPace }))}
                    style={inputStyle}
                  >
                    <option value="Steady">Steady</option>
                    <option value="Fast Track">Fast Track</option>
                    <option value="Needs Support">Needs Support</option>
                  </select>
                </FieldShell>
              </div>
              <div className="cohort-management-full-span">
                <FieldLabel>Coach Notes</FieldLabel>
                <FieldShell>
                  <textarea
                    value={studentDraft.notes}
                    onChange={(event) => setStudentDraft((current) => ({ ...current, notes: event.target.value }))}
                    placeholder="Add a quick note about confidence, goals, or support areas."
                    style={textareaStyle}
                  />
                </FieldShell>
              </div>
              <div
                className="cohort-management-full-span"
                style={{ display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "center", flexWrap: "wrap" }}
              >
                <p style={{ color: ADMIN_THEME.subtle, fontSize: "11px", lineHeight: 1.5, margin: 0 }}>
                  New students are added directly to this cohort and receive pending attendance for every scheduled class.
                </p>
                <ActionButton type="submit" style={{ minWidth: "136px", minHeight: "40px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                    <Plus size={14} /> Add Student
                  </span>
                </ActionButton>
              </div>
            </form>
          </Surface>

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
                eyebrow="Manage Students"
                title="Roster Controls"
                detail={
                  normalizedStudentSearch
                    ? `${filteredStudents.length}/${selectedCohort.students.length} shown`
                    : `${selectedCohort.students.length} stored`
                }
                titleStyle={{ fontSize: "24px" }}
              />
              <button
                type="button"
                onClick={handleToggleRosterEditMode}
                style={{
                  minHeight: "34px",
                  padding: "0 12px",
                  borderRadius: "999px",
                  border: `1px solid ${isRosterEditMode ? ADMIN_THEME.accentBorder : ADMIN_THEME.border}`,
                  backgroundColor: isRosterEditMode ? ADMIN_THEME.accentBg : ADMIN_THEME.surface,
                  color: isRosterEditMode ? ADMIN_THEME.accent : ADMIN_THEME.heading,
                  fontSize: "10px",
                  fontWeight: 800,
                  letterSpacing: "0px",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                {isRosterEditMode ? "Done Editing" : "Edit Students"}
              </button>
            </div>
            <div style={{ display: "grid", gap: "10px", marginBottom: "10px" }}>
              <div style={{ display: "grid", gap: "6px" }}>
                <FieldLabel>Search Students</FieldLabel>
                <FieldShell>
                  <input
                    value={studentSearch}
                    onChange={(event) => setStudentSearch(event.target.value)}
                    placeholder="Search name, guardian, pace, or notes"
                    style={inputStyle}
                  />
                </FieldShell>
              </div>
              <p style={{ color: ADMIN_THEME.subtle, fontSize: "11px", lineHeight: 1.45, margin: 0 }}>
                Click a student card to open their history. Use `Report` on a student row to open the coach report popup.
                {isRosterEditMode ? " Edit and delete controls are now visible for this roster." : " Turn on `Edit Students` to reveal edit and delete controls."}
              </p>
            </div>

            <div style={{ display: "grid", gap: "8px" }}>
              {selectedCohort.students.length === 0 ? null : filteredStudents.length === 0 ? (
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
                  No students match this search yet.
                </div>
              ) : (
                filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    onClick={() => setSelectedStudentId((current) => (current === student.id ? null : student.id))}
                    style={{
                      padding: "12px",
                      borderRadius: "14px",
                      display: "grid",
                      gap: "8px",
                      cursor: "pointer",
                      ...nestedCardStyle,
                      border:
                        selectedStudentId === student.id || editingStudentId === student.id
                          ? `1px solid ${ADMIN_THEME.accentBorder}`
                          : nestedCardStyle.border,
                    }}
                  >
                    <div style={{ display: "grid", gap: "4px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", flexWrap: "wrap", alignItems: "flex-start" }}>
                        <h4
                          style={{
                            color: ADMIN_THEME.heading,
                            fontSize: "16px",
                            fontFamily: "var(--font-body)",
                            fontStyle: "italic",
                            fontWeight: 800,
                            margin: 0,
                          }}
                        >
                          {student.name}
                        </h4>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleStartReport(student);
                            }}
                            style={{
                              minHeight: "30px",
                              padding: "0 9px",
                              borderRadius: "999px",
                              border: `1px solid ${ADMIN_THEME.border}`,
                              backgroundColor: newReport.studentId === student.id ? ADMIN_THEME.accentBg : ADMIN_THEME.surface,
                              color: newReport.studentId === student.id ? ADMIN_THEME.accent : ADMIN_THEME.heading,
                              fontSize: "10px",
                              fontWeight: 800,
                              letterSpacing: "0px",
                              textTransform: "uppercase",
                              cursor: "pointer",
                            }}
                          >
                            Report
                          </button>
                          {isRosterEditMode ? (
                            <>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleStudentEdit(student);
                                }}
                                style={{
                                  minHeight: "30px",
                                  padding: "0 9px",
                                  borderRadius: "999px",
                                  border: `1px solid ${ADMIN_THEME.border}`,
                                  backgroundColor:
                                    editingStudentId === student.id ? ADMIN_THEME.accentBg : ADMIN_THEME.surface,
                                  color: ADMIN_THEME.heading,
                                  fontSize: "10px",
                                  fontWeight: 800,
                                  letterSpacing: "0px",
                                  textTransform: "uppercase",
                                  cursor: "pointer",
                                }}
                              >
                                {editingStudentId === student.id ? "Editing" : "Edit"}
                              </button>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleStudentDelete(student);
                                }}
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
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                        <p style={{ color: ADMIN_THEME.muted, fontSize: "11px", margin: 0 }}>
                          Age {student.age} · Guardian {student.guardian}
                        </p>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          <span style={pacePillStyle(student.pace)}>{student.pace}</span>
                          <span style={{ color: ADMIN_THEME.subtle, fontSize: "10px", letterSpacing: "0px", textTransform: "uppercase" }}>
                            {attendanceBreakdown(student)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p style={{ color: ADMIN_THEME.subtle, fontSize: "11px", lineHeight: 1.45, margin: 0 }}>
                      {student.notes || "No coach notes stored for this student yet."}
                    </p>

                    {selectedStudentId === student.id ? (
                      <div
                        style={{
                          display: "grid",
                          gap: "8px",
                          paddingTop: "8px",
                          borderTop: `1px solid ${ADMIN_THEME.borderSoft}`,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                          <p style={{ color: ADMIN_THEME.accent, fontSize: "10px", fontWeight: 700, letterSpacing: "0px", textTransform: "uppercase", margin: 0 }}>
                            Previous Reports
                          </p>
                          <span style={{ color: ADMIN_THEME.subtle, fontSize: "10px", letterSpacing: "0px", textTransform: "uppercase" }}>
                            {selectedCohort.reports.filter((report) => report.studentId === student.id).length} stored
                          </span>
                        </div>
                        {selectedCohort.reports.filter((report) => report.studentId === student.id).length === 0 ? (
                          <p style={{ color: ADMIN_THEME.subtle, fontSize: "11px", lineHeight: 1.45, margin: 0 }}>
                            No coach reports have been saved for this student yet.
                          </p>
                        ) : (
                          selectedCohort.reports
                            .filter((report) => report.studentId === student.id)
                            .map((report) => (
                              <div
                                key={report.id}
                                style={{
                                  display: "grid",
                                  gap: "4px",
                                  padding: "10px",
                                  borderRadius: "12px",
                                  backgroundColor: "#F3EEE8",
                                  border: `1px solid ${ADMIN_THEME.borderSoft}`,
                                }}
                              >
                                <p style={{ color: ADMIN_THEME.accent, fontSize: "10px", letterSpacing: "0px", textTransform: "uppercase", margin: 0 }}>
                                  {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(report.createdAt))}
                                </p>
                                <p style={{ color: ADMIN_THEME.heading, fontSize: "13px", fontWeight: 800, margin: 0 }}>
                                  {report.title}
                                </p>
                                <p style={{ color: ADMIN_THEME.muted, fontSize: "11px", lineHeight: 1.45, margin: 0 }}>
                                  {report.summary}
                                </p>
                                {report.recommendation ? (
                                  <p style={{ color: ADMIN_THEME.subtle, fontSize: "11px", lineHeight: 1.45, margin: 0 }}>
                                    Next: {report.recommendation}
                                  </p>
                                ) : null}
                              </div>
                            ))
                        )}
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </Surface>
        </div>
      </div>

      {editingStudent ? (
        <div
          onClick={handleCloseStudentEditModal}
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
                  Student Record
                </p>
                <h3 style={{ color: ADMIN_THEME.heading, fontSize: "24px", fontFamily: "var(--font-heading)", margin: 0, lineHeight: 1 }}>
                  Edit Student
                </h3>
                <p style={{ color: ADMIN_THEME.muted, fontSize: "12px", margin: 0 }}>
                  Update profile details without disturbing the add-student form.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseStudentEditModal}
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

            <form onSubmit={handleStudentEditSubmit} className="cohort-management-form-grid">
              <div>
                <FieldLabel>Student Name</FieldLabel>
                <FieldShell>
                  <input
                    value={editingStudentDraft.name}
                    onChange={(event) => setEditingStudentDraft((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Enter full name"
                    style={inputStyle}
                  />
                </FieldShell>
              </div>
              <div>
                <FieldLabel>Age</FieldLabel>
                <FieldShell>
                  <input
                    value={editingStudentDraft.age}
                    onChange={(event) => setEditingStudentDraft((current) => ({ ...current, age: event.target.value }))}
                    placeholder="12"
                    style={inputStyle}
                  />
                </FieldShell>
              </div>
              <div>
                <FieldLabel>Guardian</FieldLabel>
                <FieldShell>
                  <input
                    value={editingStudentDraft.guardian}
                    onChange={(event) => setEditingStudentDraft((current) => ({ ...current, guardian: event.target.value }))}
                    placeholder="Parent or guardian"
                    style={inputStyle}
                  />
                </FieldShell>
              </div>
              <div>
                <FieldLabel>Progress Pace</FieldLabel>
                <FieldShell>
                  <select
                    value={editingStudentDraft.pace}
                    onChange={(event) => setEditingStudentDraft((current) => ({ ...current, pace: event.target.value as StudentPace }))}
                    style={inputStyle}
                  >
                    <option value="Steady">Steady</option>
                    <option value="Fast Track">Fast Track</option>
                    <option value="Needs Support">Needs Support</option>
                  </select>
                </FieldShell>
              </div>
              <div className="cohort-management-full-span">
                <FieldLabel>Coach Notes</FieldLabel>
                <FieldShell>
                  <textarea
                    value={editingStudentDraft.notes}
                    onChange={(event) => setEditingStudentDraft((current) => ({ ...current, notes: event.target.value }))}
                    placeholder="Add a quick note about confidence, goals, or support areas."
                    style={textareaStyle}
                  />
                </FieldShell>
              </div>
              <div
                className="cohort-management-full-span"
                style={{ display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "center", flexWrap: "wrap" }}
              >
                <p style={{ color: ADMIN_THEME.subtle, fontSize: "11px", lineHeight: 1.5, margin: 0 }}>
                  Save the revised record back into the cohort roster from this popup.
                </p>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <ActionButton secondary type="button" onClick={handleCloseStudentEditModal} style={{ minWidth: "118px", minHeight: "40px" }}>
                    Cancel
                  </ActionButton>
                  <ActionButton type="submit" style={{ minWidth: "132px", minHeight: "40px" }}>
                    Save Student
                  </ActionButton>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {reportModalStudent ? (
        <div
          onClick={handleCloseReportModal}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(22,18,14,0.38)",
            display: "grid",
            placeItems: "center",
            padding: "24px",
            zIndex: 40,
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
                  Coach Report
                </p>
                <h3 style={{ color: ADMIN_THEME.heading, fontSize: "24px", fontFamily: "var(--font-heading)", margin: 0, lineHeight: 1 }}>
                  {reportModalStudent.name}
                </h3>
                <p style={{ color: ADMIN_THEME.muted, fontSize: "12px", margin: 0 }}>
                  Age {reportModalStudent.age} · Guardian {reportModalStudent.guardian}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseReportModal}
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

            <form onSubmit={handleReportSubmit} style={{ display: "grid", gap: "10px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "10px" }}>
                <div>
                  <FieldLabel>Student</FieldLabel>
                  <FieldShell>
                    <input value={reportModalStudent.name} readOnly style={inputStyle} />
                  </FieldShell>
                </div>
                <div>
                  <FieldLabel>Report Title</FieldLabel>
                  <FieldShell>
                    <input
                      value={newReport.title}
                      onChange={(event) => setNewReport((current) => ({ ...current, title: event.target.value }))}
                      placeholder="Progress report"
                      style={inputStyle}
                    />
                  </FieldShell>
                </div>
              </div>

              <div>
                <FieldLabel>Summary</FieldLabel>
                <FieldShell>
                  <textarea
                    value={newReport.summary}
                    onChange={(event) => setNewReport((current) => ({ ...current, summary: event.target.value }))}
                    placeholder="Summarise pace, confidence, and key session behaviours."
                    style={{ ...textareaStyle, minHeight: "88px" }}
                  />
                </FieldShell>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: "10px", alignItems: "end" }}>
                <div>
                  <FieldLabel>Next Step</FieldLabel>
                  <FieldShell>
                    <input
                      value={newReport.recommendation}
                      onChange={(event) => setNewReport((current) => ({ ...current, recommendation: event.target.value }))}
                      placeholder="Home practice or coaching focus"
                      style={inputStyle}
                    />
                  </FieldShell>
                </div>
                <ActionButton type="submit" style={{ minWidth: "118px", minHeight: "40px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <FileText size={14} /> Save Report
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
