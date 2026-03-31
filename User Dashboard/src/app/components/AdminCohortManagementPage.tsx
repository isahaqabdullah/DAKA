import { useEffect, useMemo, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, FileText, Plus, User, UserPlus, X } from "lucide-react";
import {
  ActionButton,
  ADMIN_THEME,
  CohortSwitcher,
  SectionTitle,
  STORAGE_KEY,
  Surface,
  createId,
  loadCohorts,
  loadUnassignedStudents,
  saveUnassignedStudents,
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

type AssignmentFilter = "all" | "focused" | "unassigned";

interface StudentManagementRow extends StudentRecord {
  cohortId?: string;
  cohortName: string;
  reportCount: number;
}

function emptyStudentDraft(defaultCohortId = "") {
  return {
    name: "",
    age: "",
    guardian: "",
    pace: "Steady" as StudentPace,
    notes: "",
    status: "active" as "active" | "withdrawn",
    assignedCohortId: defaultCohortId,
  };
}

function buildStudentDraft(student: StudentManagementRow) {
  return {
    name: student.name,
    age: student.age,
    guardian: student.guardian,
    pace: student.pace,
    notes: student.notes,
    status: student.status ?? "active",
    assignedCohortId: student.cohortId ?? "",
  };
}

function attendanceRate(student: StudentRecord, totalClasses: number): string {
  if (totalClasses === 0) return "No sessions yet";
  const nonPending = Object.values(student.attendance).filter((state) => state !== "pending").length;
  const pct = Math.round((nonPending / totalClasses) * 100);
  return `${nonPending}/${totalClasses} tracked · ${pct}%`;
}

function createAttendanceMap(cohort: Cohort): StudentRecord["attendance"] {
  return cohort.classes.reduce<StudentRecord["attendance"]>((map, session) => {
    map[session.id] = "pending";
    return map;
  }, {});
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

interface AdminStudentManagementPageProps {
  initialCohortId?: string;
  onOpenReports?: (cohortId: string, studentId?: string) => void;
  onSelectCohort?: (cohortId: string) => void;
  onBackToCohortDashboard?: (cohortId: string) => void;
  onBackToLanding?: () => void;
}

export function AdminStudentManagementPage({
  initialCohortId,
  onOpenReports,
  onSelectCohort,
  onBackToCohortDashboard,
  onBackToLanding,
}: AdminStudentManagementPageProps) {
  const [cohorts, setCohorts] = useState<Cohort[]>(() => loadCohorts());
  const [unassignedStudents, setUnassignedStudents] = useState<StudentRecord[]>(() => loadUnassignedStudents());
  const [focusedCohortId, setFocusedCohortId] = useState(() => initialCohortId ?? loadCohorts().find((cohort) => !cohort.archived)?.id ?? "");
  const [assignmentFilter, setAssignmentFilter] = useState<AssignmentFilter>("all");
  const [studentSearch, setStudentSearch] = useState("");
  const [paceFilter, setPaceFilter] = useState<"all" | StudentPace>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "withdrawn">("all");
  const [studentDraft, setStudentDraft] = useState(() => emptyStudentDraft(initialCohortId ?? loadCohorts().find((cohort) => !cohort.archived)?.id ?? ""));
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [editingStudentContext, setEditingStudentContext] = useState<{ studentId: string; sourceCohortId: string | null } | null>(null);
  const [editingStudentDraft, setEditingStudentDraft] = useState(() => emptyStudentDraft());
  const [studentModalMode, setStudentModalMode] = useState<"view" | "edit">("view");

  const activeCohorts = cohorts.filter((cohort) => !cohort.archived);
  const focusedCohort = activeCohorts.find((cohort) => cohort.id === focusedCohortId) ?? activeCohorts[0];

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cohorts));
  }, [cohorts]);

  useEffect(() => {
    saveUnassignedStudents(unassignedStudents);
  }, [unassignedStudents]);

  useEffect(() => {
    if (initialCohortId && activeCohorts.some((cohort) => cohort.id === initialCohortId)) {
      setFocusedCohortId(initialCohortId);
      return;
    }

    if (!focusedCohortId && activeCohorts[0]) {
      setFocusedCohortId(activeCohorts[0].id);
    }
  }, [activeCohorts, focusedCohortId, initialCohortId]);

  useEffect(() => {
    if (focusedCohort) {
      onSelectCohort?.(focusedCohort.id);
    }
  }, [focusedCohort, onSelectCohort]);

  const allStudents = useMemo<StudentManagementRow[]>(
    () => [
      ...cohorts.flatMap((cohort) =>
        cohort.students.map((student) => ({
          ...student,
          cohortId: cohort.id,
          cohortName: cohort.name,
          reportCount: cohort.reports.filter((report) => report.studentId === student.id).length,
        })),
      ),
      ...unassignedStudents.map((student) => ({
        ...student,
        cohortId: undefined,
        cohortName: "Not Assigned",
        reportCount: 0,
      })),
    ],
    [cohorts, unassignedStudents],
  );

  const totalStudents = allStudents.length;
  const unassignedCount = allStudents.filter((student) => !student.cohortId).length;
  const assignedCount = totalStudents - unassignedCount;
  const withdrawnCount = allStudents.filter((student) => (student.status ?? "active") === "withdrawn").length;

  const normalizedStudentSearch = studentSearch.trim().toLowerCase();
  const hasActiveFilters =
    normalizedStudentSearch.length > 0 ||
    assignmentFilter !== "all" ||
    paceFilter !== "all" ||
    statusFilter !== "all";
  const filteredStudents = allStudents
    .filter((student) => {
      const matchesSearch =
        !normalizedStudentSearch ||
        [student.name, student.guardian, student.pace, student.age, student.notes, student.cohortName]
          .join(" ")
          .toLowerCase()
          .includes(normalizedStudentSearch);
      const matchesStatus = statusFilter === "all" || (student.status ?? "active") === statusFilter;
      const matchesPace = paceFilter === "all" || student.pace === paceFilter;
      const matchesAssignment =
        assignmentFilter === "all"
          ? true
          : assignmentFilter === "unassigned"
            ? !student.cohortId
            : focusedCohort
              ? student.cohortId === focusedCohort.id
              : false;

      return matchesSearch && matchesStatus && matchesPace && matchesAssignment;
    })
    .sort((left, right) => {
      if (Boolean(left.cohortId) !== Boolean(right.cohortId)) {
        return left.cohortId ? 1 : -1;
      }

      if ((left.status ?? "active") !== (right.status ?? "active")) {
        return (left.status ?? "active") === "active" ? -1 : 1;
      }

      if (left.cohortName !== right.cohortName) {
        return left.cohortName.localeCompare(right.cohortName);
      }

      return left.name.localeCompare(right.name);
    });

  const editingStudent = editingStudentContext
    ? allStudents.find((student) => student.id === editingStudentContext.studentId)
    : undefined;
  const editingStudentSourceCohort = editingStudent?.cohortId
    ? cohorts.find((cohort) => cohort.id === editingStudent.cohortId)
    : undefined;
  const editingStudentAttendanceSummary = editingStudent
    ? editingStudent.cohortId
      ? attendanceRate(editingStudent, editingStudentSourceCohort?.classes.length ?? 0)
      : "Awaiting cohort assignment"
    : "";

  function updateFocusCohort(cohortId: string) {
    setFocusedCohortId(cohortId);
  }

  function clearFilters() {
    setStudentSearch("");
    setAssignmentFilter("all");
    setPaceFilter("all");
    setStatusFilter("all");
  }

  function commitCohorts(nextCohorts: Cohort[]) {
    setCohorts(nextCohorts);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextCohorts));
  }

  function commitUnassignedStudents(nextStudents: StudentRecord[]) {
    setUnassignedStudents(nextStudents);
    saveUnassignedStudents(nextStudents);
  }

  function commitAll(nextCohorts: Cohort[], nextUnassignedStudents: StudentRecord[]) {
    commitCohorts(nextCohorts);
    commitUnassignedStudents(nextUnassignedStudents);
  }

  function resetStudentForm() {
    setStudentDraft(emptyStudentDraft(focusedCohort?.id ?? ""));
  }

  function handleCloseStudentEditModal() {
    setEditingStudentContext(null);
    setEditingStudentDraft(emptyStudentDraft(focusedCohort?.id ?? ""));
    setStudentModalMode("view");
  }

  function handleOpenAddStudentModal() {
    setStudentDraft(emptyStudentDraft(focusedCohort?.id ?? ""));
    setIsAddStudentModalOpen(true);
  }

  function handleBack() {
    if (focusedCohort && onBackToCohortDashboard) {
      onBackToCohortDashboard(focusedCohort.id);
      return;
    }

    onBackToLanding?.();
  }

  function handleStudentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!studentDraft.name.trim()) {
      return;
    }

    const targetCohort = activeCohorts.find((cohort) => cohort.id === studentDraft.assignedCohortId);
    const nextStudent: StudentRecord = {
      id: createId("student"),
      name: studentDraft.name.trim(),
      age: studentDraft.age.trim() || "TBC",
      guardian: studentDraft.guardian.trim() || "Pending",
      pace: studentDraft.pace,
      notes: studentDraft.notes.trim(),
      status: studentDraft.status,
      attendance: targetCohort ? createAttendanceMap(targetCohort) : {},
    };

    if (targetCohort) {
      commitCohorts(
        cohorts.map((cohort) =>
          cohort.id === targetCohort.id
            ? { ...cohort, students: [...cohort.students, nextStudent] }
            : cohort,
        ),
      );
      updateFocusCohort(targetCohort.id);
    } else {
      commitUnassignedStudents([...unassignedStudents, nextStudent]);
    }

    resetStudentForm();
    setIsAddStudentModalOpen(false);
  }

  function handleStudentEdit(student: StudentManagementRow) {
    setEditingStudentContext({
      studentId: student.id,
      sourceCohortId: student.cohortId ?? null,
    });
    setEditingStudentDraft(buildStudentDraft(student));
    setStudentModalMode("view");
  }

  function handleStartStudentEdit() {
    if (!editingStudent) {
      return;
    }

    setEditingStudentContext({
      studentId: editingStudent.id,
      sourceCohortId: editingStudent.cohortId ?? null,
    });
    setEditingStudentDraft(buildStudentDraft(editingStudent));
    setStudentModalMode("edit");
  }

  function handleStudentEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingStudentContext || !editingStudentDraft.name.trim()) {
      return;
    }

    const sourceCohortId = editingStudentContext.sourceCohortId;
    const targetCohortId = editingStudentDraft.assignedCohortId || null;
    const sourceCohort = sourceCohortId ? cohorts.find((cohort) => cohort.id === sourceCohortId) : undefined;
    const targetCohort = targetCohortId ? activeCohorts.find((cohort) => cohort.id === targetCohortId) : undefined;
    const reportCount = sourceCohort?.reports.filter((report) => report.studentId === editingStudentContext.studentId).length ?? 0;
    const changingAssignment = sourceCohortId !== targetCohortId;

    if (
      changingAssignment &&
      reportCount > 0 &&
      typeof window !== "undefined" &&
      !window.confirm(
        `Moving ${editingStudentDraft.name.trim()} will remove ${reportCount} linked report${reportCount === 1 ? "" : "s"} from the current cohort. Continue?`,
      )
    ) {
      return;
    }

    const baseStudent = {
      name: editingStudentDraft.name.trim(),
      age: editingStudentDraft.age.trim() || "TBC",
      guardian: editingStudentDraft.guardian.trim() || "Pending",
      pace: editingStudentDraft.pace,
      notes: editingStudentDraft.notes.trim(),
      status: editingStudentDraft.status,
    };

    if (!changingAssignment) {
      if (sourceCohortId) {
        commitCohorts(
          cohorts.map((cohort) =>
            cohort.id === sourceCohortId
              ? {
                  ...cohort,
                  students: cohort.students.map((student) =>
                    student.id === editingStudentContext.studentId
                      ? { ...student, ...baseStudent }
                      : student,
                  ),
                }
              : cohort,
          ),
        );
      } else {
        commitUnassignedStudents(
          unassignedStudents.map((student) =>
            student.id === editingStudentContext.studentId
              ? { ...student, ...baseStudent }
              : student,
          ),
        );
      }

      setStudentModalMode("view");
      return;
    }

    const studentForMove = allStudents.find((student) => student.id === editingStudentContext.studentId);

    if (!studentForMove) {
      return;
    }

    const movedStudent: StudentRecord = {
      id: studentForMove.id,
      ...baseStudent,
      attendance: targetCohort ? createAttendanceMap(targetCohort) : {},
    };

    const nextCohorts = cohorts.map((cohort) => {
      if (cohort.id === sourceCohortId) {
        return {
          ...cohort,
          students: cohort.students.filter((student) => student.id !== editingStudentContext.studentId),
          reports: cohort.reports.filter((report) => report.studentId !== editingStudentContext.studentId),
        };
      }

      if (targetCohort && cohort.id === targetCohort.id) {
        return {
          ...cohort,
          students: [...cohort.students, movedStudent],
        };
      }

      return cohort;
    });

    let nextUnassignedStudents = unassignedStudents.filter((student) => student.id !== editingStudentContext.studentId);

    if (!sourceCohortId && !targetCohort) {
      nextUnassignedStudents = unassignedStudents.map((student) =>
        student.id === editingStudentContext.studentId ? movedStudent : student,
      );
    } else if (!targetCohort) {
      nextUnassignedStudents = [...nextUnassignedStudents, movedStudent];
    }

    commitAll(nextCohorts, nextUnassignedStudents);

    if (targetCohort) {
      updateFocusCohort(targetCohort.id);
    }

    setStudentModalMode("view");
  }

  function handleStudentDelete(student: StudentManagementRow) {
    const reportCount = student.cohortId
      ? cohorts.find((cohort) => cohort.id === student.cohortId)?.reports.filter((report) => report.studentId === student.id).length ?? 0
      : 0;
    const confirmationMessage =
      reportCount > 0
        ? `Delete ${student.name} and ${reportCount} linked report${reportCount === 1 ? "" : "s"}?`
        : student.cohortId
          ? `Delete ${student.name} from ${student.cohortName}?`
          : `Delete ${student.name} from the unassigned list?`;

    if (typeof window !== "undefined" && !window.confirm(confirmationMessage)) {
      return false;
    }

    if (!student.cohortId) {
      commitUnassignedStudents(unassignedStudents.filter((entry) => entry.id !== student.id));
      if (editingStudentContext?.studentId === student.id) {
        handleCloseStudentEditModal();
      }
      return true;
    }

    commitCohorts(
      cohorts.map((cohort) =>
        cohort.id === student.cohortId
          ? {
              ...cohort,
              students: cohort.students.filter((entry) => entry.id !== student.id),
              reports: cohort.reports.filter((report) => report.studentId !== student.id),
            }
          : cohort,
      ),
    );

    if (editingStudentContext?.studentId === student.id) {
      handleCloseStudentEditModal();
    }

    return true;
  }

  if (!focusedCohort && activeCohorts.length === 0) {
    return null;
  }

  return (
    <>
      <style>{`
        .student-management-grid {
          display: grid;
          gap: 14px;
        }
        .student-management-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }
        .student-management-list-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 10px;
          align-items: center;
        }
        .student-management-full-span {
          grid-column: 1 / -1;
        }
        @media (max-width: 1120px) {
          .student-management-form-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 760px) {
          .student-management-list-row {
            grid-template-columns: 1fr;
            align-items: start;
          }
        }
      `}</style>

      <div className="student-management-grid">
        <Surface style={{ padding: "18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "14px", flexWrap: "wrap", alignItems: "flex-start" }}>
            <div style={{ maxWidth: "820px", display: "grid", gap: "10px" }}>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-start" }}>
                {onBackToCohortDashboard || onBackToLanding ? (
                  <button
                    type="button"
                    onClick={handleBack}
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
                <div style={{ display: "grid", gap: "10px", flex: "1 1 420px" }}>
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                    <SectionTitle
                      eyebrow="Student Desk"
                      title="All Students"
                      detail="Add, edit, delete, assign, or hold students as not assigned until placement is decided."
                      titleStyle={{ fontSize: "24px" }}
                    />
                    {focusedCohort ? (
                      <CohortSwitcher cohorts={activeCohorts} selectedCohortId={focusedCohort.id} onSelect={updateFocusCohort} />
                    ) : null}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ padding: "7px 10px", borderRadius: "999px", border: `1px solid ${ADMIN_THEME.accentBorder}`, backgroundColor: ADMIN_THEME.accentBg, color: ADMIN_THEME.accent, fontSize: "11px", textTransform: "uppercase" }}>
                  {totalStudents} total students
                </span>
                <span style={{ padding: "7px 10px", borderRadius: "999px", border: `1px solid ${ADMIN_THEME.border}`, backgroundColor: ADMIN_THEME.surfaceSoft, color: ADMIN_THEME.muted, fontSize: "11px", textTransform: "uppercase" }}>
                  {assignedCount} assigned
                </span>
                <span style={{ padding: "7px 10px", borderRadius: "999px", border: `1px solid rgba(245,158,11,0.22)`, backgroundColor: "rgba(245,158,11,0.12)", color: "#9D6100", fontSize: "11px", textTransform: "uppercase" }}>
                  {unassignedCount} not assigned
                </span>
                <span style={{ padding: "7px 10px", borderRadius: "999px", border: `1px solid ${ADMIN_THEME.border}`, backgroundColor: ADMIN_THEME.surfaceSoft, color: ADMIN_THEME.muted, fontSize: "11px", textTransform: "uppercase" }}>
                  {withdrawnCount} withdrawn
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <ActionButton onClick={handleOpenAddStudentModal} style={{ minWidth: "148px", minHeight: "40px" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  <Plus size={14} /> Add Student
                </span>
              </ActionButton>
            </div>
          </div>
        </Surface>

        {isAddStudentModalOpen ? (
          <div
            style={{ position: "fixed", inset: 0, backgroundColor: "rgba(43,31,22,0.40)", backdropFilter: "blur(4px)", zIndex: 200, display: "grid", placeItems: "center", padding: "24px" }}
            onClick={() => {
              setIsAddStudentModalOpen(false);
              resetStudentForm();
            }}
          >
            <div
              style={{ backgroundColor: ADMIN_THEME.surface, borderRadius: "20px", padding: "24px", width: "100%", maxWidth: "560px", boxShadow: "0 24px 56px rgba(43,31,22,0.20)" }}
              onClick={(event) => event.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <SectionTitle eyebrow="Enrollment" title="Add Student" subdetail="Choose a cohort now or leave the student unassigned." titleStyle={{ fontSize: "20px" }} />
                <button type="button" onClick={() => { setIsAddStudentModalOpen(false); resetStudentForm(); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: ADMIN_THEME.subtle }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleStudentSubmit} className="student-management-form-grid">
                <div>
                  <FieldLabel>Student Name</FieldLabel>
                  <FieldShell>
                    <input value={studentDraft.name} onChange={(event) => setStudentDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Enter full name" style={inputStyle} />
                  </FieldShell>
                </div>
                <div>
                  <FieldLabel>Assign to Cohort</FieldLabel>
                  <FieldShell>
                    <select value={studentDraft.assignedCohortId} onChange={(event) => setStudentDraft((current) => ({ ...current, assignedCohortId: event.target.value }))} style={inputStyle}>
                      <option value="">Not assigned</option>
                      {activeCohorts.map((cohort) => (
                        <option key={cohort.id} value={cohort.id}>
                          {cohort.name}
                        </option>
                      ))}
                    </select>
                  </FieldShell>
                </div>
                <div>
                  <FieldLabel>Age</FieldLabel>
                  <FieldShell>
                    <input value={studentDraft.age} onChange={(event) => setStudentDraft((current) => ({ ...current, age: event.target.value }))} placeholder="12" style={inputStyle} />
                  </FieldShell>
                </div>
                <div>
                  <FieldLabel>Guardian</FieldLabel>
                  <FieldShell>
                    <input value={studentDraft.guardian} onChange={(event) => setStudentDraft((current) => ({ ...current, guardian: event.target.value }))} placeholder="Parent or guardian" style={inputStyle} />
                  </FieldShell>
                </div>
                <div className="student-management-full-span">
                  <FieldLabel>Coach Notes</FieldLabel>
                  <FieldShell>
                    <textarea value={studentDraft.notes} onChange={(event) => setStudentDraft((current) => ({ ...current, notes: event.target.value }))} placeholder="Add a quick note about confidence, support areas, or goals." style={textareaStyle} />
                  </FieldShell>
                </div>
                <div className="student-management-full-span" style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <ActionButton secondary type="button" onClick={() => { setIsAddStudentModalOpen(false); resetStudentForm(); }} style={{ minWidth: "100px" }}>
                    Cancel
                  </ActionButton>
                  <ActionButton type="submit" style={{ minWidth: "150px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                      <UserPlus size={14} /> Save Student
                    </span>
                  </ActionButton>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {editingStudentContext && editingStudent ? (
          <div
            style={{ position: "fixed", inset: 0, backgroundColor: "rgba(43,31,22,0.40)", backdropFilter: "blur(4px)", zIndex: 200, display: "grid", placeItems: "center", padding: "24px" }}
            onClick={handleCloseStudentEditModal}
          >
            <div
              style={{ backgroundColor: ADMIN_THEME.surface, borderRadius: "20px", padding: "24px", width: "100%", maxWidth: "640px", boxShadow: "0 24px 56px rgba(43,31,22,0.20)" }}
              onClick={(event) => event.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <SectionTitle eyebrow="Student Record" title={editingStudent.name} subdetail={editingStudent.cohortId ? editingStudent.cohortName : "Not assigned"} titleStyle={{ fontSize: "20px" }} />
                <button type="button" onClick={handleCloseStudentEditModal} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: ADMIN_THEME.subtle }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: "grid", gap: "10px", padding: "14px", borderRadius: "16px", marginBottom: "16px", ...nestedCardStyle }}>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                  <span style={pacePillStyle(editingStudent.pace)}>{editingStudent.pace}</span>
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: "999px",
                      border: editingStudent.cohortId ? `1px solid ${ADMIN_THEME.border}` : "1px solid rgba(245,158,11,0.22)",
                      backgroundColor: editingStudent.cohortId ? ADMIN_THEME.surface : "rgba(245,158,11,0.12)",
                      color: editingStudent.cohortId ? ADMIN_THEME.subtle : "#9D6100",
                      fontSize: "10px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                    }}
                  >
                    {editingStudent.cohortName}
                  </span>
                  {(editingStudent.status ?? "active") === "withdrawn" ? (
                    <span style={{ padding: "4px 8px", borderRadius: "999px", backgroundColor: ADMIN_THEME.surfaceSoft, border: `1px solid ${ADMIN_THEME.border}`, color: ADMIN_THEME.subtle, fontSize: "10px", fontWeight: 700, textTransform: "uppercase" }}>
                      Withdrawn
                    </span>
                  ) : null}
                  <span style={{ padding: "4px 8px", borderRadius: "999px", backgroundColor: ADMIN_THEME.accentBg, border: `1px solid ${ADMIN_THEME.accentBorder}`, color: ADMIN_THEME.accent, fontSize: "10px", fontWeight: 700, textTransform: "uppercase" }}>
                    {editingStudent.reportCount} report{editingStudent.reportCount === 1 ? "" : "s"}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "10px" }}>
                  <div>
                    <p style={{ color: ADMIN_THEME.subtle, fontSize: "10px", textTransform: "uppercase", margin: "0 0 4px 0" }}>Guardian</p>
                    <p style={{ color: ADMIN_THEME.heading, fontSize: "13px", fontWeight: 700, margin: 0 }}>{editingStudent.guardian}</p>
                  </div>
                  <div>
                    <p style={{ color: ADMIN_THEME.subtle, fontSize: "10px", textTransform: "uppercase", margin: "0 0 4px 0" }}>Age</p>
                    <p style={{ color: ADMIN_THEME.heading, fontSize: "13px", fontWeight: 700, margin: 0 }}>{editingStudent.age}</p>
                  </div>
                  <div>
                    <p style={{ color: ADMIN_THEME.subtle, fontSize: "10px", textTransform: "uppercase", margin: "0 0 4px 0" }}>Attendance</p>
                    <p style={{ color: ADMIN_THEME.heading, fontSize: "13px", fontWeight: 700, margin: 0 }}>{editingStudentAttendanceSummary}</p>
                  </div>
                </div>
              </div>

              {studentModalMode === "view" ? (
                <div style={{ display: "grid", gap: "14px" }}>
                  <div style={{ padding: "14px", borderRadius: "16px", ...nestedCardStyle }}>
                    <p style={{ color: ADMIN_THEME.subtle, fontSize: "10px", textTransform: "uppercase", margin: "0 0 6px 0" }}>Coach Notes</p>
                    <p style={{ color: ADMIN_THEME.heading, fontSize: "13px", lineHeight: 1.6, margin: 0 }}>
                      {editingStudent.notes.trim() || "No coach notes added for this student yet."}
                    </p>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", flexWrap: "wrap" }}>
                    {onOpenReports && editingStudent.cohortId ? (
                      <ActionButton
                        secondary
                        type="button"
                        onClick={() => onOpenReports(editingStudent.cohortId as string, editingStudent.id)}
                        style={{ minWidth: "136px" }}
                      >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                          <FileText size={14} /> Open Progress
                        </span>
                      </ActionButton>
                    ) : null}
                    <ActionButton secondary type="button" onClick={handleStartStudentEdit} style={{ minWidth: "112px" }}>
                      Edit
                    </ActionButton>
                    <button
                      type="button"
                      onClick={() => handleStudentDelete(editingStudent)}
                      style={{
                        minHeight: "40px",
                        padding: "0 14px",
                        borderRadius: "999px",
                        border: "1px solid rgba(200,52,46,0.18)",
                        backgroundColor: "rgba(200,52,46,0.08)",
                        color: ADMIN_THEME.accent,
                        fontSize: "11px",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        cursor: "pointer",
                      }}
                    >
                      Delete Student
                    </button>
                    <ActionButton secondary type="button" onClick={handleCloseStudentEditModal} style={{ minWidth: "110px" }}>
                      Close
                    </ActionButton>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleStudentEditSubmit} className="student-management-form-grid">
                  <div>
                    <FieldLabel>Student Name</FieldLabel>
                    <FieldShell>
                      <input value={editingStudentDraft.name} onChange={(event) => setEditingStudentDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Enter full name" style={inputStyle} />
                    </FieldShell>
                  </div>
                  <div>
                    <FieldLabel>Assigned Cohort</FieldLabel>
                    <FieldShell>
                      <select value={editingStudentDraft.assignedCohortId} onChange={(event) => setEditingStudentDraft((current) => ({ ...current, assignedCohortId: event.target.value }))} style={inputStyle}>
                        <option value="">Not assigned</option>
                        {activeCohorts.map((cohort) => (
                          <option key={cohort.id} value={cohort.id}>
                            {cohort.name}
                          </option>
                        ))}
                      </select>
                    </FieldShell>
                  </div>
                  <div>
                    <FieldLabel>Age</FieldLabel>
                    <FieldShell>
                      <input value={editingStudentDraft.age} onChange={(event) => setEditingStudentDraft((current) => ({ ...current, age: event.target.value }))} placeholder="12" style={inputStyle} />
                    </FieldShell>
                  </div>
                  <div>
                    <FieldLabel>Guardian</FieldLabel>
                    <FieldShell>
                      <input value={editingStudentDraft.guardian} onChange={(event) => setEditingStudentDraft((current) => ({ ...current, guardian: event.target.value }))} placeholder="Parent or guardian" style={inputStyle} />
                    </FieldShell>
                  </div>
                  <div>
                    <FieldLabel>Progress Pace</FieldLabel>
                    <FieldShell>
                      <select value={editingStudentDraft.pace} onChange={(event) => setEditingStudentDraft((current) => ({ ...current, pace: event.target.value as StudentPace }))} style={inputStyle}>
                        <option value="Steady">Steady</option>
                        <option value="Fast Track">Fast Track</option>
                        <option value="Needs Support">Needs Support</option>
                      </select>
                    </FieldShell>
                  </div>
                  <div>
                    <FieldLabel>Status</FieldLabel>
                    <FieldShell>
                      <select value={editingStudentDraft.status} onChange={(event) => setEditingStudentDraft((current) => ({ ...current, status: event.target.value as "active" | "withdrawn" }))} style={inputStyle}>
                        <option value="active">Active</option>
                        <option value="withdrawn">Withdrawn</option>
                      </select>
                    </FieldShell>
                  </div>
                  <div className="student-management-full-span">
                    <FieldLabel>Coach Notes</FieldLabel>
                    <FieldShell>
                      <textarea value={editingStudentDraft.notes} onChange={(event) => setEditingStudentDraft((current) => ({ ...current, notes: event.target.value }))} placeholder="Add a quick note about confidence, support areas, or goals." style={textareaStyle} />
                    </FieldShell>
                  </div>
                  <div className="student-management-full-span" style={{ display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                    <p style={{ color: ADMIN_THEME.subtle, fontSize: "11px", lineHeight: 1.5, margin: 0 }}>
                      Changing the assigned cohort resets attendance to that cohort&apos;s schedule. Moving out of a cohort also clears report entries linked to the old cohort.
                    </p>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                      <ActionButton secondary type="button" onClick={() => setStudentModalMode("view")} style={{ minWidth: "132px" }}>
                        Back To Details
                      </ActionButton>
                      <ActionButton type="submit" style={{ minWidth: "154px" }}>
                        Save Changes
                      </ActionButton>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        ) : null}

        <Surface style={{ padding: "16px", alignSelf: "start" }}>
          <div style={{ display: "grid", gap: "10px", marginBottom: "10px" }}>
            <SectionTitle
              eyebrow="Student Desk"
              title="All Student Records"
              detail={
                normalizedStudentSearch
                  ? `${filteredStudents.length}/${totalStudents} shown`
                  : `${assignedCount} assigned · ${unassignedCount} not assigned`
              }
              titleStyle={{ fontSize: "24px" }}
            />

            <div style={{ display: "grid", gap: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                <p style={{ margin: 0, color: ADMIN_THEME.heading, fontSize: "12px", fontWeight: 800, textTransform: "uppercase" }}>Filters</p>
                <ActionButton secondary type="button" onClick={clearFilters} disabled={!hasActiveFilters} style={{ minHeight: "34px", minWidth: "124px" }}>
                  Clear All Filters
                </ActionButton>
              </div>

              <div style={{ display: "grid", gap: "6px" }}>
                <FieldLabel>Student Search</FieldLabel>
                <FieldShell>
                  <input
                    value={studentSearch}
                    onChange={(event) => setStudentSearch(event.target.value)}
                    placeholder="Search name, guardian, notes, or cohort"
                    style={inputStyle}
                  />
                </FieldShell>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "10px",
                }}
              >
                <div style={{ display: "grid", gap: "6px" }}>
                  <FieldLabel>Cohort Filter</FieldLabel>
                  <FieldShell>
                    <select value={assignmentFilter} onChange={(event) => setAssignmentFilter(event.target.value as AssignmentFilter)} style={inputStyle}>
                      <option value="all">All Students</option>
                      <option value="focused">{focusedCohort ? focusedCohort.name : "Selected Cohort"}</option>
                      <option value="unassigned">Not Assigned</option>
                    </select>
                  </FieldShell>
                </div>

                <div style={{ display: "grid", gap: "6px" }}>
                  <FieldLabel>Pace Filter</FieldLabel>
                  <FieldShell>
                    <select value={paceFilter} onChange={(event) => setPaceFilter(event.target.value as typeof paceFilter)} style={inputStyle}>
                      <option value="all">All Paces</option>
                      <option value="Steady">Steady</option>
                      <option value="Fast Track">Fast Track</option>
                      <option value="Needs Support">Needs Support</option>
                    </select>
                  </FieldShell>
                </div>

                <div style={{ display: "grid", gap: "6px" }}>
                  <FieldLabel>Status Filter</FieldLabel>
                  <FieldShell>
                    <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} style={inputStyle}>
                      <option value="all">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="withdrawn">Withdrawn</option>
                    </select>
                  </FieldShell>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gap: "6px" }}>
            {totalStudents === 0 ? (
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
                No students exist yet. Add the first student and either place them into a cohort now or leave them unassigned.
              </div>
            ) : filteredStudents.length === 0 ? (
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
                No students match the current search and filter combination.
              </div>
            ) : (
              filteredStudents.map((student) => {
                const studentStatus = student.status ?? "active";
                const isUnassigned = !student.cohortId;

                return (
                  <div
                    key={student.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleStudentEdit(student)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleStudentEdit(student);
                      }
                    }}
                    style={{
                      padding: "8px 10px",
                      borderRadius: "12px",
                      ...nestedCardStyle,
                      border: isUnassigned ? "1px solid rgba(245,158,11,0.28)" : nestedCardStyle.border,
                      backgroundColor: isUnassigned ? "rgba(245,158,11,0.08)" : nestedCardStyle.backgroundColor,
                      opacity: studentStatus === "withdrawn" ? 0.66 : 1,
                      cursor: "pointer",
                    }}
                  >
                    <div className="student-management-list-row">
                      <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap", minWidth: 0 }}>
                        <h4 style={{ color: ADMIN_THEME.heading, fontSize: "14px", fontFamily: "var(--font-body)", fontStyle: "italic", fontWeight: 800, margin: 0, minWidth: 0 }}>
                          {student.name}
                        </h4>
                        <span
                          style={{
                            padding: "3px 7px",
                            borderRadius: "999px",
                            border: isUnassigned ? "1px solid rgba(245,158,11,0.22)" : `1px solid ${ADMIN_THEME.border}`,
                            backgroundColor: isUnassigned ? "rgba(245,158,11,0.12)" : ADMIN_THEME.surface,
                            color: isUnassigned ? "#9D6100" : ADMIN_THEME.subtle,
                            fontSize: "9px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                          }}
                        >
                          {student.cohortName}
                        </span>
                        {studentStatus === "withdrawn" ? (
                          <span style={{ padding: "3px 7px", borderRadius: "999px", backgroundColor: ADMIN_THEME.surfaceSoft, border: `1px solid ${ADMIN_THEME.border}`, color: ADMIN_THEME.subtle, fontSize: "9px", fontWeight: 700, textTransform: "uppercase" }}>
                            Withdrawn
                          </span>
                        ) : null}
                      </div>

                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                        <button
                          type="button"
                          aria-label={`Open ${student.name} profile`}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleStudentEdit(student);
                          }}
                          style={{
                            width: "26px",
                            height: "26px",
                            borderRadius: "999px",
                            border: `1px solid ${ADMIN_THEME.border}`,
                            backgroundColor: ADMIN_THEME.surface,
                            color: ADMIN_THEME.heading,
                            display: "grid",
                            placeItems: "center",
                            cursor: "pointer",
                            flexShrink: 0,
                          }}
                        >
                          <User size={12} />
                        </button>
                        <span style={{ padding: "3px 7px", borderRadius: "999px", backgroundColor: ADMIN_THEME.accentBg, border: `1px solid ${ADMIN_THEME.accentBorder}`, color: ADMIN_THEME.accent, fontSize: "9px", fontWeight: 700, textTransform: "uppercase" }}>
                          {student.reportCount} report{student.reportCount === 1 ? "" : "s"}
                        </span>
                        {onOpenReports && student.cohortId ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              onOpenReports(student.cohortId as string, student.id);
                            }}
                            style={{
                              minHeight: "26px",
                              padding: "0 8px",
                              borderRadius: "999px",
                              border: `1px solid ${ADMIN_THEME.border}`,
                              backgroundColor: ADMIN_THEME.surface,
                              color: ADMIN_THEME.heading,
                              fontSize: "9px",
                              fontWeight: 800,
                              textTransform: "uppercase",
                              cursor: "pointer",
                            }}
                          >
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                              <FileText size={11} /> Progress
                            </span>
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Surface>
      </div>
    </>
  );
}

export const AdminCohortManagementPage = AdminStudentManagementPage;
