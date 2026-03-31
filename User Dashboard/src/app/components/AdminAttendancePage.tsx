import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { ArrowLeft, Check, ChevronDown, Clock3, MoreHorizontal, Search, X } from "lucide-react";
import {
  ActionButton,
  ADMIN_THEME,
  STORAGE_KEY,
  formatDateTime,
  loadCohorts,
  type Cohort,
} from "./AdminDashboard";

type AttendanceBucket = "present" | "late" | "absent" | "pending";
type AttendanceFilter = "all" | AttendanceBucket;

const ATTENDANCE_THEME = {
  tableSurface: "linear-gradient(180deg, #F5F0EA 0%, #EEE6DC 100%)",
  tableHeader: "#E9E0D6",
  tableStripe: "#F5F0EA",
  tableStripeAlt: "#EEE6DC",
  tableRowBorder: "rgba(43,31,22,0.08)",
  inactiveText: "#918378",
  pendingBg: "#F3EEE8",
  pendingText: "#7E7063",
  pendingBorder: "rgba(73,57,42,0.12)",
  tipSurface: "linear-gradient(180deg, rgba(200,52,46,0.08) 0%, rgba(255,255,255,0.96) 100%)",
} as const;

function getSessionTimestamp(date: string, time: string) {
  return new Date(`${date}T${time}:00`).getTime();
}

function getPreferredClassId(classes: Cohort["classes"], preferredClassId?: string) {
  if (preferredClassId && classes.some((session) => session.id === preferredClassId)) {
    return preferredClassId;
  }

  if (classes.length === 0) {
    return "";
  }

  const now = Date.now();
  const ordered = [...classes].sort((left, right) => getSessionTimestamp(left.date, left.time) - getSessionTimestamp(right.date, right.time));
  const nextSession = ordered.find((session) => getSessionTimestamp(session.date, session.time) >= now);

  return nextSession?.id ?? ordered[ordered.length - 1]?.id ?? "";
}

function mapAttendanceState(value?: string): AttendanceBucket {
  if (value === "present" || value === "absent" || value === "late") {
    return value;
  }

  return "pending";
}

function statusPillStyle(state: AttendanceBucket, active: boolean): CSSProperties {
  if (state === "present") {
    return {
      backgroundColor: "rgba(34,197,94,0.10)",
      border: "1px solid rgba(34,197,94,0.22)",
      color: "#247A44",
      boxShadow: active ? "0 0 0 1px rgba(34,197,94,0.12), 0 10px 22px rgba(34,197,94,0.08)" : "none",
    };
  }

  if (state === "late") {
    return {
      backgroundColor: "rgba(245,158,11,0.12)",
      border: "1px solid rgba(245,158,11,0.22)",
      color: "#9D6100",
      boxShadow: active ? "0 0 0 1px rgba(245,158,11,0.12), 0 10px 22px rgba(245,158,11,0.08)" : "none",
    };
  }

  if (state === "absent") {
    return {
      backgroundColor: "rgba(200,52,46,0.10)",
      border: "1px solid rgba(200,52,46,0.22)",
      color: "#B6332C",
      boxShadow: active ? "0 0 0 1px rgba(200,52,46,0.12), 0 10px 22px rgba(200,52,46,0.08)" : "none",
    };
  }

  return {
    backgroundColor: ATTENDANCE_THEME.pendingBg,
    border: `1px solid ${ATTENDANCE_THEME.pendingBorder}`,
    color: ATTENDANCE_THEME.pendingText,
    boxShadow: active ? "0 0 0 1px rgba(73,57,42,0.08), 0 10px 22px rgba(73,57,42,0.06)" : "none",
  };
}

function toggleButtonStyle(state: AttendanceBucket, active: boolean): CSSProperties {
  if (!active) {
    return {
      backgroundColor: ADMIN_THEME.surfaceSoft,
      border: `1px solid ${ADMIN_THEME.borderSoft}`,
      color: ATTENDANCE_THEME.inactiveText,
      boxShadow: "none",
    };
  }

  if (state === "present") {
    return {
      backgroundColor: "rgba(34,197,94,0.10)",
      border: "1px solid rgba(34,197,94,0.22)",
      color: "#247A44",
      boxShadow: "0 0 12px rgba(34,197,94,0.12)",
    };
  }

  if (state === "late") {
    return {
      backgroundColor: "rgba(245,158,11,0.12)",
      border: "1px solid rgba(245,158,11,0.22)",
      color: "#9D6100",
      boxShadow: "0 0 12px rgba(245,158,11,0.12)",
    };
  }

  if (state === "absent") {
    return {
      backgroundColor: "rgba(200,52,46,0.10)",
      border: "1px solid rgba(200,52,46,0.22)",
      color: "#B6332C",
      boxShadow: "0 0 12px rgba(200,52,46,0.12)",
    };
  }

  return {
    backgroundColor: ATTENDANCE_THEME.pendingBg,
    border: `1px solid ${ATTENDANCE_THEME.pendingBorder}`,
    color: ATTENDANCE_THEME.pendingText,
    boxShadow: "0 0 12px rgba(73,57,42,0.08)",
  };
}

interface AdminAttendancePageProps {
  initialCohortId?: string;
  initialClassId?: string;
  onBackToDashboard?: () => void;
  allowCohortSwitch?: boolean;
  onSelectionChange?: (context: { cohortId: string; classId: string }) => void;
}

export function AdminAttendancePage({
  initialCohortId,
  initialClassId,
  onBackToDashboard,
  allowCohortSwitch = true,
  onSelectionChange,
}: AdminAttendancePageProps) {
  const [cohorts, setCohorts] = useState<Cohort[]>(() => loadCohorts());
  const [selectedCohortId, setSelectedCohortId] = useState(() => initialCohortId ?? loadCohorts()[0]?.id ?? "");
  const [selectedClassId, setSelectedClassId] = useState(() => initialClassId ?? "");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AttendanceFilter>("all");

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cohorts));
  }, [cohorts]);

  useEffect(() => {
    if (initialCohortId && cohorts.some((cohort) => cohort.id === initialCohortId)) {
      setSelectedCohortId(initialCohortId);
    }
  }, [cohorts, initialCohortId]);

  const selectedCohort = cohorts.find((cohort) => cohort.id === selectedCohortId) ?? cohorts[0];

  useEffect(() => {
    setSearchQuery("");
    setStatusFilter("all");
  }, [selectedCohortId]);

  useEffect(() => {
    if (!selectedCohort) {
      return;
    }

    if (!cohorts.some((cohort) => cohort.id === selectedCohortId)) {
      setSelectedCohortId(selectedCohort.id);
      return;
    }

    const preferredClassId = getPreferredClassId(selectedCohort.classes, initialClassId);

    if (!selectedClassId || !selectedCohort.classes.some((session) => session.id === selectedClassId)) {
      setSelectedClassId(preferredClassId);
    }
  }, [cohorts, initialClassId, selectedCohort, selectedCohortId, selectedClassId]);

  useEffect(() => {
    if (!selectedCohort) {
      return;
    }

    onSelectionChange?.({
      cohortId: selectedCohort.id,
      classId: selectedClassId,
    });
  }, [onSelectionChange, selectedClassId, selectedCohort]);

  if (!selectedCohort) {
    return null;
  }

  const selectedClass =
    selectedCohort.classes.find((session) => session.id === selectedClassId) ?? selectedCohort.classes[0];
  const sortedClasses = [...selectedCohort.classes].sort(
    (left, right) => getSessionTimestamp(right.date, right.time) - getSessionTimestamp(left.date, left.time),
  );

  const activeStudents = selectedCohort.students.filter((student) => (student.status ?? "active") === "active");

  const attendanceCounts = activeStudents.reduce(
    (counts, student) => {
      const state = mapAttendanceState(selectedClass ? student.attendance[selectedClass.id] : undefined);
      counts[state] += 1;
      return counts;
    },
    { present: 0, late: 0, absent: 0, pending: 0 },
  );

  const visibleStudents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return activeStudents.filter((student) => {
      const state = mapAttendanceState(selectedClass ? student.attendance[selectedClass.id] : undefined);
      const matchesQuery = !query || student.name.toLowerCase().includes(query);
      const matchesFilter = statusFilter === "all" || state === statusFilter;
      return matchesQuery && matchesFilter;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedClass, selectedCohort.students, statusFilter]);

  function updateSelectedCohort(mutator: (cohort: Cohort) => Cohort) {
    setCohorts((current) =>
      current.map((cohort) => (cohort.id === selectedCohort.id ? mutator(cohort) : cohort)),
    );
  }

  function setAttendance(studentId: string, nextState: AttendanceBucket) {
    if (!selectedClassId) {
      return;
    }

    updateSelectedCohort((cohort) => ({
      ...cohort,
      students: cohort.students.map((student) =>
        student.id === studentId
          ? {
              ...student,
              attendance: {
                ...student.attendance,
                [selectedClassId]: nextState,
              },
            }
          : student,
      ),
    }));
  }

  function bulkSetAttendance(nextState: AttendanceBucket) {
    if (!selectedClassId) {
      return;
    }

    updateSelectedCohort((cohort) => ({
      ...cohort,
      students: cohort.students.map((student) => {
        if ((student.status ?? "active") !== "active") {
          return student;
        }
        return {
          ...student,
          attendance: {
            ...student.attendance,
            [selectedClassId]: nextState,
          },
        };
      }),
    }));
  }

  const tableGridColumns = "42px minmax(260px, 1fr) 70px 70px 70px 78px";
  const sessionControlGridColumns = allowCohortSwitch ? "repeat(2, minmax(0, 1fr))" : "minmax(0, 1fr)";

  return (
    <>
      <style>{`
        .attendance-table-row {
          display: grid;
          grid-template-columns: ${tableGridColumns};
          gap: 8px;
          align-items: center;
          min-height: 35px;
          padding: 4px 14px 5px;
        }
        @media (max-width: 920px) {
          .attendance-table-shell {
            overflow-x: auto;
          }
          .attendance-table-inner {
            min-width: 760px;
          }
          .attendance-session-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div
        style={{
          width: "100%",
          display: "grid",
          gap: "24px",
          color: ADMIN_THEME.heading,
          padding: "0 0 28px",
        }}
      >
        <div>
          <div
            style={{
              display: "grid",
              gap: "18px",
              padding: "22px",
              borderRadius: "22px",
              border: `1px solid ${ADMIN_THEME.border}`,
              background:
                "radial-gradient(circle at top right, rgba(200,52,46,0.08), transparent 28%), linear-gradient(180deg, #FFFFFF 0%, #FBF8F4 100%)",
              boxShadow: "0 18px 42px rgba(70,46,25,0.08)",
            }}
          >
            <div style={{ display: "grid", gap: "10px" }}>
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", flexWrap: "wrap" }}>
                  {onBackToDashboard ? (
                    <button
                      type="button"
                      onClick={onBackToDashboard}
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
                  <div>
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
                  </div>
                </div>
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
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                <div
                  style={{
                    height: "46px",
                    borderRadius: "999px",
                    border: `1px solid ${ADMIN_THEME.inputBorder}`,
                    backgroundColor: ADMIN_THEME.inputBg,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "0 14px",
                    minWidth: "190px",
                  }}
                >
                  <Search size={15} color={ADMIN_THEME.subtle} />
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search student..."
                    style={{
                      flex: 1,
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      color: ADMIN_THEME.heading,
                      fontSize: "13px",
                      fontFamily: "var(--font-body)",
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  style={{
                    height: "46px",
                    padding: "0 13px",
                    borderRadius: "999px",
                    fontSize: "11px",
                    fontFamily: "var(--font-body)",
                    letterSpacing: "0px",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    backgroundColor: statusFilter === "all" ? ADMIN_THEME.surfaceSoft : ADMIN_THEME.inputBg,
                    border: `1px solid ${statusFilter === "all" ? ADMIN_THEME.border : ADMIN_THEME.inputBorder}`,
                    color: statusFilter === "all" ? ADMIN_THEME.heading : ADMIN_THEME.subtle,
                    fontWeight: statusFilter === "all" ? 800 : 600,
                  }}
                >
                  All {attendanceCounts.present + attendanceCounts.late + attendanceCounts.absent + attendanceCounts.pending}
                </button>
                {([
                  { id: "present", label: "Present", count: attendanceCounts.present },
                  { id: "late", label: "Late", count: attendanceCounts.late },
                  { id: "absent", label: "Absent", count: attendanceCounts.absent },
                  { id: "pending", label: "Pending", count: attendanceCounts.pending },
                ] as const).map((item) => {
                  const filterActive = statusFilter === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setStatusFilter((current) => (current === item.id ? "all" : item.id))}
                      style={{
                        height: "46px",
                        padding: "0 13px",
                        borderRadius: "999px",
                        fontSize: "11px",
                        fontFamily: "var(--font-body)",
                        letterSpacing: "0px",
                        textTransform: "uppercase",
                        cursor: "pointer",
                        ...statusPillStyle(item.id, filterActive),
                      }}
                    >
                      {item.label} {item.count}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <ActionButton secondary onClick={() => bulkSetAttendance("present")} style={{ minWidth: "164px" }}>
                  Mark All Present
                </ActionButton>
                <ActionButton secondary onClick={() => bulkSetAttendance("absent")} style={{ minWidth: "156px" }}>
                  Mark All Absent
                </ActionButton>
              </div>
            </div>

            <div className="attendance-session-grid" style={{ display: "grid", gridTemplateColumns: sessionControlGridColumns, gap: "12px" }}>
              {allowCohortSwitch ? (
                <div
                  style={{
                    minHeight: "48px",
                    borderRadius: "14px",
                    border: `1px solid ${ADMIN_THEME.accentBorder}`,
                    background: "linear-gradient(180deg, rgba(200,52,46,0.10) 0%, rgba(255,255,255,0.96) 100%)",
                    boxShadow: "0 12px 24px rgba(200,52,46,0.10), inset 0 1px 0 rgba(255,255,255,0.76)",
                    position: "relative",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      left: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      padding: "4px 8px",
                      borderRadius: "999px",
                      border: `1px solid ${ADMIN_THEME.accentBorder}`,
                      backgroundColor: ADMIN_THEME.accentBg,
                      color: ADMIN_THEME.accent,
                      fontSize: "9px",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      pointerEvents: "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Cohort
                  </span>
                  <select
                    value={selectedCohortId}
                    onChange={(event) => {
                      setSelectedCohortId(event.target.value);
                      setSearchQuery("");
                      setStatusFilter("all");
                    }}
                    style={{
                      width: "100%",
                      height: "48px",
                      padding: "0 40px 0 84px",
                      borderRadius: "14px",
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      color: ADMIN_THEME.heading,
                      fontSize: "13px",
                      fontFamily: "var(--font-body)",
                      fontWeight: 800,
                      cursor: "pointer",
                      appearance: "none",
                    }}
                  >
                    {cohorts.map((cohort) => (
                      <option key={cohort.id} value={cohort.id}>
                        {cohort.name}
                      </option>
                    ))}
                  </select>
                  <span
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: ADMIN_THEME.accent,
                      pointerEvents: "none",
                      display: "inline-flex",
                    }}
                  >
                    <ChevronDown size={16} />
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    minHeight: "48px",
                    borderRadius: "14px",
                    border: `1px solid ${ADMIN_THEME.inputBorder}`,
                    backgroundColor: ADMIN_THEME.inputBg,
                    padding: "10px 16px",
                    display: "grid",
                    alignContent: "center",
                    gap: "2px",
                  }}
                >
                  <span
                    style={{
                      color: ADMIN_THEME.subtle,
                      fontSize: "10px",
                      fontWeight: 700,
                      letterSpacing: "0px",
                      textTransform: "uppercase",
                    }}
                  >
                    Selected Cohort
                  </span>
                  <span style={{ color: ADMIN_THEME.heading, fontSize: "14px", fontWeight: 700 }}>
                    {selectedCohort.name}
                  </span>
                </div>
              )}

              <div
                style={{
                  minHeight: "48px",
                  borderRadius: "14px",
                  border: `1px solid ${ADMIN_THEME.inputBorder}`,
                  backgroundColor: ADMIN_THEME.inputBg,
                  padding: "0 16px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <select
                  value={selectedClassId}
                  onChange={(event) => setSelectedClassId(event.target.value)}
                  style={{
                    width: "100%",
                    height: "46px",
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: ADMIN_THEME.heading,
                    fontSize: "14px",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {sortedClasses.map((session) => {
                    const sessionTime = getSessionTimestamp(session.date, session.time);
                    const sessionLabel = sessionTime >= Date.now() ? "Upcoming" : "Previous";

                    return (
                      <option key={session.id} value={session.id}>
                        {sessionLabel} · {formatDateTime(session.date, session.time)} · {session.topic}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div
              className="attendance-table-shell"
              style={{
                borderRadius: "18px",
                border: `1px solid ${ADMIN_THEME.border}`,
                background: ATTENDANCE_THEME.tableSurface,
                overflow: "hidden",
                boxShadow: "0 18px 42px rgba(70,46,25,0.08)",
              }}
            >
              <div className="attendance-table-inner">
                <div
                  className="attendance-table-row"
                  style={{
                    backgroundColor: ATTENDANCE_THEME.tableHeader,
                    borderBottom: `1px solid ${ADMIN_THEME.border}`,
                    paddingTop: "6px",
                    paddingBottom: "7px",
                    minHeight: "27px",
                  }}
                >
                  <p style={{ color: ADMIN_THEME.subtle, fontSize: "9px", fontWeight: 700, letterSpacing: "0px", textTransform: "uppercase", margin: 0, textAlign: "center" }}>#</p>
                  <p style={{ color: ADMIN_THEME.subtle, fontSize: "9px", fontWeight: 700, letterSpacing: "0px", textTransform: "uppercase", margin: 0 }}>Student Name</p>
                  <p style={{ color: ADMIN_THEME.subtle, fontSize: "9px", fontWeight: 700, letterSpacing: "0px", textTransform: "uppercase", margin: 0, textAlign: "center" }}>Present</p>
                  <p style={{ color: ADMIN_THEME.subtle, fontSize: "9px", fontWeight: 700, letterSpacing: "0px", textTransform: "uppercase", margin: 0, textAlign: "center" }}>Late</p>
                  <p style={{ color: ADMIN_THEME.subtle, fontSize: "9px", fontWeight: 700, letterSpacing: "0px", textTransform: "uppercase", margin: 0, textAlign: "center" }}>Absent</p>
                  <p style={{ color: ADMIN_THEME.subtle, fontSize: "9px", fontWeight: 700, letterSpacing: "0px", textTransform: "uppercase", margin: 0, textAlign: "center" }}>Pending</p>
                </div>

                <div
                  style={{
                    minHeight: "600px",
                    maxHeight: "600px",
                    overflowY: "auto",
                    backgroundColor: ADMIN_THEME.inputBg,
                  }}
                >
                  {visibleStudents.length === 0 ? (
                    <div
                      style={{
                        minHeight: "600px",
                        display: "grid",
                        placeItems: "center",
                        color: ADMIN_THEME.subtle,
                        fontSize: "14px",
                      }}
                    >
                      No students match the current search or filter.
                    </div>
                  ) : (
                    visibleStudents.map((student, index) => {
                      const state = mapAttendanceState(selectedClass ? student.attendance[selectedClass.id] : undefined);

                      return (
                        <div
                          key={student.id}
                          className="attendance-table-row"
                          style={{
                            backgroundColor: index % 2 === 0 ? ATTENDANCE_THEME.tableStripe : ATTENDANCE_THEME.tableStripeAlt,
                            borderBottom: `1px solid ${ATTENDANCE_THEME.tableRowBorder}`,
                          }}
                        >
                          <p style={{ color: ADMIN_THEME.subtle, fontSize: "11px", margin: 0, textAlign: "center" }}>{index + 1}</p>
                          <p style={{ color: ADMIN_THEME.heading, fontSize: "13px", fontWeight: 700, margin: 0 }}>{student.name}</p>

                          {([
                            { id: "present", icon: <Check size={14} strokeWidth={2.5} /> },
                            { id: "late", icon: <Clock3 size={14} strokeWidth={2.5} /> },
                            { id: "absent", icon: <X size={14} strokeWidth={2.5} /> },
                            { id: "pending", icon: <MoreHorizontal size={14} strokeWidth={2.5} /> },
                          ] as const).map((option) => {
                            const active = state === option.id;

                            return (
                              <div key={option.id} style={{ display: "flex", justifyContent: "center" }}>
                                <button
                                  type="button"
                                  onClick={() => setAttendance(student.id, option.id)}
                                  aria-label={`Mark ${student.name} as ${option.id}`}
                                  style={{
                                    width: "26px",
                                    height: "26px",
                                    borderRadius: "6px",
                                    display: "grid",
                                    placeItems: "center",
                                    cursor: "pointer",
                                    ...toggleButtonStyle(option.id, active),
                                  }}
                                >
                                  {active ? option.icon : null}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })
                  )}
                </div>

                <div
                  style={{
                    height: "29px",
                    padding: "7px 14px 0",
                    borderTop: `1px solid ${ADMIN_THEME.border}`,
                    backgroundColor: ADMIN_THEME.surfaceSoft,
                  }}
                >
                  <p
                    style={{
                      color: ADMIN_THEME.subtle,
                      fontSize: "11px",
                      letterSpacing: "0px",
                      textTransform: "uppercase",
                      margin: 0,
                    }}
                  >
                    Showing {visibleStudents.length} of {selectedCohort.students.length} students
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
