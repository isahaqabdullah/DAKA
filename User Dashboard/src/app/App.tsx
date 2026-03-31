import { useEffect, useState, type ReactNode } from "react";
import { CalendarDays, ChevronDown, FileText, Home, Plus, Users } from "lucide-react";
import autodromeHeaderLogo from "../assets/autodrome-header-logo.svg";
import { AdminCreateCohortPage } from "./components/AdminCreateCohortPage";
import { AdminAttendancePage } from "./components/AdminAttendancePage";
import { AdminCohortDashboard } from "./components/AdminCohortDashboard";
import { loadCohorts, STORAGE_KEY } from "./components/AdminDashboard";
import { AdminCohortManagementPage } from "./components/AdminCohortManagementPage";
import { AdminCohortReportsPage } from "./components/AdminCohortReportsPage";
import { AdminCohortTeachingPage } from "./components/AdminCohortTeachingPage";
import { AdminLandingPage } from "./components/AdminLandingPage";
import { StudentDashboard } from "./components/StudentDashboard";

type DashboardView = "student" | "admin" | "admin-attendance" | "student-mobile";
type AdminScreen =
  | "landing"
  | "cohort"
  | "cohort-management"
  | "student-management"
  | "cohort-reports"
  | "cohort-teaching";

function getInitialView(): DashboardView {
  if (typeof window === "undefined") {
    return "admin";
  }

  if (window.location.hash === "#student-mobile") {
    return "student-mobile";
  }

  if (window.location.hash === "#student") {
    return "student";
  }

  if (window.location.hash === "#admin") {
    return "admin";
  }

  if (window.location.hash === "#admin-attendance") {
    return "admin-attendance";
  }

  const viewParam = new URLSearchParams(window.location.search).get("view");

  if (viewParam === "admin-attendance") {
    return "admin-attendance";
  }

  if (viewParam === "student-mobile") {
    return "student-mobile";
  }

  if (viewParam === "student") {
    return "student";
  }

  return "admin";
}

function getInitialAdminContext() {
  if (typeof window === "undefined") {
    return {
      screen: "landing" as AdminScreen,
      cohortId: "",
      studentId: "",
    };
  }

  const params = new URLSearchParams(window.location.search);
  const screen = params.get("screen");
  const cohortId = params.get("cohortId") ?? "";
  const studentId = params.get("studentId") ?? "";

  if (screen === "cohort" && cohortId) {
    return {
      screen: "cohort" as AdminScreen,
      cohortId,
      studentId: "",
    };
  }

  if (screen === "cohort-management" || screen === "cohort-create") {
    return {
      screen: "cohort-management" as AdminScreen,
      cohortId,
      studentId: "",
    };
  }

  if (screen === "student-management") {
    return {
      screen: "student-management" as AdminScreen,
      cohortId,
      studentId: "",
    };
  }

  if (screen === "cohort-reports" && cohortId) {
    return {
      screen: "cohort-reports" as AdminScreen,
      cohortId,
      studentId,
    };
  }

  if (screen === "cohort-teaching" && cohortId) {
    return {
      screen: "cohort-teaching" as AdminScreen,
      cohortId,
      studentId: "",
    };
  }

  return {
    screen: "landing" as AdminScreen,
    cohortId,
    studentId: "",
  };
}

function getInitialAttendanceContext() {
  if (typeof window === "undefined") {
    return {
      cohortId: "",
      classId: "",
      lockedToSession: false,
    };
  }

  const params = new URLSearchParams(window.location.search);
  const classId = params.get("classId") ?? "";

  return {
    cohortId: params.get("cohortId") ?? "",
    classId,
    lockedToSession: Boolean(classId),
  };
}

function createWorkspaceId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function buildWorkspaceAnnouncementDraft(targetCohortIds: string[] = []) {
  return {
    title: "",
    message: "",
    expiresAt: "",
    targetCohortIds,
  };
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div
      style={{
        padding: "14px",
        borderRadius: "16px",
        border: "1px solid rgba(255,255,255,0.08)",
        background: "linear-gradient(135deg, rgba(24,24,24,0.96) 0%, rgba(15,15,15,0.96) 100%)",
      }}
    >
      <p style={{ color: "#7A7A7A", fontSize: "10px", letterSpacing: "0px", textTransform: "uppercase", margin: "0 0 8px 0" }}>
        {label}
      </p>
      <p style={{ color: "#FFFFFF", fontSize: "24px", fontFamily: "var(--font-body)", fontWeight: 900, margin: "0 0 4px 0", lineHeight: 1 }}>
        {value}
      </p>
      <p style={{ color: "#A7A7A7", fontSize: "12px", margin: 0 }}>{note}</p>
    </div>
  );
}

function AdminWorkspaceButton({
  label,
  active,
  onClick,
  disabled = false,
  fullWidth = false,
  icon,
  trailing,
  nested = false,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
  trailing?: ReactNode;
  nested?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-current={active ? "page" : undefined}
      style={{
        minHeight: nested ? "38px" : "48px",
        padding: nested ? "0 14px" : "0 16px",
        width: fullWidth ? "100%" : undefined,
        borderRadius: nested ? "13px" : "16px",
        border: nested
          ? active
            ? "1px solid rgba(200,52,46,0.20)"
            : "1px solid transparent"
          : active
            ? "1px solid rgba(200,52,46,0.24)"
            : "1px solid transparent",
        background: active
          ? "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 100%)"
          : "transparent",
        color: active ? "#F6F2EE" : nested ? "#B8B4AE" : "#D8D3CE",
        fontSize: nested ? "11px" : "11px",
        fontFamily: "var(--font-body)",
        fontWeight: 800,
        letterSpacing: "0px",
        textTransform: "uppercase",
        cursor: disabled ? "not-allowed" : "pointer",
        whiteSpace: "nowrap",
        boxShadow: active ? "inset 0 1px 0 rgba(255,255,255,0.08), 0 10px 24px rgba(0,0,0,0.16)" : "none",
        opacity: disabled ? 0.5 : 1,
        textAlign: "left",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        transition: "background 140ms ease, border-color 140ms ease, box-shadow 140ms ease",
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: nested ? "9px" : "11px", minWidth: 0 }}>
        {icon ? <span style={{ display: "inline-flex", color: active ? "#F6F2EE" : "#8F8A84" }}>{icon}</span> : null}
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
      </span>
      {trailing ? <span style={{ display: "inline-flex", color: active ? "#F6F2EE" : "#7F7A75" }}>{trailing}</span> : null}
    </button>
  );
}

export default function App() {
  const initialAdminContext = getInitialAdminContext();
  const initialAttendanceContext = getInitialAttendanceContext();
  const [view, setView] = useState<DashboardView>(() => getInitialView());
  const [attendanceContext, setAttendanceContext] = useState<{
    cohortId?: string;
    classId?: string;
    returnToScreen?: AdminScreen;
    lockedToSession?: boolean;
  }>(() => initialAttendanceContext);
  const [adminScreen, setAdminScreen] = useState<AdminScreen>(initialAdminContext.screen);
  const [selectedAdminCohortId, setSelectedAdminCohortId] = useState<string>(() => initialAdminContext.cohortId || (loadCohorts()[0]?.id ?? ""));
  const [selectedAdminStudentId, setSelectedAdminStudentId] = useState<string>(initialAdminContext.studentId);
  const [isAnnouncementComposerOpen, setIsAnnouncementComposerOpen] = useState(false);
  const [adminSidebarSections, setAdminSidebarSections] = useState({
    cohort: true,
    student: true,
    actions: false,
  });
  const [workspaceAnnouncementDraft, setWorkspaceAnnouncementDraft] = useState(() =>
    buildWorkspaceAnnouncementDraft(initialAdminContext.cohortId ? [initialAdminContext.cohortId] : []),
  );
  const adminViewActive = view === "admin" || view === "admin-attendance";
  const adminCohorts = adminViewActive ? loadCohorts().filter((cohort) => !cohort.archived) : [];
  const adminCohortFallback = adminCohorts[0];
  const currentAdminCohort =
    adminCohorts.find((cohort) => cohort.id === selectedAdminCohortId) ?? adminCohortFallback;
  const effectiveAdminCohortId = selectedAdminCohortId || currentAdminCohort?.id || "";
  const cohortNavActive =
    view === "admin" &&
    ["cohort", "cohort-management", "cohort-teaching"].includes(adminScreen);
  const studentNavActive =
    view === "admin" &&
    ["student-management", "cohort-reports"].includes(adminScreen);
  const actionsNavActive = view === "admin" && isAnnouncementComposerOpen;
  const cohortSectionExpanded = adminSidebarSections.cohort || cohortNavActive;
  const studentSectionExpanded = adminSidebarSections.student || studentNavActive;
  const actionsSectionExpanded = adminSidebarSections.actions || actionsNavActive;
  useEffect(() => {
    const handleHashChange = () => {
      setView(getInitialView());
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    const nextUrl = new URL(window.location.href);

    nextUrl.searchParams.delete("screen");
    nextUrl.searchParams.delete("cohortId");
    nextUrl.searchParams.delete("studentId");
    nextUrl.searchParams.delete("classId");
    nextUrl.searchParams.delete("view");

    if (view === "admin") {
      nextUrl.hash = "#admin";

      if (adminScreen !== "landing") {
        nextUrl.searchParams.set("screen", adminScreen);
      }

      if (effectiveAdminCohortId) {
        nextUrl.searchParams.set("cohortId", effectiveAdminCohortId);
      }

      if (adminScreen === "cohort-reports" && selectedAdminStudentId) {
        nextUrl.searchParams.set("studentId", selectedAdminStudentId);
      }
    } else if (view === "admin-attendance") {
      nextUrl.hash = "#admin-attendance";

      if (attendanceContext.cohortId) {
        nextUrl.searchParams.set("cohortId", attendanceContext.cohortId);
      }

      if (attendanceContext.classId) {
        nextUrl.searchParams.set("classId", attendanceContext.classId);
      }
    } else if (view === "student-mobile") {
      nextUrl.hash = "#student-mobile";
    } else {
      nextUrl.hash = "#student";
    }

    window.history.replaceState(null, "", nextUrl.toString());
  }, [
    adminScreen,
    attendanceContext.classId,
    attendanceContext.cohortId,
    effectiveAdminCohortId,
    selectedAdminStudentId,
    view,
  ]);

  function changeView(nextView: DashboardView) {
    setView(nextView);
  }

  function openAdminLanding() {
    setSelectedAdminStudentId("");
    setAdminScreen("landing");
    changeView("admin");
  }

  function openAdminCohort(cohortId: string) {
    setSelectedAdminCohortId(cohortId);
    setSelectedAdminStudentId("");
    setAdminScreen("cohort");
    changeView("admin");
  }

  function openAdminCohortManagement(cohortId: string) {
    if (cohortId) {
      setSelectedAdminCohortId(cohortId);
    }
    setSelectedAdminStudentId("");
    setAdminScreen("cohort-management");
    changeView("admin");
  }

  function openAdminStudentManagement(cohortId?: string) {
    if (cohortId) {
      setSelectedAdminCohortId(cohortId);
    }
    setSelectedAdminStudentId("");
    setAdminScreen("student-management");
    changeView("admin");
  }

  function openAdminCohortReports(cohortId: string, studentId?: string) {
    setSelectedAdminCohortId(cohortId);
    setSelectedAdminStudentId(studentId ?? "");
    setAdminScreen("cohort-reports");
    changeView("admin");
  }

  function openAdminCohortTeaching(cohortId: string) {
    setSelectedAdminCohortId(cohortId);
    setSelectedAdminStudentId("");
    setAdminScreen("cohort-teaching");
    changeView("admin");
  }

  function openAdminAttendance(context: {
    cohortId?: string;
    classId?: string;
    returnToScreen?: AdminScreen;
  }) {
    if (context.cohortId) {
      setSelectedAdminCohortId(context.cohortId);
    }

    setAttendanceContext({
      ...context,
      lockedToSession: Boolean(context.classId),
    });
    changeView("admin-attendance");
  }

  function handleAdminCohortChange(cohortId: string) {
    setSelectedAdminCohortId(cohortId);
    setSelectedAdminStudentId("");
  }

  function toggleAdminSidebarSection(section: "cohort" | "student" | "actions") {
    setAdminSidebarSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  }

  function openAnnouncementComposer() {
    const defaultTargets = currentAdminCohort ? [currentAdminCohort.id] : [];
    setWorkspaceAnnouncementDraft(buildWorkspaceAnnouncementDraft(defaultTargets));
    setIsAnnouncementComposerOpen(true);
  }

  function closeAnnouncementComposer() {
    setIsAnnouncementComposerOpen(false);
    setWorkspaceAnnouncementDraft(buildWorkspaceAnnouncementDraft(currentAdminCohort ? [currentAdminCohort.id] : []));
  }

  function handleAnnouncementTargetToggle(cohortId: string) {
    setWorkspaceAnnouncementDraft((current) => ({
      ...current,
      targetCohortIds: current.targetCohortIds.includes(cohortId)
        ? current.targetCohortIds.filter((id) => id !== cohortId)
        : [...current.targetCohortIds, cohortId],
    }));
  }

  function handleWorkspaceAnnouncementSubmit() {
    if (
      workspaceAnnouncementDraft.targetCohortIds.length === 0 ||
      !workspaceAnnouncementDraft.title.trim() ||
      !workspaceAnnouncementDraft.message.trim()
    ) {
      return;
    }

    const now = new Date().toISOString();
    const nextCohorts = loadCohorts().map((cohort) => {
      if (!workspaceAnnouncementDraft.targetCohortIds.includes(cohort.id)) {
        return cohort;
      }

      return {
        ...cohort,
        announcements: [
          {
            id: createWorkspaceId("announcement"),
            title: workspaceAnnouncementDraft.title.trim(),
            message: workspaceAnnouncementDraft.message.trim(),
            createdAt: now,
            expiresAt: workspaceAnnouncementDraft.expiresAt.trim() || undefined,
          },
          ...cohort.announcements,
        ],
      };
    });

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextCohorts));
    closeAnnouncementComposer();
  }

  return (
    <>
      <style>{`
        .academy-shell {
          min-height: 100vh;
          font-family: var(--font-body);
        }
        .academy-page {
          width: min(1440px, calc(100% - 40px));
          margin: 0 auto;
          padding: 20px 0 28px;
        }
        .academy-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 14px 16px;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          background: linear-gradient(135deg, rgba(24,24,24,0.96) 0%, rgba(12,12,12,0.96) 100%);
          box-shadow: 0 20px 60px rgba(0,0,0,0.25);
          margin-bottom: 16px;
          position: sticky;
          top: 12px;
          z-index: 10;
          backdrop-filter: blur(18px);
        }
        .academy-nav {
          display: inline-flex;
          gap: 8px;
          padding: 4px;
          border-radius: 999px;
          background-color: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .academy-content {
          display: grid;
          gap: 16px;
        }
        .academy-admin-shell {
          display: grid;
          grid-template-columns: minmax(238px, 276px) minmax(0, 1fr);
          gap: 14px;
          align-items: start;
        }
        .academy-admin-sidebar {
          display: grid;
          gap: 10px;
          position: sticky;
          top: 88px;
        }
        .academy-admin-sidecard {
          border-radius: 26px;
          border: 1px solid rgba(255,255,255,0.08);
          background:
            radial-gradient(circle at top left, rgba(200,52,46,0.14), transparent 24%),
            linear-gradient(180deg, rgba(31,31,33,0.98) 0%, rgba(20,20,22,0.98) 100%);
          box-shadow: 0 24px 48px rgba(22,18,14,0.22);
        }
        .academy-admin-brand {
          display: grid;
          gap: 12px;
          padding: 14px 14px 10px;
          margin-bottom: 6px;
        }
        .academy-admin-brand-mark {
          width: 50px;
          height: 50px;
          border-radius: 16px;
          background:
            radial-gradient(circle at 35% 35%, rgba(200,52,46,0.16), transparent 32%),
            linear-gradient(180deg, #FFF8F1 0%, #EFE7DE 100%);
          border: 1px solid rgba(255,255,255,0.16);
          display: grid;
          place-items: center;
          color: #16120E;
          font-size: 20px;
          font-family: var(--font-heading);
          font-weight: 900;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.72);
        }
        .academy-admin-nav-group {
          display: grid;
          gap: 4px;
        }
        .academy-admin-subnav {
          display: grid;
          gap: 4px;
          margin: 4px 0 8px 18px;
          padding-left: 16px;
          border-left: 1px solid rgba(255,255,255,0.08);
        }
        .student-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(380px, 420px);
          gap: 24px;
          align-items: start;
        }
        .student-info-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }
        .mobile-view-shell {
          display: grid;
          gap: 24px;
          justify-items: center;
        }
        .mobile-device-frame {
          padding: 14px;
          border-radius: 38px;
          border: 1px solid rgba(255,255,255,0.08);
          background:
            linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%),
            linear-gradient(135deg, rgba(24,24,24,0.98) 0%, rgba(9,9,9,0.98) 100%);
          box-shadow: 0 30px 80px rgba(0,0,0,0.45);
        }
        @media (max-width: 1100px) {
          .academy-admin-shell,
          .student-layout,
          .student-info-grid {
            grid-template-columns: 1fr;
          }
          .academy-admin-sidebar {
            position: static;
          }
        }
        @media (max-width: 720px) {
          .academy-page {
            width: calc(100% - 24px);
            padding-top: 14px;
          }
          .academy-topbar {
            position: static;
            flex-direction: column;
            align-items: stretch;
          }
          .academy-nav {
            width: 100%;
          }
        }
      `}</style>

      <div
        className="academy-shell"
        style={{
          background: adminViewActive
            ? "radial-gradient(circle at top right, rgba(200,52,46,0.10), transparent 26%), linear-gradient(180deg, #F7F2ED 0%, #F2ECE7 100%)"
            : "radial-gradient(circle at top right, rgba(200,52,46,0.16), transparent 30%), linear-gradient(180deg, #111111 0%, #090909 100%)",
        }}
      >
        <div className="academy-page">
          <div className="academy-topbar">
            <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
              <img src={autodromeHeaderLogo} alt="Dubai Autodrome" style={{ height: "32px", width: "auto" }} />
              <div>
                <p style={{ color: "#C8342E", fontSize: "10px", letterSpacing: "0px", textTransform: "uppercase", margin: "0 0 4px 0" }}>
                  DAKA Platform
                </p>
                <h1 style={{ color: "#FFFFFF", fontSize: "24px", fontFamily: "var(--font-heading)", fontWeight: 900, margin: 0, lineHeight: 1 }}>
                  TRAINING DASHBOARDS
                </h1>
              </div>
            </div>

            <div className="academy-nav">
                {([
                  { id: "admin", label: "Admin Dashboard" },
                  { id: "student", label: "User Dashboard" },
                  { id: "student-mobile", label: "Mobile View" },
                ] as const).map((option) => {
                const active = option.id === "admin" ? view === "admin" || view === "admin-attendance" : view === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      if (option.id === "admin") {
                        openAdminLanding();
                        return;
                      }

                      changeView(option.id);
                    }}
                    style={{
                      height: "38px",
                      padding: "0 14px",
                      borderRadius: "999px",
                      border: "none",
                      background: active ? "linear-gradient(135deg, #C8342E 0%, #9E201C 100%)" : "transparent",
                      color: "#FFFFFF",
                      fontSize: "12px",
                      fontFamily: "var(--font-body)",
                      fontWeight: 800,
                      letterSpacing: "0px",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {adminViewActive ? (
            <div className="academy-admin-shell">
              <aside className="academy-admin-sidebar">
                <nav className="academy-admin-sidecard" style={{ display: "grid", gap: "6px", padding: "12px" }}>
                  <div className="academy-admin-brand">
                    <div className="academy-admin-brand-mark">D</div>
                    <div style={{ display: "grid", gap: "4px" }}>
                      <p style={{ color: "#C8342E", fontSize: "10px", textTransform: "uppercase", margin: 0 }}>Admin Workspace</p>
                      <p style={{ color: "#F6F2EE", fontSize: "18px", fontFamily: "var(--font-heading)", fontWeight: 900, margin: 0, lineHeight: 1 }}>
                        Operations Control
                      </p>
                    </div>
                  </div>

                  <AdminWorkspaceButton label="Home" icon={<Home size={16} />} active={view === "admin" && adminScreen === "landing"} onClick={openAdminLanding} fullWidth />
                  <AdminWorkspaceButton
                    label="Attendance"
                    icon={<CalendarDays size={16} />}
                    active={view === "admin-attendance"}
                    onClick={() =>
                      openAdminAttendance({
                        cohortId: effectiveAdminCohortId || undefined,
                        returnToScreen: view === "admin-attendance" ? attendanceContext.returnToScreen : adminScreen,
                      })
                    }
                    disabled={adminCohorts.length === 0}
                    fullWidth
                  />

                  <AdminWorkspaceButton
                    label="Cohort Desk"
                    icon={<Users size={16} />}
                    active={cohortNavActive}
                    onClick={() => toggleAdminSidebarSection("cohort")}
                    trailing={<ChevronDown size={16} style={{ transform: cohortSectionExpanded ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 140ms ease" }} />}
                    fullWidth
                  />
                  {cohortSectionExpanded ? (
                    <div className="academy-admin-subnav">
                      <AdminWorkspaceButton
                        label="Overview"
                        active={view === "admin" && adminScreen === "cohort"}
                        onClick={() => openAdminCohort(effectiveAdminCohortId)}
                        disabled={adminCohorts.length === 0}
                        nested
                        fullWidth
                      />
                      <AdminWorkspaceButton
                        label="Cohort Management"
                        active={view === "admin" && adminScreen === "cohort-management"}
                        onClick={() => openAdminCohortManagement(effectiveAdminCohortId)}
                        nested
                        fullWidth
                      />
                      <AdminWorkspaceButton
                        label="Schedule & Syllabus"
                        active={view === "admin" && adminScreen === "cohort-teaching"}
                        onClick={() => openAdminCohortTeaching(effectiveAdminCohortId)}
                        disabled={adminCohorts.length === 0}
                        nested
                        fullWidth
                      />
                    </div>
                  ) : null}

                  <AdminWorkspaceButton
                    label="Student Desk"
                    icon={<FileText size={16} />}
                    active={studentNavActive}
                    onClick={() => toggleAdminSidebarSection("student")}
                    trailing={<ChevronDown size={16} style={{ transform: studentSectionExpanded ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 140ms ease" }} />}
                    fullWidth
                  />
                  {studentSectionExpanded ? (
                    <div className="academy-admin-subnav">
                      <AdminWorkspaceButton
                        label="Student Management"
                        active={view === "admin" && adminScreen === "student-management"}
                        onClick={() => openAdminStudentManagement(effectiveAdminCohortId)}
                        disabled={adminCohorts.length === 0}
                        nested
                        fullWidth
                      />
                      <AdminWorkspaceButton
                        label="Student Progress"
                        active={view === "admin" && adminScreen === "cohort-reports"}
                        onClick={() => openAdminCohortReports(effectiveAdminCohortId)}
                        disabled={adminCohorts.length === 0}
                        nested
                        fullWidth
                      />
                    </div>
                  ) : null}

                  <AdminWorkspaceButton
                    label="Actions"
                    icon={<Plus size={16} />}
                    active={actionsNavActive}
                    onClick={() => toggleAdminSidebarSection("actions")}
                    trailing={<ChevronDown size={16} style={{ transform: actionsSectionExpanded ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 140ms ease" }} />}
                    fullWidth
                  />
                  {actionsSectionExpanded ? (
                    <div className="academy-admin-subnav">
                      <AdminWorkspaceButton label="Send Announcement" active={false} onClick={openAnnouncementComposer} nested fullWidth />
                    </div>
                  ) : null}
                </nav>
              </aside>

              <div className="academy-content">
                {view === "admin" ? (
                  adminScreen === "landing" ? (
                    <AdminLandingPage
                      key={`landing-${effectiveAdminCohortId || "default"}`}
                      focusedCohortId={effectiveAdminCohortId}
                      onSelectCohort={handleAdminCohortChange}
                      onComposeAnnouncement={openAnnouncementComposer}
                      onOpenAttendance={(context) =>
                        openAdminAttendance({
                          ...context,
                          returnToScreen: "landing",
                        })
                      }
                    />
                  ) : adminScreen === "cohort" ? (
                    <AdminCohortDashboard
                      key={`cohort-${effectiveAdminCohortId || "default"}`}
                      initialCohortId={effectiveAdminCohortId}
                      onSelectCohort={handleAdminCohortChange}
                      onBackToLanding={() => setAdminScreen("landing")}
                      onOpenTeachingOperations={openAdminCohortTeaching}
                      onOpenCohortManagement={openAdminStudentManagement}
                      onOpenCohortReports={(cohortId) => openAdminCohortReports(cohortId)}
                      onOpenAttendance={(context) =>
                        openAdminAttendance({
                          ...context,
                          returnToScreen: "cohort",
                        })
                      }
                    />
                  ) : adminScreen === "cohort-management" ? (
                    <AdminCreateCohortPage
                      mode="manage"
                      onBackToLanding={() => setAdminScreen("landing")}
                      onOpenCreatedCohort={(cohortId) => {
                        setSelectedAdminCohortId(cohortId);
                        setAdminScreen("cohort");
                      }}
                    />
                  ) : adminScreen === "student-management" ? (
                    <AdminCohortManagementPage
                      key={`student-management-${effectiveAdminCohortId || "default"}`}
                      initialCohortId={effectiveAdminCohortId}
                      onOpenReports={openAdminCohortReports}
                      onSelectCohort={handleAdminCohortChange}
                      onBackToCohortDashboard={(cohortId) => {
                        setSelectedAdminCohortId(cohortId);
                        setAdminScreen("cohort");
                      }}
                      onBackToLanding={() => setAdminScreen("landing")}
                    />
                  ) : adminScreen === "cohort-reports" ? (
                    <AdminCohortReportsPage
                      key={`cohort-reports-${effectiveAdminCohortId || "default"}-${selectedAdminStudentId || "all"}`}
                      initialCohortId={effectiveAdminCohortId}
                      initialStudentId={selectedAdminStudentId}
                      onSelectCohort={handleAdminCohortChange}
                      onSelectStudent={setSelectedAdminStudentId}
                      onBackToCohortDashboard={(cohortId) => {
                        setSelectedAdminCohortId(cohortId);
                        setAdminScreen("cohort");
                      }}
                      onOpenCohortManagement={(cohortId) => {
                        setSelectedAdminCohortId(cohortId);
                        setAdminScreen("student-management");
                      }}
                    />
                  ) : (
                    <AdminCohortTeachingPage
                      key={`cohort-teaching-${effectiveAdminCohortId || "default"}`}
                      initialCohortId={effectiveAdminCohortId}
                      onSelectCohort={handleAdminCohortChange}
                      onBackToCohortDashboard={(cohortId) => {
                        setSelectedAdminCohortId(cohortId);
                        setAdminScreen("cohort");
                      }}
                    />
                  )
                ) : (
                  <AdminAttendancePage
                    initialCohortId={attendanceContext.cohortId}
                    initialClassId={attendanceContext.classId}
                    allowCohortSwitch={!attendanceContext.lockedToSession}
                    onSelectionChange={(context) =>
                      {
                        setSelectedAdminCohortId(context.cohortId);
                        setAttendanceContext((current) => ({
                          ...current,
                          ...context,
                        }));
                      }
                    }
                    onBackToDashboard={() => {
                      if (attendanceContext.cohortId) {
                        setSelectedAdminCohortId(attendanceContext.cohortId);
                      }
                      setAdminScreen(attendanceContext.returnToScreen ?? "landing");
                      changeView("admin");
                    }}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="academy-content">
              {view === "student-mobile" ? (
              <div className="mobile-view-shell">
                <div
                  style={{
                    width: "min(860px, 100%)",
                    padding: "28px",
                    borderRadius: "26px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    background:
                      "radial-gradient(circle at top right, rgba(200,52,46,0.2), transparent 30%), linear-gradient(135deg, rgba(24,24,24,0.98) 0%, rgba(12,12,12,0.98) 100%)",
                    boxShadow: "0 24px 70px rgba(0,0,0,0.3)",
                  }}
                >
                  <p style={{ color: "#C8342E", fontSize: "11px", letterSpacing: "0px", textTransform: "uppercase", margin: "0 0 8px 0" }}>
                    User Dashboard
                  </p>
                  <h2 style={{ color: "#FFFFFF", fontSize: "42px", fontFamily: "var(--font-heading)", fontWeight: 900, margin: "0 0 16px 0", lineHeight: 0.96 }}>
                    MOBILE VIEW
                  </h2>

                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => changeView("student")}
                      style={{
                        height: "46px",
                        padding: "0 18px",
                        borderRadius: "999px",
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(255,255,255,0.04)",
                        color: "#FFFFFF",
                        fontSize: "13px",
                        fontFamily: "var(--font-body)",
                        fontWeight: 800,
                        letterSpacing: "0px",
                        textTransform: "uppercase",
                        cursor: "pointer",
                      }}
                    >
                      Back To Split View
                    </button>
                  </div>
                </div>

                <div className="mobile-device-frame">
                  <StudentDashboard />
                </div>
              </div>
            ) : (
              <div className="student-layout">
                <div
                  style={{
                    padding: "28px",
                    borderRadius: "26px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    background:
                      "radial-gradient(circle at top right, rgba(200,52,46,0.18), transparent 32%), linear-gradient(135deg, rgba(24,24,24,0.98) 0%, rgba(14,14,14,0.98) 55%, rgba(8,8,8,0.98) 100%)",
                    boxShadow: "0 24px 70px rgba(0,0,0,0.3)",
                  }}
                >
                  <p style={{ color: "#C8342E", fontSize: "11px", letterSpacing: "0px", textTransform: "uppercase", margin: "0 0 8px 0" }}>
                    Student Experience
                  </p>
                  <h2 style={{ color: "#FFFFFF", fontSize: "42px", fontFamily: "var(--font-heading)", fontWeight: 900, margin: "0 0 16px 0", lineHeight: 0.96 }}>
                    MOBILE DASHBOARD PREVIEW
                  </h2>

                  <div className="student-info-grid" style={{ marginBottom: "22px" }}>
                    <InfoCard label="Form Factor" value="375px" note="Kept as a phone-first student interface" />
                    <InfoCard label="Current Driver" value="Ahmed" note="Advanced level student profile loaded" />
                    <InfoCard label="Next Session" value="5 May" note="Level 2 continuation CTA remains intact" />
                  </div>

                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => changeView("student-mobile")}
                      style={{
                        height: "46px",
                        padding: "0 18px",
                        borderRadius: "999px",
                        border: "none",
                        background: "linear-gradient(135deg, #C8342E 0%, #9E201C 100%)",
                        color: "#FFFFFF",
                        fontSize: "13px",
                        fontFamily: "var(--font-body)",
                        fontWeight: 800,
                        letterSpacing: "0px",
                        textTransform: "uppercase",
                        cursor: "pointer",
                      }}
                    >
                      Open Mobile View
                    </button>
                    <span style={{ padding: "9px 12px", borderRadius: "999px", backgroundColor: "rgba(200,52,46,0.12)", border: "1px solid rgba(200,52,46,0.3)", color: "#FFFFFF", fontSize: "12px", letterSpacing: "0px", textTransform: "uppercase" }}>
                      Same red-black theme
                    </span>
                    <span style={{ padding: "9px 12px", borderRadius: "999px", backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFFFFF", fontSize: "12px", letterSpacing: "0px", textTransform: "uppercase" }}>
                      Existing learning path preserved
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "center" }}>
                  <StudentDashboard />
                </div>
              </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isAnnouncementComposerOpen ? (
        <div
          onClick={closeAnnouncementComposer}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(22,18,14,0.36)",
            backdropFilter: "blur(4px)",
            display: "grid",
            placeItems: "center",
            padding: "24px",
            zIndex: 60,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "min(760px, 100%)",
              padding: "22px",
              borderRadius: "24px",
              border: "1px solid rgba(43,31,22,0.10)",
              background:
                "radial-gradient(circle at top right, rgba(200,52,46,0.10), transparent 26%), linear-gradient(180deg, #FFFFFF 0%, #FBF8F4 100%)",
              boxShadow: "0 24px 70px rgba(22,18,14,0.22)",
              display: "grid",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", alignItems: "flex-start" }}>
              <div style={{ display: "grid", gap: "6px" }}>
                <p style={{ color: "#C8342E", fontSize: "10px", letterSpacing: "0px", textTransform: "uppercase", margin: 0 }}>
                  Workspace Announcements
                </p>
                <h2 style={{ color: "#16120E", fontSize: "28px", fontFamily: "var(--font-heading)", margin: 0, lineHeight: 1 }}>
                  Send Announcement
                </h2>
              </div>
              <button
                type="button"
                onClick={closeAnnouncementComposer}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "999px",
                  border: "1px solid rgba(43,31,22,0.10)",
                  backgroundColor: "#FFFFFF",
                  color: "#16120E",
                  fontSize: "20px",
                  lineHeight: 1,
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: "grid", gap: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                <p style={{ color: "#918378", fontSize: "11px", fontWeight: 700, letterSpacing: "0px", textTransform: "uppercase", margin: 0 }}>
                  Target Cohorts
                </p>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() =>
                      setWorkspaceAnnouncementDraft((current) => ({
                        ...current,
                        targetCohortIds: adminCohorts.map((cohort) => cohort.id),
                      }))
                    }
                    style={{
                      minHeight: "30px",
                      padding: "0 10px",
                      borderRadius: "999px",
                      border: "1px solid rgba(43,31,22,0.08)",
                      backgroundColor: "#FFFFFF",
                      color: "#6B5F55",
                      fontSize: "10px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      cursor: "pointer",
                    }}
                  >
                    All Active
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setWorkspaceAnnouncementDraft((current) => ({
                        ...current,
                        targetCohortIds: currentAdminCohort ? [currentAdminCohort.id] : [],
                      }))
                    }
                    style={{
                      minHeight: "30px",
                      padding: "0 10px",
                      borderRadius: "999px",
                      border: "1px solid rgba(43,31,22,0.08)",
                      backgroundColor: "#FFFFFF",
                      color: "#6B5F55",
                      fontSize: "10px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      cursor: "pointer",
                    }}
                  >
                    Current Cohort
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px" }}>
                {adminCohorts.map((cohort) => {
                  const selected = workspaceAnnouncementDraft.targetCohortIds.includes(cohort.id);

                  return (
                    <label
                      key={cohort.id}
                      style={{
                        display: "grid",
                        gap: "6px",
                        padding: "12px",
                        borderRadius: "16px",
                        border: selected ? "1px solid rgba(200,52,46,0.18)" : "1px solid rgba(43,31,22,0.08)",
                        background: selected ? "linear-gradient(135deg, rgba(200,52,46,0.08) 0%, #FFFFFF 100%)" : "#FFFFFF",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", alignItems: "flex-start" }}>
                        <div style={{ display: "grid", gap: "4px" }}>
                          <p style={{ color: "#16120E", fontSize: "15px", fontWeight: 800, margin: 0 }}>
                            {cohort.name}
                          </p>
                          <p style={{ color: "#6B5F55", fontSize: "11px", margin: 0 }}>
                            {cohort.program}
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => handleAnnouncementTargetToggle(cohort.id)}
                        />
                      </div>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <span style={{ padding: "5px 8px", borderRadius: "999px", border: "1px solid rgba(43,31,22,0.08)", backgroundColor: "#F8F4EF", color: "#6B5F55", fontSize: "9px", textTransform: "uppercase" }}>
                          Coach {cohort.coach}
                        </span>
                        {cohort.id === currentAdminCohort?.id ? (
                          <span style={{ padding: "5px 8px", borderRadius: "999px", border: "1px solid rgba(200,52,46,0.18)", backgroundColor: "rgba(200,52,46,0.08)", color: "#C8342E", fontSize: "9px", textTransform: "uppercase" }}>
                            Current
                          </span>
                        ) : null}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "grid", gap: "10px" }}>
              <label style={{ display: "grid", gap: "6px" }}>
                <span style={{ color: "#918378", fontSize: "11px", fontWeight: 700, letterSpacing: "0px", textTransform: "uppercase" }}>
                  Announcement Title
                </span>
                <input
                  value={workspaceAnnouncementDraft.title}
                  onChange={(event) =>
                    setWorkspaceAnnouncementDraft((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Track update, schedule change, or coaching note"
                  style={{
                    width: "100%",
                    height: "46px",
                    padding: "0 14px",
                    borderRadius: "14px",
                    border: "1px solid rgba(43,31,22,0.10)",
                    background: "#F5F0EA",
                    color: "#16120E",
                    fontSize: "13px",
                    fontFamily: "var(--font-body)",
                    outline: "none",
                  }}
                />
              </label>

              <label style={{ display: "grid", gap: "6px" }}>
                <span style={{ color: "#918378", fontSize: "11px", fontWeight: 700, letterSpacing: "0px", textTransform: "uppercase" }}>
                  Message
                </span>
                <textarea
                  value={workspaceAnnouncementDraft.message}
                  onChange={(event) =>
                    setWorkspaceAnnouncementDraft((current) => ({
                      ...current,
                      message: event.target.value,
                    }))
                  }
                  placeholder="Write the announcement once, then send it to the selected cohorts."
                  style={{
                    width: "100%",
                    minHeight: "120px",
                    padding: "12px 14px",
                    resize: "vertical",
                    borderRadius: "14px",
                    border: "1px solid rgba(43,31,22,0.10)",
                    background: "#F5F0EA",
                    color: "#16120E",
                    fontSize: "13px",
                    fontFamily: "var(--font-body)",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </label>

              <label style={{ display: "grid", gap: "6px", maxWidth: "220px" }}>
                <span style={{ color: "#918378", fontSize: "11px", fontWeight: 700, letterSpacing: "0px", textTransform: "uppercase" }}>
                  Optional Expiry
                </span>
                <input
                  type="date"
                  value={workspaceAnnouncementDraft.expiresAt}
                  onChange={(event) =>
                    setWorkspaceAnnouncementDraft((current) => ({
                      ...current,
                      expiresAt: event.target.value,
                    }))
                  }
                  style={{
                    width: "100%",
                    height: "46px",
                    padding: "0 14px",
                    borderRadius: "14px",
                    border: "1px solid rgba(43,31,22,0.10)",
                    background: "#F5F0EA",
                    color: "#16120E",
                    fontSize: "13px",
                    fontFamily: "var(--font-body)",
                    outline: "none",
                  }}
                />
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
              <p style={{ color: "#6B5F55", fontSize: "12px", margin: 0 }}>
                {workspaceAnnouncementDraft.targetCohortIds.length} cohort{workspaceAnnouncementDraft.targetCohortIds.length === 1 ? "" : "s"} selected
              </p>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={closeAnnouncementComposer}
                  style={{
                    minHeight: "42px",
                    padding: "0 16px",
                    borderRadius: "999px",
                    border: "1px solid rgba(43,31,22,0.10)",
                    backgroundColor: "#FFFFFF",
                    color: "#16120E",
                    fontSize: "11px",
                    fontFamily: "var(--font-body)",
                    fontWeight: 800,
                    letterSpacing: "0px",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleWorkspaceAnnouncementSubmit}
                  style={{
                    minHeight: "42px",
                    padding: "0 16px",
                    borderRadius: "999px",
                    border: "1px solid rgba(200,52,46,0.18)",
                    background: "linear-gradient(135deg, rgba(200,52,46,0.16) 0%, rgba(255,255,255,0.96) 100%)",
                    color: "#9E201C",
                    fontSize: "11px",
                    fontFamily: "var(--font-body)",
                    fontWeight: 800,
                    letterSpacing: "0px",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  Send Announcement
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
