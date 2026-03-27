import { useEffect, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  FileText,
  GraduationCap,
  Plus,
  Users,
} from "lucide-react";

export type AttendanceState = "pending" | "present" | "late" | "absent";
export type SyllabusStatus = "planned" | "live" | "complete";
export type StudentPace = "Steady" | "Fast Track" | "Needs Support";

export interface ScheduledClass {
  id: string;
  date: string;
  time: string;
  track: string;
  coach: string;
  topic: string;
}

export interface StudentRecord {
  id: string;
  name: string;
  age: string;
  guardian: string;
  pace: StudentPace;
  notes: string;
  attendance: Record<string, AttendanceState>;
}

export interface SyllabusItem {
  id: string;
  weekLabel: string;
  title: string;
  objective: string;
  status: SyllabusStatus;
}

export interface ReportEntry {
  id: string;
  studentId: string;
  title: string;
  summary: string;
  recommendation: string;
  createdAt: string;
}

export interface AnnouncementEntry {
  id: string;
  title: string;
  message: string;
  classId?: string;
  createdAt: string;
}

export interface Cohort {
  id: string;
  name: string;
  program: string;
  coach: string;
  cadence: string;
  capacity: number;
  room: string;
  students: StudentRecord[];
  syllabus: SyllabusItem[];
  classes: ScheduledClass[];
  reports: ReportEntry[];
  announcements: AnnouncementEntry[];
}

export const STORAGE_KEY = "daka-admin-dashboard-v1";

export const ADMIN_THEME = {
  surface: "#FFFFFF",
  surfaceSoft: "#F8F4EF",
  surfaceTint: "#FBF8F4",
  border: "rgba(43,31,22,0.10)",
  borderSoft: "rgba(43,31,22,0.06)",
  shadow: "0 18px 42px rgba(70,46,25,0.08)",
  shadowStrong: "0 24px 60px rgba(70,46,25,0.12)",
  text: "#201A15",
  heading: "#16120E",
  muted: "#6B5F55",
  subtle: "#918378",
  accent: "#C8342E",
  accentDeep: "#9E201C",
  accentBg: "rgba(200,52,46,0.08)",
  accentBorder: "rgba(200,52,46,0.18)",
  inputBg: "#F5F0EA",
  inputBorder: "rgba(43,31,22,0.10)",
} as const;

const ATTENDANCE_COLORS: Record<AttendanceState, { bg: string; text: string; border: string }> = {
  pending: { bg: "#F3EEE8", text: "#7E7063", border: "rgba(73,57,42,0.12)" },
  present: { bg: "rgba(34,197,94,0.10)", text: "#247A44", border: "rgba(34,197,94,0.22)" },
  late: { bg: "rgba(245,158,11,0.12)", text: "#9D6100", border: "rgba(245,158,11,0.22)" },
  absent: { bg: "rgba(200,52,46,0.10)", text: "#B6332C", border: "rgba(200,52,46,0.22)" },
};

const SYLLABUS_COLORS: Record<SyllabusStatus, { bg: string; text: string; border: string }> = {
  planned: { bg: "#F3EEE8", text: "#7E7063", border: "rgba(73,57,42,0.12)" },
  live: { bg: "rgba(200,52,46,0.10)", text: "#B6332C", border: "rgba(200,52,46,0.22)" },
  complete: { bg: "rgba(34,197,94,0.10)", text: "#247A44", border: "rgba(34,197,94,0.22)" },
};

const nestedCardStyle: CSSProperties = {
  border: `1px solid ${ADMIN_THEME.borderSoft}`,
  backgroundColor: ADMIN_THEME.surfaceSoft,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.75)",
};

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function formatDateTime(date: string, time: string) {
  const stamp = new Date(`${date}T${time}:00`);

  if (Number.isNaN(stamp.getTime())) {
    return `${date} · ${time}`;
  }

  const dayLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(stamp);
  const timeLabel = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(stamp);

  return `${dayLabel} at ${timeLabel}`;
}

function getSessionTimestamp(session: ScheduledClass) {
  return new Date(`${session.date}T${session.time}:00`).getTime();
}

function getPriorityClass(classes: ScheduledClass[]) {
  const ordered = [...classes].sort((left, right) => getSessionTimestamp(left) - getSessionTimestamp(right));
  const now = Date.now();

  return ordered.find((session) => getSessionTimestamp(session) >= now) ?? ordered[ordered.length - 1];
}

function normalizeCohort(cohort: Cohort): Cohort {
  return {
    ...cohort,
    announcements: Array.isArray(cohort.announcements)
      ? [...cohort.announcements].sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      : [],
  };
}

export function loadCohorts(): Cohort[] {
  if (typeof window === "undefined") {
    return createInitialCohorts();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return createInitialCohorts();
  }

  try {
    const parsed = JSON.parse(raw) as Cohort[];

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return createInitialCohorts();
    }

    return parsed.map((cohort) => normalizeCohort(cohort));
  } catch {
    return createInitialCohorts();
  }
}

function createInitialCohorts(): Cohort[] {
  const juniorClass1 = "junior-class-1";
  const juniorClass2 = "junior-class-2";
  const juniorClass3 = "junior-class-3";
  const advancedClass1 = "advanced-class-1";
  const advancedClass2 = "advanced-class-2";
  const advancedClass3 = "advanced-class-3";

  return [
    {
      id: "junior-thursday",
      name: "Juniors · Thursday",
      program: "Level 1 Beginner",
      coach: "Coach Kareem",
      cadence: "Thursday · 4:30 PM to 6:30 PM",
      capacity: 10,
      room: "Indoor Kartdrome",
      classes: [
        { id: juniorClass1, date: "2026-03-26", time: "16:30", track: "Indoor Clockwise", coach: "Coach Kareem", topic: "Braking points and steering reset" },
        { id: juniorClass2, date: "2026-04-02", time: "16:30", track: "Indoor Anti-CW", coach: "Coach Kareem", topic: "Wheel change and tyre pressure drill" },
        { id: juniorClass3, date: "2026-04-09", time: "16:30", track: "Indoor Clockwise", coach: "Coach Kareem", topic: "Race line repetition and consistency" },
      ],
      students: [
        {
          id: "student-sara",
          name: "Sara Al Mansoori",
          age: "10",
          guardian: "Noora Al Mansoori",
          pace: "Fast Track",
          notes: "Confident through sector two, still braking early into turn four.",
          attendance: { [juniorClass1]: "present", [juniorClass2]: "pending", [juniorClass3]: "pending" },
        },
        {
          id: "student-omar",
          name: "Omar Al Suwaidi",
          age: "11",
          guardian: "Hamad Al Suwaidi",
          pace: "Steady",
          notes: "Needs reminders on smooth steering inputs.",
          attendance: { [juniorClass1]: "late", [juniorClass2]: "pending", [juniorClass3]: "pending" },
        },
        {
          id: "student-mia",
          name: "Mia Fernandes",
          age: "9",
          guardian: "Carla Fernandes",
          pace: "Needs Support",
          notes: "Focus on braking confidence and exit vision.",
          attendance: { [juniorClass1]: "present", [juniorClass2]: "pending", [juniorClass3]: "pending" },
        },
      ],
      syllabus: [
        { id: "junior-syllabus-1", weekLabel: "Week 01", title: "Kart control basics", objective: "Build posture, braking reference points, and two clean racing lines.", status: "complete" },
        { id: "junior-syllabus-2", weekLabel: "Week 02", title: "Tyre and wheel workshop", objective: "Teach pressure checks, torque order, and safe pit handling.", status: "live" },
        { id: "junior-syllabus-3", weekLabel: "Week 03", title: "Track map memorisation", objective: "Link corner names to turn-in, apex, and exit cues.", status: "planned" },
      ],
      reports: [
        {
          id: "junior-report-1",
          studentId: "student-sara",
          title: "Week 1 progression report",
          summary: "Sara stayed composed in traffic and consistently hit the first apex without correction.",
          recommendation: "Push her into a faster reference group next week and add one overtaking drill.",
          createdAt: "2026-03-21T17:45:00.000Z",
        },
      ],
      announcements: [
        {
          id: "junior-announcement-1",
          title: "Tyre workshop prep",
          message: "Please arrive 10 minutes early with closed-toe shoes for the wheel change drill.",
          classId: juniorClass2,
          createdAt: "2026-03-25T12:00:00.000Z",
        },
      ],
    },
    {
      id: "advanced-tuesday",
      name: "Advanced · Tuesday",
      program: "Level 2 Advanced",
      coach: "Coach Yousuf",
      cadence: "Tuesday · 4:30 PM to 6:30 PM",
      capacity: 12,
      room: "Outdoor National Circuit",
      classes: [
        { id: advancedClass1, date: "2026-03-24", time: "16:30", track: "Outdoor Cadet", coach: "Coach Yousuf", topic: "Carburetor cleaning and refit" },
        { id: advancedClass2, date: "2026-03-31", time: "16:30", track: "Outdoor National", coach: "Coach Yousuf", topic: "Trail braking and rotating the kart" },
        { id: advancedClass3, date: "2026-04-07", time: "16:30", track: "Outdoor International", coach: "Coach Yousuf", topic: "Race starts and defensive positioning" },
      ],
      students: [
        {
          id: "student-ahmed",
          name: "Ahmed Al Karimi",
          age: "14",
          guardian: "Rashed Al Karimi",
          pace: "Fast Track",
          notes: "Already ready for national-layout consistency targets.",
          attendance: { [advancedClass1]: "pending", [advancedClass2]: "pending", [advancedClass3]: "pending" },
        },
        {
          id: "student-lina",
          name: "Lina Haddad",
          age: "15",
          guardian: "Mazen Haddad",
          pace: "Steady",
          notes: "Strong exits, needs cleaner defensive line discipline.",
          attendance: { [advancedClass1]: "pending", [advancedClass2]: "pending", [advancedClass3]: "pending" },
        },
        {
          id: "student-zayd",
          name: "Zayd Khan",
          age: "13",
          guardian: "Amina Khan",
          pace: "Needs Support",
          notes: "Confidence drops in high-speed sweepers.",
          attendance: { [advancedClass1]: "pending", [advancedClass2]: "pending", [advancedClass3]: "pending" },
        },
      ],
      syllabus: [
        { id: "advanced-syllabus-1", weekLabel: "Week 01", title: "Cadet mechanical prep", objective: "Strip, inspect, and reassemble the carburetor with supervision.", status: "live" },
        { id: "advanced-syllabus-2", weekLabel: "Week 02", title: "National circuit racecraft", objective: "Overlay braking map with overtaking windows and recovery lines.", status: "planned" },
        { id: "advanced-syllabus-3", weekLabel: "Week 03", title: "Outdoor progression block", objective: "Move from cadet to national layout with repeatable lap targets.", status: "planned" },
      ],
      reports: [],
      announcements: [
        {
          id: "advanced-announcement-1",
          title: "Outdoor setup note",
          message: "Bring hydration and arrive helmet-ready for the national circuit rotation block.",
          classId: advancedClass2,
          createdAt: "2026-03-24T11:15:00.000Z",
        },
      ],
    },
  ].map((cohort) => normalizeCohort(cohort));
}

export function Surface({
  children,
  accent,
  style,
}: {
  children: ReactNode;
  accent?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        background: accent
          ? "radial-gradient(circle at top right, rgba(200,52,46,0.14), transparent 34%), linear-gradient(135deg, #FFFFFF 0%, #F8F4EF 100%)"
          : "linear-gradient(180deg, #FFFFFF 0%, #FBF8F4 100%)",
        border: `1px solid ${accent ? ADMIN_THEME.accentBorder : ADMIN_THEME.border}`,
        borderRadius: "22px",
        boxShadow: accent ? ADMIN_THEME.shadowStrong : ADMIN_THEME.shadow,
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  detail,
  subdetail,
  titleStyle,
}: {
  eyebrow: string;
  title: string;
  detail?: string;
  subdetail?: string;
  titleStyle?: CSSProperties;
}) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <p
        style={{
          color: ADMIN_THEME.accent,
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0px",
          textTransform: "uppercase",
          margin: "0 0 6px 0",
        }}
      >
        {eyebrow}
      </p>
      {subdetail ? (
        <div style={{ display: "grid", gap: "12px" }}>
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
              ...titleStyle,
            }}
          >
            {title}
          </h2>
          <span
            style={{
              color: ADMIN_THEME.subtle,
              fontSize: "12px",
              letterSpacing: "0px",
              textTransform: "uppercase",
            }}
          >
            {subdetail}
          </span>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
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
              ...titleStyle,
            }}
          >
            {title}
          </h2>
          {detail ? (
            <span
              style={{
                color: ADMIN_THEME.subtle,
                fontSize: "12px",
                letterSpacing: "0px",
                textTransform: "uppercase",
              }}
            >
              {detail}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}

export function MetricCard({
  icon,
  label,
  value,
  note,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <Surface style={{ padding: "18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "14px" }}>
        <div>
          <p
            style={{
              color: ADMIN_THEME.subtle,
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0px",
              textTransform: "uppercase",
              margin: "0 0 8px 0",
            }}
          >
            {label}
          </p>
          <p
            style={{
              color: ADMIN_THEME.heading,
              fontSize: "30px",
              fontFamily: "var(--font-body)",
              fontWeight: 900,
              margin: "0 0 6px 0",
              lineHeight: 1,
            }}
          >
            {value}
          </p>
          <p style={{ color: ADMIN_THEME.muted, fontSize: "13px", margin: 0 }}>{note}</p>
        </div>
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "14px",
            border: `1px solid ${ADMIN_THEME.accentBorder}`,
            backgroundColor: ADMIN_THEME.accentBg,
            display: "grid",
            placeItems: "center",
            color: ADMIN_THEME.accent,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      </div>
    </Surface>
  );
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

export function ActionButton({
  children,
  secondary,
  type = "button",
  onClick,
  style,
}: {
  children: ReactNode;
  secondary?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
  style?: CSSProperties;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      style={{
        minHeight: "46px",
        borderRadius: "14px",
        padding: secondary ? "0 16px" : "0 18px",
        border: secondary ? `1px solid ${ADMIN_THEME.border}` : "none",
        background: secondary ? ADMIN_THEME.surfaceSoft : `linear-gradient(135deg, ${ADMIN_THEME.accent} 0%, ${ADMIN_THEME.accentDeep} 100%)`,
        color: secondary ? ADMIN_THEME.heading : "#FFFFFF",
        fontSize: "13px",
        fontFamily: "var(--font-body)",
        fontWeight: 800,
        letterSpacing: "0px",
        textTransform: "uppercase",
        cursor: "pointer",
        boxShadow: secondary ? "none" : "0 12px 24px rgba(200,52,46,0.18)",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function AdminDashboard({
  initialCohortId,
  onOpenAttendance,
  onBackToLanding,
}: {
  initialCohortId?: string;
  onOpenAttendance?: (context: { cohortId: string; classId: string }) => void;
  onBackToLanding?: () => void;
}) {
  const [cohorts, setCohorts] = useState<Cohort[]>(() => loadCohorts());
  const [selectedCohortId, setSelectedCohortId] = useState(() => initialCohortId ?? loadCohorts()[0]?.id ?? "");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [newStudent, setNewStudent] = useState({
    name: "",
    age: "",
    guardian: "",
    pace: "Steady" as StudentPace,
    notes: "",
  });
  const [newSyllabus, setNewSyllabus] = useState({
    weekLabel: "Week 04",
    title: "",
    objective: "",
    status: "planned" as SyllabusStatus,
  });
  const [newClass, setNewClass] = useState({
    date: "2026-04-14",
    time: "16:30",
    track: "",
    coach: "",
    topic: "",
  });
  const [newReport, setNewReport] = useState({
    studentId: "",
    title: "",
    summary: "",
    recommendation: "",
  });
  const [announcementDraft, setAnnouncementDraft] = useState("");

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

    setNewClass((current) => ({
      ...current,
      track: selectedCohort.room,
      coach: selectedCohort.coach,
    }));
  }, [selectedCohort?.id]);

  useEffect(() => {
    if (!selectedCohort) {
      return;
    }

    if (!selectedClassId || !selectedCohort.classes.some((session) => session.id === selectedClassId)) {
      setSelectedClassId(selectedCohort.classes[0]?.id ?? "");
    }

    setNewReport((current) => ({
      ...current,
      studentId:
        current.studentId && selectedCohort.students.some((student) => student.id === current.studentId)
          ? current.studentId
          : selectedCohort.students[0]?.id ?? "",
    }));
  }, [selectedClassId, selectedCohort]);

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

    if (!selectedCohort || !newStudent.name.trim()) {
      return;
    }

    const studentId = createId("student");
    const attendance = selectedCohort.classes.reduce<Record<string, AttendanceState>>((map, session) => {
      map[session.id] = "pending";
      return map;
    }, {});

    updateSelectedCohort((cohort) => ({
      ...cohort,
      students: [
        ...cohort.students,
        {
          id: studentId,
          name: newStudent.name.trim(),
          age: newStudent.age.trim() || "TBC",
          guardian: newStudent.guardian.trim() || "Pending",
          pace: newStudent.pace,
          notes: newStudent.notes.trim(),
          attendance,
        },
      ],
    }));

    setNewStudent({
      name: "",
      age: "",
      guardian: "",
      pace: "Steady",
      notes: "",
    });

    setNewReport((current) => ({
      ...current,
      studentId: current.studentId || studentId,
    }));
  }

  function handleSyllabusSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedCohort || !newSyllabus.title.trim()) {
      return;
    }

    updateSelectedCohort((cohort) => ({
      ...cohort,
      syllabus: [
        {
          id: createId("syllabus"),
          weekLabel: newSyllabus.weekLabel.trim() || `Week ${String(cohort.syllabus.length + 1).padStart(2, "0")}`,
          title: newSyllabus.title.trim(),
          objective: newSyllabus.objective.trim(),
          status: newSyllabus.status,
        },
        ...cohort.syllabus,
      ],
    }));

    setNewSyllabus({
      weekLabel: `Week ${String((selectedCohort.syllabus.length || 0) + 2).padStart(2, "0")}`,
      title: "",
      objective: "",
      status: "planned",
    });
  }

  function handleClassSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedCohort || !newClass.topic.trim() || !newClass.date || !newClass.time) {
      return;
    }

    const classId = createId("class");

    updateSelectedCohort((cohort) => ({
      ...cohort,
      classes: [
        ...cohort.classes,
        {
          id: classId,
          date: newClass.date,
          time: newClass.time,
          track: newClass.track.trim() || cohort.room,
          coach: newClass.coach.trim() || cohort.coach,
          topic: newClass.topic.trim(),
        },
      ].sort((left, right) => `${left.date}${left.time}`.localeCompare(`${right.date}${right.time}`)),
      students: cohort.students.map((student) => ({
        ...student,
        attendance: {
          ...student.attendance,
          [classId]: "pending",
        },
      })),
    }));

    setSelectedClassId(classId);
    setNewClass((current) => ({
      ...current,
      topic: "",
      date: current.date,
      time: current.time,
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

    setNewReport((current) => ({
      ...current,
      title: "",
      summary: "",
      recommendation: "",
    }));
  }

  function handleAnnouncementSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!announcementDraft.trim()) {
      return;
    }

    setAnnouncementDraft("");
  }

  function setAttendance(studentId: string, nextState: AttendanceState) {
    if (!selectedCohort || !selectedClassId) {
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
  const totalStudents = cohorts.reduce((count, cohort) => count + cohort.students.length, 0);
  const totalReports = cohorts.reduce((count, cohort) => count + cohort.reports.length, 0);
  const allClasses = cohorts
    .flatMap((cohort) => cohort.classes.map((session) => ({ ...session, cohortName: cohort.name })))
    .sort((left, right) => `${left.date}${left.time}`.localeCompare(`${right.date}${right.time}`));
  const nextClass = allClasses[0];
  const completedSyllabus = selectedCohort.syllabus.filter((item) => item.status === "complete").length;
  const occupiedSeats = `${selectedCohort.students.length}/${selectedCohort.capacity}`;
  const attendanceCounts = selectedCohort.students.reduce(
    (counts, student) => {
      const state = selectedClass ? student.attendance[selectedClass.id] ?? "pending" : "pending";
      counts[state] += 1;
      return counts;
    },
    { pending: 0, present: 0, late: 0, absent: 0 },
  );

  return (
    <>
      <style>{`
        .admin-grid {
          display: grid;
          grid-template-columns: minmax(280px, 320px) minmax(0, 1fr);
          gap: 22px;
        }
        .admin-metrics {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }
        .admin-two-up {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }
        .admin-three-up {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }
        .admin-stack {
          display: grid;
          gap: 18px;
        }
        .admin-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }
        .admin-full-span {
          grid-column: 1 / -1;
        }
        @media (max-width: 1120px) {
          .admin-grid,
          .admin-two-up,
          .admin-metrics,
          .admin-form-grid,
          .admin-three-up {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div style={{ display: "grid", gap: "22px" }}>
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

          <SectionTitle eyebrow="Admin Control" title="Academy Operations Deck" detail="DAKA internal dashboard" />

          <div style={{ display: "flex", justifyContent: "space-between", gap: "18px", flexWrap: "wrap", position: "relative" }}>
            <div style={{ maxWidth: "760px" }}>
              <p style={{ color: ADMIN_THEME.muted, fontSize: "16px", lineHeight: 1.7, margin: "0 0 18px 0" }}>
                Manage cohorts, shape the syllabus, schedule sessions, track attendance, and log coaching reports from one desktop view without breaking the existing DAKA visual language.
              </p>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <span style={{ padding: "8px 12px", borderRadius: "999px", border: `1px solid ${ADMIN_THEME.accentBorder}`, backgroundColor: ADMIN_THEME.accentBg, color: ADMIN_THEME.accent, fontSize: "12px", letterSpacing: "0px", textTransform: "uppercase" }}>
                  Cohort control
                </span>
                <span style={{ padding: "8px 12px", borderRadius: "999px", border: `1px solid ${ADMIN_THEME.border}`, backgroundColor: ADMIN_THEME.surfaceSoft, color: ADMIN_THEME.muted, fontSize: "12px", letterSpacing: "0px", textTransform: "uppercase" }}>
                  Live attendance
                </span>
                <span style={{ padding: "8px 12px", borderRadius: "999px", border: `1px solid ${ADMIN_THEME.border}`, backgroundColor: ADMIN_THEME.surfaceSoft, color: ADMIN_THEME.muted, fontSize: "12px", letterSpacing: "0px", textTransform: "uppercase" }}>
                  Coach reporting
                </span>
              </div>
            </div>

            <div
              style={{
                minWidth: "250px",
                padding: "18px",
                borderRadius: "18px",
                border: `1px solid ${ADMIN_THEME.border}`,
                background: "linear-gradient(180deg, #FFFFFF 0%, #F7F2ED 100%)",
                boxShadow: "0 12px 30px rgba(70,46,25,0.08)",
              }}
            >
              <p style={{ color: ADMIN_THEME.subtle, fontSize: "10px", letterSpacing: "0px", textTransform: "uppercase", margin: "0 0 10px 0" }}>
                Active Focus
              </p>
              <h3 style={{ color: ADMIN_THEME.heading, fontSize: "26px", fontFamily: "var(--font-heading)", margin: "0 0 8px 0", lineHeight: 1 }}>
                {selectedCohort.name.toUpperCase()}
              </h3>
              <p style={{ color: ADMIN_THEME.muted, fontSize: "14px", margin: "0 0 14px 0" }}>{selectedCohort.program}</p>
              <p style={{ color: ADMIN_THEME.subtle, fontSize: "13px", margin: 0 }}>
                {selectedClass ? `${formatDateTime(selectedClass.date, selectedClass.time)} · ${selectedClass.track}` : "No class scheduled yet"}
              </p>
            </div>
          </div>
        </Surface>

        <div className="admin-metrics">
          <MetricCard icon={<Users size={20} />} label="Active Cohorts" value={String(cohorts.length)} note="Separate groups running this term" />
          <MetricCard icon={<GraduationCap size={20} />} label="Students" value={String(totalStudents)} note={`${occupiedSeats} seats filled in ${selectedCohort.name}`} />
          <MetricCard
            icon={<CalendarDays size={20} />}
            label="Next Class"
            value={nextClass ? nextClass.date.slice(5).replace("-", "/") : "None"}
            note={nextClass ? `${nextClass.cohortName} · ${nextClass.time}` : "Schedule your next session"}
          />
          <MetricCard icon={<FileText size={20} />} label="Reports Logged" value={String(totalReports)} note={`${selectedCohort.reports.length} reports in the selected cohort`} />
        </div>

        <div className="admin-grid">
          <div className="admin-stack">
            <Surface style={{ padding: "22px", minHeight: "1272px", alignSelf: "start" }}>
              <div style={{ height: "3px", backgroundColor: ADMIN_THEME.accent, margin: "-22px -22px 18px", borderRadius: "22px 22px 0 0" }} />
              <SectionTitle eyebrow="Cohorts" title="View Cohorts" subdetail={`${cohorts.length} active groups`} />

              <div style={{ display: "grid", gap: "12px" }}>
                {cohorts.map((cohort) => {
                  const active = cohort.id === selectedCohort.id;

                  return (
                    <button
                      key={cohort.id}
                      type="button"
                      onClick={() => setSelectedCohortId(cohort.id)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "17px",
                        minHeight: "189px",
                        borderRadius: "18px",
                        border: `1px solid ${active ? ADMIN_THEME.accentBorder : ADMIN_THEME.borderSoft}`,
                        background: active
                          ? "linear-gradient(135deg, rgba(200,52,46,0.08) 0%, #FFFFFF 100%)"
                          : ADMIN_THEME.surfaceSoft,
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", minHeight: "155px" }}>
                        <div style={{ maxWidth: "140px" }}>
                          <p style={{ color: active ? ADMIN_THEME.accent : ADMIN_THEME.subtle, fontSize: "10px", fontWeight: 500, letterSpacing: "0px", textTransform: "uppercase", margin: "0 0 6px 0" }}>
                            {cohort.program}
                          </p>
                          <h3 style={{ color: ADMIN_THEME.heading, fontSize: "22px", fontFamily: "var(--font-heading)", margin: "0 0 8px 0", lineHeight: 1 }}>
                            {cohort.name.toUpperCase()}
                          </h3>
                          <p style={{ color: ADMIN_THEME.muted, fontSize: "13px", lineHeight: 1.5, margin: "0 0 8px 0" }}>{cohort.cadence}</p>
                          <p style={{ color: ADMIN_THEME.subtle, fontSize: "12px", lineHeight: 1.5, margin: 0 }}>
                            {cohort.students.length}/{cohort.capacity} students · Coach {cohort.coach}
                          </p>
                        </div>
                        <span
                          style={{
                            padding: "7px 10px",
                            borderRadius: "999px",
                            backgroundColor: active ? ADMIN_THEME.accentBg : "#F2ECE6",
                            color: active ? ADMIN_THEME.accent : ADMIN_THEME.muted,
                            fontSize: "11px",
                            letterSpacing: "0px",
                            textTransform: "uppercase",
                            flexShrink: 0,
                          }}
                        >
                          {cohort.syllabus.length} modules
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Surface>

            <Surface style={{ padding: "23px", minHeight: "929px", alignSelf: "start" }}>
              <SectionTitle
                eyebrow="Selected Cohort"
                title="Roster Snapshot"
                subdetail={`${selectedCohort.students.length} students`}
                titleStyle={{ maxWidth: "166px" }}
              />

              <div className="admin-three-up" style={{ marginBottom: "16px" }}>
                <div style={{ padding: "17px", minHeight: "111px", borderRadius: "16px", ...nestedCardStyle }}>
                  <p style={{ color: ADMIN_THEME.subtle, fontSize: "10px", letterSpacing: "0px", textTransform: "uppercase", margin: "0 0 8px 0" }}>Seats</p>
                  <p style={{ color: ADMIN_THEME.heading, fontSize: "28px", fontFamily: "var(--font-body)", fontWeight: 900, margin: 0 }}>{occupiedSeats}</p>
                </div>
                <div style={{ padding: "17px", minHeight: "111px", borderRadius: "16px", ...nestedCardStyle }}>
                  <p style={{ color: ADMIN_THEME.subtle, fontSize: "10px", letterSpacing: "0px", textTransform: "uppercase", margin: "0 0 8px 0" }}>Syllabus</p>
                  <p style={{ color: ADMIN_THEME.heading, fontSize: "28px", fontFamily: "var(--font-body)", fontWeight: 900, margin: 0 }}>
                    {completedSyllabus}/{selectedCohort.syllabus.length}
                  </p>
                </div>
                <div style={{ padding: "17px", minHeight: "111px", borderRadius: "16px", ...nestedCardStyle }}>
                  <p style={{ color: ADMIN_THEME.subtle, fontSize: "10px", letterSpacing: "0px", textTransform: "uppercase", margin: "0 0 8px 0" }}>Room</p>
                  <p style={{ color: ADMIN_THEME.heading, fontSize: "18px", fontFamily: "var(--font-body)", fontWeight: 800, lineHeight: 1.5, margin: 0 }}>{selectedCohort.room}</p>
                </div>
              </div>

              <div style={{ display: "grid", gap: "10px" }}>
                {selectedCohort.students.map((student, index) => (
                  <div
                    key={student.id}
                    style={{
                      padding: "15px 17px",
                      minHeight: index === 0 ? "168px" : "150px",
                      borderRadius: "16px",
                      display: "grid",
                      alignContent: "space-between",
                      ...nestedCardStyle,
                    }}
                  >
                    <div>
                      <h4 style={{ color: ADMIN_THEME.heading, fontSize: "18px", fontFamily: "var(--font-body)", fontStyle: "italic", fontWeight: 800, margin: "0 0 4px 0" }}>
                        {student.name}
                      </h4>
                      <p style={{ color: ADMIN_THEME.muted, fontSize: "13px", margin: "0 0 6px 0" }}>
                        Age {student.age} · Guardian {student.guardian}
                      </p>
                      <p style={{ color: ADMIN_THEME.subtle, fontSize: "12px", lineHeight: 1.5, margin: 0 }}>{student.notes || "No coach notes yet."}</p>
                    </div>
                    <span
                      style={{
                        justifySelf: "start",
                        padding: "7px 10px",
                        borderRadius: "999px",
                        backgroundColor: student.pace === "Fast Track" ? "rgba(34,197,94,0.10)" : student.pace === "Needs Support" ? "rgba(245,158,11,0.12)" : "#F2ECE6",
                        color: student.pace === "Fast Track" ? "#247A44" : student.pace === "Needs Support" ? "#9D6100" : ADMIN_THEME.muted,
                        fontSize: "11px",
                        letterSpacing: "0px",
                        textTransform: "uppercase",
                      }}
                    >
                      {student.pace}
                    </span>
                  </div>
                ))}
              </div>
            </Surface>
          </div>

          <div className="admin-stack">
            <Surface style={{ padding: "23px", minHeight: "218px", alignSelf: "start" }}>
              <div style={{ display: "grid", gap: "16px", marginBottom: "16px" }}>
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
                  <div style={{ display: "grid", gap: "12px", justifyItems: "end" }}>
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
              <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <span style={pillSummaryStyle("present")}>Present {attendanceCounts.present}</span>
                  <span style={pillSummaryStyle("absent")}>Absent {attendanceCounts.absent}</span>
                  <span style={pillSummaryStyle("pending")}>Pending {attendanceCounts.pending}</span>
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <ActionButton secondary onClick={() => bulkAttendance("present")} style={{ minWidth: "156px" }}>Mark All Present</ActionButton>
                  <ActionButton secondary onClick={() => bulkAttendance("absent")} style={{ minWidth: "148px" }}>Mark All Absent</ActionButton>
                </div>
              </div>
            </Surface>

            <Surface style={{ padding: "23px", minHeight: "267px", alignSelf: "start" }}>
              <form onSubmit={handleAnnouncementSubmit} style={{ display: "grid", gap: "18px", minHeight: "221px" }}>
                <SectionTitle eyebrow="Announcements" title="Send Announcement" />
                <div>
                  <FieldLabel>Type Announcement</FieldLabel>
                  <FieldShell>
                    <input
                      value={announcementDraft}
                      onChange={(event) => setAnnouncementDraft(event.target.value)}
                      style={inputStyle}
                    />
                  </FieldShell>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "auto" }}>
                  <ActionButton type="submit" style={{ minWidth: "186px" }}>Send Announcement</ActionButton>
                </div>
              </form>
            </Surface>

            <div className="admin-two-up">
              <Surface style={{ padding: "23px", minHeight: "476px", alignSelf: "start" }}>
                <SectionTitle eyebrow="Scheduling" title="Schedule Class" subdetail={selectedCohort.cadence} />
                <form onSubmit={handleClassSubmit} className="admin-form-grid">
                  <div>
                    <FieldLabel>Date</FieldLabel>
                    <FieldShell>
                      <input
                        type="date"
                        value={newClass.date}
                        onChange={(event) => setNewClass((current) => ({ ...current, date: event.target.value }))}
                        style={inputStyle}
                      />
                    </FieldShell>
                  </div>
                  <div>
                    <FieldLabel>Time</FieldLabel>
                    <FieldShell>
                      <input
                        type="time"
                        value={newClass.time}
                        onChange={(event) => setNewClass((current) => ({ ...current, time: event.target.value }))}
                        style={inputStyle}
                      />
                    </FieldShell>
                  </div>
                  <div>
                    <FieldLabel>Track</FieldLabel>
                    <FieldShell>
                      <input
                        value={newClass.track}
                        onChange={(event) => setNewClass((current) => ({ ...current, track: event.target.value }))}
                        placeholder={selectedCohort.room}
                        style={inputStyle}
                      />
                    </FieldShell>
                  </div>
                  <div>
                    <FieldLabel>Coach</FieldLabel>
                    <FieldShell>
                      <input
                        value={newClass.coach}
                        onChange={(event) => setNewClass((current) => ({ ...current, coach: event.target.value }))}
                        placeholder={selectedCohort.coach}
                        style={inputStyle}
                      />
                    </FieldShell>
                  </div>
                  <div className="admin-full-span">
                    <FieldLabel>Session Topic</FieldLabel>
                    <FieldShell>
                      <input
                        value={newClass.topic}
                        onChange={(event) => setNewClass((current) => ({ ...current, topic: event.target.value }))}
                        placeholder="Set the drill or classroom focus for the next session"
                        style={inputStyle}
                      />
                    </FieldShell>
                  </div>
                  <div className="admin-full-span" style={{ display: "grid", gap: "12px", justifyItems: "start" }}>
                    <p style={{ color: ADMIN_THEME.subtle, fontSize: "12px", margin: 0 }}>
                      Each scheduled class automatically creates a fresh attendance register for every student.
                    </p>
                    <ActionButton type="submit" style={{ minWidth: "142px" }}>Schedule Class</ActionButton>
                  </div>
                </form>
              </Surface>

              <Surface style={{ padding: "23px", minHeight: "451px", alignSelf: "start" }}>
                <SectionTitle eyebrow="Class Timeline" title="Upcoming Sessions" detail={`${selectedCohort.classes.length} scheduled`} />
                <div style={{ display: "grid", gap: "12px" }}>
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
                          padding: "16px 17px",
                          minHeight: "105px",
                          borderRadius: "16px",
                          border: `1px solid ${active ? ADMIN_THEME.accentBorder : ADMIN_THEME.borderSoft}`,
                          background: active
                            ? "linear-gradient(135deg, rgba(200,52,46,0.08) 0%, #FFFFFF 100%)"
                            : ADMIN_THEME.surfaceSoft,
                          cursor: "pointer",
                        }}
                      >
                        <p style={{ color: active ? ADMIN_THEME.accent : ADMIN_THEME.subtle, fontSize: "10px", fontWeight: 500, letterSpacing: "0px", textTransform: "uppercase", margin: "0 0 6px 0" }}>
                          {session.track}
                        </p>
                        <h4 style={{ color: ADMIN_THEME.heading, fontSize: "18px", fontFamily: "var(--font-body)", fontStyle: "italic", fontWeight: 800, margin: "0 0 6px 0" }}>
                          {session.topic}
                        </h4>
                        <p style={{ color: ADMIN_THEME.muted, fontSize: "13px", margin: 0 }}>{formatDateTime(session.date, session.time)} · {session.coach}</p>
                      </button>
                    );
                  })}
                </div>
              </Surface>
            </div>

            <div className="admin-two-up">
              <Surface style={{ padding: "23px", minHeight: "610px", alignSelf: "start" }}>
                <SectionTitle eyebrow="Reports" title="Add Coach Report" detail={selectedCohort.name} />
                <form onSubmit={handleReportSubmit} className="admin-form-grid">
                  <div className="admin-full-span">
                    <FieldLabel>Student</FieldLabel>
                    <FieldShell>
                      <select
                        value={newReport.studentId}
                        onChange={(event) => setNewReport((current) => ({ ...current, studentId: event.target.value }))}
                        style={inputStyle}
                      >
                        {selectedCohort.students.map((student) => (
                          <option key={student.id} value={student.id}>
                            {student.name}
                          </option>
                        ))}
                      </select>
                    </FieldShell>
                  </div>
                  <div className="admin-full-span">
                    <FieldLabel>Report Title</FieldLabel>
                    <FieldShell>
                      <input
                        value={newReport.title}
                        onChange={(event) => setNewReport((current) => ({ ...current, title: event.target.value }))}
                        placeholder="Week 2 progress report"
                        style={inputStyle}
                      />
                    </FieldShell>
                  </div>
                  <div className="admin-full-span">
                    <FieldLabel>Summary</FieldLabel>
                    <FieldShell>
                      <textarea
                        value={newReport.summary}
                        onChange={(event) => setNewReport((current) => ({ ...current, summary: event.target.value }))}
                        placeholder="Summarise pace, confidence, and key behaviours from the session."
                        style={textareaStyle}
                      />
                    </FieldShell>
                  </div>
                  <div className="admin-full-span">
                    <FieldLabel>Next Recommendation</FieldLabel>
                    <FieldShell>
                      <textarea
                        value={newReport.recommendation}
                        onChange={(event) => setNewReport((current) => ({ ...current, recommendation: event.target.value }))}
                        placeholder="Set the next coaching focus or home practice note."
                        style={textareaStyle}
                      />
                    </FieldShell>
                  </div>
                  <div className="admin-full-span" style={{ display: "flex", justifyContent: "flex-end" }}>
                    <ActionButton type="submit" style={{ minWidth: "142px" }}>Save Report</ActionButton>
                  </div>
                </form>
              </Surface>

              <Surface style={{ padding: "23px", minHeight: "610px", alignSelf: "start" }}>
                <SectionTitle eyebrow="Report Log" title="Recent Reports" detail={`${selectedCohort.reports.length} stored`} />
                <div style={{ display: "grid", gap: "12px" }}>
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
                            padding: "16px",
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

              <Surface style={{ padding: "23px", minHeight: "550px", alignSelf: "start" }}>
                <SectionTitle eyebrow="Enrollment" title="Add Student To Cohort" subdetail={selectedCohort.name} />
                <form onSubmit={handleStudentSubmit} className="admin-form-grid">
                  <div>
                    <FieldLabel>Student Name</FieldLabel>
                    <FieldShell>
                      <input
                        value={newStudent.name}
                        onChange={(event) => setNewStudent((current) => ({ ...current, name: event.target.value }))}
                        placeholder="Enter full name"
                        style={inputStyle}
                      />
                    </FieldShell>
                  </div>
                  <div>
                    <FieldLabel>Age</FieldLabel>
                    <FieldShell>
                      <input
                        value={newStudent.age}
                        onChange={(event) => setNewStudent((current) => ({ ...current, age: event.target.value }))}
                        placeholder="12"
                        style={inputStyle}
                      />
                    </FieldShell>
                  </div>
                  <div>
                    <FieldLabel>Guardian</FieldLabel>
                    <FieldShell>
                      <input
                        value={newStudent.guardian}
                        onChange={(event) => setNewStudent((current) => ({ ...current, guardian: event.target.value }))}
                        placeholder="Parent or guardian"
                        style={inputStyle}
                      />
                    </FieldShell>
                  </div>
                  <div>
                    <FieldLabel>Progress Pace</FieldLabel>
                    <FieldShell>
                      <select
                        value={newStudent.pace}
                        onChange={(event) => setNewStudent((current) => ({ ...current, pace: event.target.value as StudentPace }))}
                        style={inputStyle}
                      >
                        <option value="Steady">Steady</option>
                        <option value="Fast Track">Fast Track</option>
                        <option value="Needs Support">Needs Support</option>
                      </select>
                    </FieldShell>
                  </div>
                  <div className="admin-full-span">
                    <FieldLabel>Coach Notes</FieldLabel>
                    <FieldShell>
                      <textarea
                        value={newStudent.notes}
                        onChange={(event) => setNewStudent((current) => ({ ...current, notes: event.target.value }))}
                        placeholder="Add a quick note about confidence, goals, or support areas."
                        style={textareaStyle}
                      />
                    </FieldShell>
                  </div>
                  <div className="admin-full-span" style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                    <p style={{ color: ADMIN_THEME.subtle, fontSize: "12px", margin: 0 }}>
                      New students are added directly to the selected cohort and appear in attendance and reports.
                    </p>
                    <ActionButton type="submit" style={{ minWidth: "145px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                        <Plus size={16} /> Add Student
                      </span>
                    </ActionButton>
                  </div>
                </form>
              </Surface>

              <Surface style={{ padding: "23px", minHeight: "472px", alignSelf: "start" }}>
                <SectionTitle eyebrow="Syllabus" title="Add Syllabus Block" detail={`${selectedCohort.syllabus.length} total`} />
                <form onSubmit={handleSyllabusSubmit} className="admin-form-grid">
                  <div>
                    <FieldLabel>Week Label</FieldLabel>
                    <FieldShell>
                      <input
                        value={newSyllabus.weekLabel}
                        onChange={(event) => setNewSyllabus((current) => ({ ...current, weekLabel: event.target.value }))}
                        placeholder="Week 04"
                        style={inputStyle}
                      />
                    </FieldShell>
                  </div>
                  <div>
                    <FieldLabel>Status</FieldLabel>
                    <FieldShell>
                      <select
                        value={newSyllabus.status}
                        onChange={(event) => setNewSyllabus((current) => ({ ...current, status: event.target.value as SyllabusStatus }))}
                        style={inputStyle}
                      >
                        <option value="planned">Planned</option>
                        <option value="live">Live</option>
                        <option value="complete">Complete</option>
                      </select>
                    </FieldShell>
                  </div>
                  <div className="admin-full-span">
                    <FieldLabel>Module Title</FieldLabel>
                    <FieldShell>
                      <input
                        value={newSyllabus.title}
                        onChange={(event) => setNewSyllabus((current) => ({ ...current, title: event.target.value }))}
                        placeholder="Braking release and exit drive"
                        style={inputStyle}
                      />
                    </FieldShell>
                  </div>
                  <div className="admin-full-span">
                    <FieldLabel>Objective</FieldLabel>
                    <FieldShell>
                      <textarea
                        value={newSyllabus.objective}
                        onChange={(event) => setNewSyllabus((current) => ({ ...current, objective: event.target.value }))}
                        placeholder="Describe what the students should leave the session knowing."
                        style={textareaStyle}
                      />
                    </FieldShell>
                  </div>
                  <div className="admin-full-span" style={{ display: "flex", justifyContent: "flex-end" }}>
                    <ActionButton type="submit" style={{ minWidth: "128px" }}>Add Syllabus</ActionButton>
                  </div>
                </form>
              </Surface>
            </div>

            <Surface style={{ padding: "23px", minHeight: "501px", alignSelf: "start" }}>
              <SectionTitle eyebrow="Syllabus Board" title="Current Training Blocks" detail={`${selectedCohort.syllabus.length} modules`} />
              <div style={{ display: "grid", gap: "12px" }}>
                {selectedCohort.syllabus.map((item) => {
                  const colors = SYLLABUS_COLORS[item.status];

                  return (
                    <div
                      key={item.id}
                      style={{
                        padding: "17px",
                        borderRadius: "18px",
                        ...nestedCardStyle,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginBottom: "10px" }}>
                        <div>
                          <p style={{ color: ADMIN_THEME.subtle, fontSize: "10px", letterSpacing: "0px", textTransform: "uppercase", margin: "0 0 6px 0" }}>
                            {item.weekLabel}
                          </p>
                          <h4 style={{ color: ADMIN_THEME.heading, fontSize: "20px", fontFamily: "var(--font-body)", fontStyle: "italic", fontWeight: 800, margin: 0 }}>
                            {item.title}
                          </h4>
                        </div>
                        <span
                          style={{
                            padding: "7px 10px",
                            borderRadius: "999px",
                            backgroundColor: colors.bg,
                            border: `1px solid ${colors.border}`,
                            color: colors.text,
                            fontSize: "11px",
                            letterSpacing: "0px",
                            textTransform: "uppercase",
                          }}
                        >
                          {item.status}
                        </span>
                      </div>
                      <p style={{ color: ADMIN_THEME.muted, fontSize: "14px", lineHeight: 1.6, margin: 0 }}>{item.objective}</p>
                    </div>
                  );
                })}
              </div>
            </Surface>
          </div>
        </div>
      </div>
    </>
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
    padding: "9px 12px",
    borderRadius: "999px",
    backgroundColor: colors.bg,
    border: `1px solid ${colors.border}`,
    color: colors.text,
    fontSize: "11px",
    letterSpacing: "0px",
    textTransform: "uppercase",
  };
}
