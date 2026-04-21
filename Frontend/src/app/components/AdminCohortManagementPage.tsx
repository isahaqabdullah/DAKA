import { useEffect, useMemo, useState, type FormEvent } from "react";
import { User, UserPlus } from "lucide-react";
import type { Cohort, StudentGender, StudentPace, StudentRecord } from "../types";
import { T, paceTone } from "../theme";
import { createId } from "../utils";
import { loadCohorts, loadUnassignedStudents, saveUnassignedStudents, STORAGE_KEY } from "../storage";
import {
  Btn, Drawer, EmptyState, FilterBar, FormField, FormGrid, InlineSelect, PageHeader,
  SearchInput, StatusChip, Surface, TableHeader, TableRow, TableShell, Td, Th,
  inputStyle, textareaStyle,
} from "./shared";

type AssignmentFilter = "all" | "cohort" | "unassigned";

interface StudentRow extends StudentRecord {
  cohortId?: string;
  cohortName: string;
  reportCount: number;
  totalClasses: number;
}

function attendanceRate(student: StudentRecord, totalClasses: number): string {
  if (totalClasses === 0) return "—";
  const tracked = Object.values(student.attendance).filter((state) => state !== "pending").length;
  return `${tracked}/${totalClasses}`;
}

function emptyDraft(cohortId = "") {
  return {
    name: "",
    age: "",
    dateOfBirth: "",
    gender: "" as StudentGender | "",
    guardian: "",
    guardianPhone: "",
    guardianEmail: "",
    emergencyContact: "",
    emergencyPhone: "",
    medicalNotes: "",
    experience: "",
    pace: "Steady" as StudentPace,
    notes: "",
    status: "active" as "active" | "withdrawn",
    assignedCohortId: cohortId,
  };
}

function buildDraft(student: StudentRow) {
  return {
    name: student.name,
    age: student.age,
    dateOfBirth: student.dateOfBirth ?? "",
    gender: (student.gender ?? "") as StudentGender | "",
    guardian: student.guardian,
    guardianPhone: student.guardianPhone ?? "",
    guardianEmail: student.guardianEmail ?? "",
    emergencyContact: student.emergencyContact ?? "",
    emergencyPhone: student.emergencyPhone ?? "",
    medicalNotes: student.medicalNotes ?? "",
    experience: student.experience ?? "",
    pace: student.pace,
    notes: student.notes,
    status: student.status ?? "active",
    assignedCohortId: student.cohortId ?? "",
  };
}

interface Props {
  initialCohortId?: string;
  onSelectCohort?: (id: string) => void;
  onOpenReports?: (cohortId: string, studentId?: string) => void;
}

export function AdminStudentsPage({ initialCohortId, onSelectCohort, onOpenReports }: Props) {
  const [cohorts, setCohorts] = useState<Cohort[]>(() => loadCohorts());
  const [unassigned, setUnassigned] = useState<StudentRecord[]>(() => loadUnassignedStudents());
  const [selectedCohortId, setSelectedCohortId] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "withdrawn">("all");
  const [paceFilter, setPaceFilter] = useState<"all" | StudentPace>("all");
  const [assignFilter, setAssignFilter] = useState<AssignmentFilter>("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(() => emptyDraft(selectedCohortId));

  const activeCohorts = cohorts.filter((cohort) => !cohort.archived);
  void initialCohortId;

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cohorts));
  }, [cohorts]);

  useEffect(() => {
    saveUnassignedStudents(unassigned);
  }, [unassigned]);

  const allStudents: StudentRow[] = useMemo(() => {
    const rows: StudentRow[] = [];
    for (const cohort of activeCohorts) {
      for (const student of cohort.students) {
        rows.push({
          ...student,
          cohortId: cohort.id,
          cohortName: cohort.name,
          reportCount: cohort.reports.filter((report) => report.studentId === student.id).length,
          totalClasses: cohort.classes.length,
        });
      }
    }
    for (const student of unassigned) {
      rows.push({ ...student, cohortId: undefined, cohortName: "Unassigned", reportCount: 0, totalClasses: 0 });
    }
    return rows;
  }, [activeCohorts, unassigned]);

  const visibleStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return allStudents.filter((student) => {
      if (query && !student.name.toLowerCase().includes(query)) return false;
      if (statusFilter !== "all" && (student.status ?? "active") !== statusFilter) return false;
      if (paceFilter !== "all" && student.pace !== paceFilter) return false;
      if (assignFilter === "cohort" && selectedCohortId && student.cohortId !== selectedCohortId) return false;
      if (assignFilter === "unassigned" && student.cohortId) return false;
      if (assignFilter === "all" && selectedCohortId && student.cohortId !== selectedCohortId && student.cohortId !== undefined) return false;
      return true;
    });
  }, [allStudents, assignFilter, paceFilter, search, selectedCohortId, statusFilter]);

  function selectCohort(id: string) {
    setSelectedCohortId(id);
    onSelectCohort?.(id);
  }

  function openAdd() {
    setEditingId(null);
    setDraft(emptyDraft(selectedCohortId));
    setDrawerOpen(true);
  }

  function openEdit(student: StudentRow) {
    setEditingId(student.id);
    setDraft(buildDraft(student));
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setEditingId(null);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!draft.name.trim()) return;

    if (editingId) {
      const currentStudent = allStudents.find((student) => student.id === editingId);
      if (!currentStudent) return;

      const updatedStudent: Partial<StudentRecord> = {
        name: draft.name.trim(),
        age: draft.age.trim() || "TBC",
        dateOfBirth: draft.dateOfBirth || undefined,
        gender: draft.gender || undefined,
        guardian: draft.guardian.trim() || "Pending",
        guardianPhone: draft.guardianPhone || undefined,
        guardianEmail: draft.guardianEmail || undefined,
        emergencyContact: draft.emergencyContact || undefined,
        emergencyPhone: draft.emergencyPhone || undefined,
        medicalNotes: draft.medicalNotes || undefined,
        experience: draft.experience || undefined,
        pace: draft.pace,
        notes: draft.notes.trim(),
        status: draft.status,
      };

      if (draft.assignedCohortId !== (currentStudent.cohortId ?? "")) {
        if (currentStudent.cohortId) {
          setCohorts((current) => current.map((cohort) => cohort.id === currentStudent.cohortId ? { ...cohort, students: cohort.students.filter((student) => student.id !== editingId) } : cohort));
        } else {
          setUnassigned((current) => current.filter((student) => student.id !== editingId));
        }

        if (draft.assignedCohortId) {
          setCohorts((current) => current.map((cohort) => {
            if (cohort.id !== draft.assignedCohortId) return cohort;
            const attendance = cohort.classes.reduce<Record<string, StudentRecord["attendance"][string]>>((map, klass) => {
              map[klass.id] = currentStudent.attendance[klass.id] ?? "pending";
              return map;
            }, {});
            return { ...cohort, students: [...cohort.students, { ...currentStudent, ...updatedStudent, attendance }] };
          }));
        } else {
          setUnassigned((current) => [...current, { ...currentStudent, ...updatedStudent }]);
        }
      } else if (currentStudent.cohortId) {
        setCohorts((current) => current.map((cohort) => cohort.id === currentStudent.cohortId ? { ...cohort, students: cohort.students.map((student) => student.id === editingId ? { ...student, ...updatedStudent } : student) } : cohort));
      } else {
        setUnassigned((current) => current.map((student) => student.id === editingId ? { ...student, ...updatedStudent } : student));
      }
    } else {
      const newId = createId("student");
      const newStudent: StudentRecord = {
        id: newId,
        name: draft.name.trim(),
        age: draft.age.trim() || "TBC",
        dateOfBirth: draft.dateOfBirth || undefined,
        gender: draft.gender || undefined,
        guardian: draft.guardian.trim() || "Pending",
        guardianPhone: draft.guardianPhone || undefined,
        guardianEmail: draft.guardianEmail || undefined,
        emergencyContact: draft.emergencyContact || undefined,
        emergencyPhone: draft.emergencyPhone || undefined,
        medicalNotes: draft.medicalNotes || undefined,
        experience: draft.experience || undefined,
        pace: draft.pace,
        notes: draft.notes.trim(),
        attendance: {},
        status: draft.status,
        enrolledAt: new Date().toISOString(),
      };

      if (draft.assignedCohortId) {
        setCohorts((current) => current.map((cohort) => {
          if (cohort.id !== draft.assignedCohortId) return cohort;
          const attendance = cohort.classes.reduce<Record<string, StudentRecord["attendance"][string]>>((map, klass) => {
            map[klass.id] = "pending";
            return map;
          }, {});
          return { ...cohort, students: [...cohort.students, { ...newStudent, attendance }] };
        }));
      } else {
        setUnassigned((current) => [...current, newStudent]);
      }
    }

    closeDrawer();
  }

  const cols = "minmax(220px,1.2fr) 72px 150px 120px 96px 92px 120px";
  const selectedCohort = activeCohorts.find((cohort) => cohort.id === selectedCohortId);
  const activeStudentCount = allStudents.filter((student) => (student.status ?? "active") === "active").length;
  const assignmentOptions = [
    { id: "all", label: "All Assignments", note: `${allStudents.length} total students` },
    { id: "cohort", label: "Selected Cohort", note: selectedCohort ? selectedCohort.name : "Active cohort scope" },
    { id: "unassigned", label: "Unassigned Only", note: `${unassigned.length} unassigned students` },
  ] as const;

  return (
    <div style={{ display: "grid", gap: T.space4 }}>
      <PageHeader title="Students">
        <StatusChip tone="success" label={`${activeStudentCount} active students`} />
        <StatusChip tone="neutral" label={`${unassigned.length} unassigned`} />
        {selectedCohort ? <StatusChip tone="neutral" label={`${selectedCohort.students.length} in cohort`} /> : <StatusChip tone="neutral" label={`${activeCohorts.length} cohorts`} />}
        <Btn size="large" onClick={openAdd}>
          <UserPlus size={15} />
          Add Student
        </Btn>
      </PageHeader>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search students" />
        <InlineSelect value={selectedCohortId} onChange={selectCohort} style={{ minWidth: "180px" }}>
          <option value="">All Cohorts</option>
          {activeCohorts.map((cohort) => (
            <option key={cohort.id} value={cohort.id}>
              {cohort.name}
            </option>
          ))}
        </InlineSelect>
        <InlineSelect value={assignFilter} onChange={(value) => setAssignFilter(value as AssignmentFilter)} style={{ minWidth: "190px" }}>
          {assignmentOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </InlineSelect>
        <InlineSelect value={statusFilter} onChange={(value) => setStatusFilter(value as "all" | "active" | "withdrawn")}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="withdrawn">Withdrawn</option>
        </InlineSelect>
        <InlineSelect value={paceFilter} onChange={(value) => setPaceFilter(value as "all" | StudentPace)}>
          <option value="all">All Pace</option>
          <option value="Steady">Steady</option>
          <option value="Fast Track">Fast Track</option>
          <option value="Needs Support">Needs Support</option>
        </InlineSelect>
      </FilterBar>

      <Surface style={{ padding: T.space5 }}>
        <div style={{ display: "grid", gap: T.space3 }}>
          <TableShell>
            <TableHeader columns={cols}>
              <Th>Name</Th>
              <Th>Age</Th>
              <Th>Cohort</Th>
              <Th>Pace</Th>
              <Th>Attendance</Th>
              <Th align="center">Reports</Th>
              <Th>Status</Th>
            </TableHeader>
            {visibleStudents.length === 0 ? (
              <EmptyState icon={<User size={20} />} title="No students found" action={<Btn onClick={openAdd}>Add Student</Btn>} />
            ) : (
              visibleStudents.map((student) => (
                <TableRow key={student.id} columns={cols} onClick={() => openEdit(student)}>
                  <Td bold>{student.name}</Td>
                  <Td muted>{student.age}</Td>
                  <Td muted>{student.cohortName}</Td>
                  <Td><StatusChip tone={paceTone(student.pace)} label={student.pace} /></Td>
                  <Td muted>{attendanceRate(student, student.totalClasses)}</Td>
                  <Td align="center" muted>{student.reportCount}</Td>
                  <Td><StatusChip tone={(student.status ?? "active") === "active" ? "success" : "danger"} label={(student.status ?? "active") === "active" ? "Active" : "Withdrawn"} /></Td>
                </TableRow>
              ))
            )}
            <div style={{ display: "flex", justifyContent: "space-between", gap: T.space3, alignItems: "center", padding: `${T.space3} ${T.space5}`, borderTop: `1px solid ${T.border}`, backgroundColor: T.surfaceSoft, flexWrap: "wrap" }}>
              <span style={{ color: T.subtle, fontSize: T.textSm }}>Showing {visibleStudents.length} of {allStudents.length} students</span>
              <span style={{ color: T.muted, fontSize: T.textSm, fontWeight: 600 }}>
                {selectedCohortId ? `Filtered to ${activeCohorts.find((cohort) => cohort.id === selectedCohortId)?.name ?? "selected cohort"}` : "All cohorts"}
              </span>
            </div>
          </TableShell>
        </div>
      </Surface>

      <Drawer
        open={drawerOpen}
        title={editingId ? "Edit Student" : "Add Student"}
        onClose={closeDrawer}
        footer={
          <>
            {editingId && draft.assignedCohortId && (
              <Btn variant="ghost" onClick={() => onOpenReports?.(draft.assignedCohortId, editingId)}>
                Open Student Progress
              </Btn>
            )}
            <div style={{ flex: 1 }} />
            <Btn variant="secondary" onClick={closeDrawer}>Cancel</Btn>
            <Btn type="submit" onClick={() => (document.getElementById("student-form") as HTMLFormElement | null)?.requestSubmit()}>
              {editingId ? "Save Changes" : "Add Student"}
            </Btn>
          </>
        }
      >
        <form id="student-form" onSubmit={handleSubmit} style={{ display: "grid", gap: T.space3 }}>
          <FormField label="Full Name">
            <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} style={inputStyle} required />
          </FormField>
          <FormGrid>
            <FormField label="Age">
              <input value={draft.age} onChange={(event) => setDraft({ ...draft, age: event.target.value })} style={inputStyle} />
            </FormField>
            <FormField label="Date of Birth">
              <input type="date" value={draft.dateOfBirth} onChange={(event) => setDraft({ ...draft, dateOfBirth: event.target.value })} style={inputStyle} />
            </FormField>
          </FormGrid>
          <FormField label="Gender">
            <select value={draft.gender} onChange={(event) => setDraft({ ...draft, gender: event.target.value as StudentGender | "" })} style={{ ...inputStyle, cursor: "pointer" }}>
              <option value="">—</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </FormField>
          <FormField label="Guardian">
            <input value={draft.guardian} onChange={(event) => setDraft({ ...draft, guardian: event.target.value })} style={inputStyle} />
          </FormField>
          <FormGrid>
            <FormField label="Guardian Phone">
              <input value={draft.guardianPhone} onChange={(event) => setDraft({ ...draft, guardianPhone: event.target.value })} style={inputStyle} />
            </FormField>
            <FormField label="Guardian Email">
              <input value={draft.guardianEmail} onChange={(event) => setDraft({ ...draft, guardianEmail: event.target.value })} style={inputStyle} />
            </FormField>
          </FormGrid>
          <FormGrid>
            <FormField label="Emergency Contact">
              <input value={draft.emergencyContact} onChange={(event) => setDraft({ ...draft, emergencyContact: event.target.value })} style={inputStyle} />
            </FormField>
            <FormField label="Emergency Phone">
              <input value={draft.emergencyPhone} onChange={(event) => setDraft({ ...draft, emergencyPhone: event.target.value })} style={inputStyle} />
            </FormField>
          </FormGrid>
          <FormField label="Medical Notes">
            <textarea value={draft.medicalNotes} onChange={(event) => setDraft({ ...draft, medicalNotes: event.target.value })} style={textareaStyle} />
          </FormField>
          <FormField label="Experience">
            <textarea value={draft.experience} onChange={(event) => setDraft({ ...draft, experience: event.target.value })} style={textareaStyle} />
          </FormField>
          <FormGrid>
            <FormField label="Pace">
              <select value={draft.pace} onChange={(event) => setDraft({ ...draft, pace: event.target.value as StudentPace })} style={{ ...inputStyle, cursor: "pointer" }}>
                <option value="Steady">Steady</option>
                <option value="Fast Track">Fast Track</option>
                <option value="Needs Support">Needs Support</option>
              </select>
            </FormField>
            <FormField label="Status">
              <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as "active" | "withdrawn" })} style={{ ...inputStyle, cursor: "pointer" }}>
                <option value="active">Active</option>
                <option value="withdrawn">Withdrawn</option>
              </select>
            </FormField>
          </FormGrid>
          <FormField label="Assign to Cohort">
            <select value={draft.assignedCohortId} onChange={(event) => setDraft({ ...draft, assignedCohortId: event.target.value })} style={{ ...inputStyle, cursor: "pointer" }}>
              <option value="">Unassigned</option>
              {activeCohorts.map((cohort) => (
                <option key={cohort.id} value={cohort.id}>
                  {cohort.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Notes">
            <textarea value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} style={textareaStyle} />
          </FormField>
        </form>
      </Drawer>
    </div>
  );
}
