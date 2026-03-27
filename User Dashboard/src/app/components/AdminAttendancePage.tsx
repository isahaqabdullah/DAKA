import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { ArrowLeft, Check, Clock3, MoreHorizontal, Search, X } from "lucide-react";
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
}

export function AdminAttendancePage({
  initialCohortId,
  initialClassId,
  onBackToDashboard,
  allowCohortSwitch = true,
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

  if (!selectedCohort) {
    return null;
  }

  const selectedClass =
    selectedCohort.classes.find((session) => session.id === selectedClassId) ?? selectedCohort.classes[0];
  const sortedClasses = [...selectedCohort.classes].sort(
    (left, right) => getSessionTimestamp(right.date, right.time) - getSessionTimestamp(left.date, left.time),
  );

  const attendanceCounts = selectedCohort.students.reduce(
    (counts, student) => {
      const state = mapAttendanceState(selectedClass ? student.attendance[selectedClass.id] : undefined);
      counts[state] += 1;
      return counts;
    },
    { present: 0, late: 0, absent: 0, pending: 0 },
  );

  const visibleStudents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return selectedCohort.students.filter((student) => {
      const state = mapAttendanceState(selectedClass ? student.attendance[selectedClass.id] : undefined);
      const matchesQuery = !query || student.name.toLowerCase().includes(query);
      const matchesFilter = statusFilter === "all" || state === statusFilter;
      return matchesQuery && matchesFilter;
    });
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
      students: cohort.students.map((student) => ({
        ...student,
        attendance: {
          ...student.attendance,
          [selectedClassId]: nextState,
        },
      })),
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
        <div style={{ padding: "29px 29px 0" }}>
          <div
            style={{
              display: "grid",
              gap: "24px",
              padding: "28px",
              borderRadius: "22px",
              border: `1px solid ${ADMIN_THEME.border}`,
              background:
                "radial-gradient(circle at top right, rgba(200,52,46,0.08), transparent 28%), linear-gradient(180deg, #FFFFFF 0%, #FBF8F4 100%)",
              boxShadow: "0 18px 42px rgba(70,46,25,0.08)",
            }}
          >
            <div style={{ display: "grid", gap: "10px" }}>
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <ActionButton
                  onClick={() => {
                    if (onBackToDashboard) {
                      onBackToDashboard();
                      return;
                    }

                    window.location.hash = "#admin";
                  }}
                  style={{ minWidth: "188px" }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                    <ArrowLeft size={16} /> Back To Dashboard
                  </span>
                </ActionButton>
              </div>
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
                <h2
                  style={{
                    color: ADMIN_THEME.heading,
                    fontSize: "32px",
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

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "18px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
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
                    border: `1px solid ${ADMIN_THEME.inputBorder}`,
                    backgroundColor: ADMIN_THEME.inputBg,
                    padding: "0 16px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <select
                    value={selectedCohortId}
                    onChange={(event) => {
                      setSelectedCohortId(event.target.value);
                      setSearchQuery("");
                      setStatusFilter("all");
                    }}
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
                    {cohorts.map((cohort) => (
                      <option key={cohort.id} value={cohort.id}>
                        {cohort.name}
                      </option>
                    ))}
                  </select>
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

            <p style={{ color: ADMIN_THEME.subtle, fontSize: "12px", lineHeight: 1.6, margin: "0 0 -4px 0" }}>
              {allowCohortSwitch
                ? "Switch cohorts and jump between upcoming or previous sessions here to review or adjust a specific attendance register."
                : "Jump between upcoming or previous sessions in this cohort to review or adjust the attendance register."}
            </p>

            <div
              style={{
                height: "48px",
                borderRadius: "14px",
                border: `1px solid ${ADMIN_THEME.inputBorder}`,
                backgroundColor: ADMIN_THEME.inputBg,
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "0 16px",
              }}
            >
              <Search size={18} color={ADMIN_THEME.subtle} />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by student name..."
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: ADMIN_THEME.heading,
                  fontSize: "14px",
                  fontFamily: "var(--font-body)",
                }}
              />
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

            <div
              style={{
                minHeight: "152px",
                borderRadius: "14px",
                border: `1px solid ${ADMIN_THEME.accentBorder}`,
                background: ATTENDANCE_THEME.tipSurface,
                padding: "17px 21px",
                display: "grid",
                gap: "8px",
              }}
            >
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
                Quick Tips
              </p>
              {[
                "Click status buttons to mark attendance instantly",
                "Use search to quickly find specific students",
                "Click stat badges to filter by attendance status",
                "Use bulk actions to mark all students at once",
              ].map((tip) => (
                <p key={tip} style={{ color: ADMIN_THEME.muted, fontSize: "13px", lineHeight: 1.5, margin: 0 }}>
                  • {tip}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
