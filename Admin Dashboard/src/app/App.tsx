import { Suspense, lazy, useEffect, useState, type ReactNode } from "react";
import { BarChart3, CalendarDays, Clock3, FileText, GraduationCap, Home, Megaphone, Users } from "lucide-react";
import autodromeHeaderLogo from "../assets/autodrome-header-logo.svg";
import { AdminAnnouncementsPage } from "./components/AdminAnnouncementsPage";
import { AdminAttendancePage } from "./components/AdminAttendancePage";
import { AdminCohortsPage } from "./components/AdminCreateCohortPage";
import { AdminDashboardPage } from "./components/AdminCohortDashboard";
import { AdminReportsPage } from "./components/AdminCohortReportsPage";
import { loadCohorts, T } from "./components/AdminDashboard";
import { AdminStudentsPage } from "./components/AdminCohortManagementPage";
import { AdminSchedulePage } from "./components/AdminCohortTeachingPage";
import { StudentDashboard } from "./components/StudentDashboard";

const AdminWebsiteReportsPage = lazy(async () => {
  const module = await import("./components/AdminWebsiteReportsPage");
  return { default: module.AdminWebsiteReportsPage };
});

type DashboardView = "student" | "admin" | "admin-attendance" | "student-mobile";
type AdminScreen = "dashboard" | "schedule" | "cohorts" | "students" | "reports" | "website-reports" | "announcements";

function getInitialView(): DashboardView {
  if (typeof window === "undefined") return "admin";
  if (window.location.hash === "#student-mobile") return "student-mobile";
  if (window.location.hash === "#student") return "student";
  if (window.location.hash === "#admin-attendance") return "admin-attendance";
  const viewParam = new URLSearchParams(window.location.search).get("view");
  if (viewParam === "admin-attendance") return "admin-attendance";
  if (viewParam === "student-mobile") return "student-mobile";
  if (viewParam === "student") return "student";
  return "admin";
}

function getInitialAdminContext() {
  if (typeof window === "undefined") return { screen: "dashboard" as AdminScreen, cohortId: "", studentId: "" };
  const params = new URLSearchParams(window.location.search);
  const screen = params.get("screen");
  const screenMap: Record<string, AdminScreen> = {
    dashboard: "dashboard",
    landing: "dashboard",
    cohort: "dashboard",
    schedule: "schedule",
    "cohort-teaching": "schedule",
    cohorts: "cohorts",
    "cohort-management": "cohorts",
    students: "students",
    "student-management": "students",
    reports: "reports",
    "student-progress": "reports",
    "cohort-reports": "reports",
    "website-reports": "website-reports",
    announcements: "announcements",
  };
  return {
    screen: (screen && screenMap[screen]) || "dashboard",
    cohortId: params.get("cohortId") ?? "",
    studentId: params.get("studentId") ?? "",
  };
}

function getInitialAttendanceContext() {
  if (typeof window === "undefined") return { cohortId: "", classId: "", lockedToSession: false };
  const params = new URLSearchParams(window.location.search);
  const classId = params.get("classId") ?? "";
  return { cohortId: params.get("cohortId") ?? "", classId, lockedToSession: Boolean(classId) };
}

function NavButton({ label, active, onClick, icon, badge }: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon?: ReactNode;
  badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      style={{
        minHeight: T.controlMd,
        padding: `0 ${T.space3}`,
        width: "100%",
        borderRadius: T.radiusMd,
        border: active ? `1px solid ${T.sidebarBorder}` : "1px solid transparent",
        background: active ? "linear-gradient(180deg, rgba(74,125,255,0.24) 0%, rgba(59,130,246,0.14) 100%)" : "transparent",
        color: active ? T.sidebarTextActive : T.sidebarText,
        fontSize: T.textBase,
        fontFamily: "var(--font-body)",
        fontWeight: active ? 700 : 600,
        cursor: "pointer",
        textAlign: "left",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: T.space2,
        position: "relative",
        boxShadow: active ? "0 10px 22px rgba(44,91,227,0.18), inset 0 1px 0 rgba(255,255,255,0.08)" : "none",
        transition: "background 120ms ease, color 120ms ease, box-shadow 120ms ease",
      }}
    >
      {active ? <span style={{ position: "absolute", left: "8px", top: "50%", transform: "translateY(-50%)", width: "3px", height: "14px", borderRadius: "999px", backgroundColor: T.sidebarAccent, boxShadow: "0 0 12px rgba(116,164,255,0.48)" }} /> : null}
      <span style={{ display: "inline-flex", alignItems: "center", gap: T.space2, minWidth: 0 }}>
        {icon ? <span style={{ display: "inline-flex", color: active ? "#CFE0FF" : T.sidebarMuted, flexShrink: 0 }}>{icon}</span> : null}
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
      </span>
      {badge != null && badge > 0 ? (
        <span
          style={{
            minWidth: "18px",
            height: "18px",
            borderRadius: "999px",
            backgroundColor: T.badgeBg,
            color: T.badgeText,
            fontSize: T.textXs,
            fontWeight: 700,
            display: "grid",
            placeItems: "center",
            padding: "0 6px",
            flexShrink: 0,
          }}
        >
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function InfoCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div style={{ padding: "14px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)", background: "linear-gradient(135deg, rgba(24,24,24,0.96) 0%, rgba(15,15,15,0.96) 100%)" }}>
      <p style={{ color: "#7A7A7A", fontSize: "10px", textTransform: "uppercase", margin: "0 0 8px 0" }}>{label}</p>
      <p style={{ color: "#FFFFFF", fontSize: "24px", fontFamily: "var(--font-body)", fontWeight: 900, margin: "0 0 4px 0", lineHeight: 1 }}>{value}</p>
      <p style={{ color: "#A7A7A7", fontSize: "12px", margin: 0 }}>{note}</p>
    </div>
  );
}

export default function App() {
  const initialAdmin = getInitialAdminContext();
  const initialAttendance = getInitialAttendanceContext();

  const [view, setView] = useState<DashboardView>(() => getInitialView());
  const [adminScreen, setAdminScreen] = useState<AdminScreen>(initialAdmin.screen);
  const [selectedCohortId, setSelectedCohortId] = useState<string>(() => initialAdmin.cohortId || (loadCohorts()[0]?.id ?? ""));
  const [selectedStudentId, setSelectedStudentId] = useState<string>(() => initialAdmin.studentId || "");
  const [attendanceContext, setAttendanceContext] = useState<{ cohortId?: string; classId?: string; returnToScreen?: AdminScreen; lockedToSession?: boolean }>(() => initialAttendance);

  const adminActive = view === "admin" || view === "admin-attendance";
  const adminCohorts = adminActive ? loadCohorts().filter((cohort) => !cohort.archived) : [];
  const effectiveCohortId = selectedCohortId || adminCohorts[0]?.id || "";

  const needsAttendanceBadge = adminCohorts.reduce((count, cohort) => {
    const now = Date.now();
    return count + cohort.classes.filter((session) => {
      const stamp = new Date(`${session.date}T${session.time}:00`).getTime();
      return stamp < now && (session.attendanceStatus ?? "pending") === "pending";
    }).length;
  }, 0);

  const activeAnnouncementBadge = adminCohorts.reduce((count, cohort) => {
    const now = new Date();
    return count + cohort.announcements.filter((announcement) => !announcement.expiresAt || new Date(announcement.expiresAt) >= now).length;
  }, 0);

  useEffect(() => {
    const handleHashChange = () => setView(getInitialView());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete("screen");
    url.searchParams.delete("cohortId");
    url.searchParams.delete("studentId");
    url.searchParams.delete("classId");
    url.searchParams.delete("view");

    if (view === "admin") {
      url.hash = "#admin";
      if (adminScreen !== "dashboard") url.searchParams.set("screen", adminScreen);
      if (effectiveCohortId) url.searchParams.set("cohortId", effectiveCohortId);
      if (selectedStudentId) url.searchParams.set("studentId", selectedStudentId);
    } else if (view === "admin-attendance") {
      url.hash = "#admin-attendance";
      if (attendanceContext.cohortId) url.searchParams.set("cohortId", attendanceContext.cohortId);
      if (attendanceContext.classId) url.searchParams.set("classId", attendanceContext.classId);
    } else if (view === "student-mobile") {
      url.hash = "#student-mobile";
    } else {
      url.hash = "#student";
    }

    window.history.replaceState(null, "", url.toString());
  }, [adminScreen, attendanceContext.classId, attendanceContext.cohortId, effectiveCohortId, selectedStudentId, view]);

  function go(screen: AdminScreen, opts?: { cohortId?: string; studentId?: string }) {
    if (opts?.cohortId) setSelectedCohortId(opts.cohortId);
    if (opts?.studentId !== undefined) setSelectedStudentId(opts.studentId);
    if (!opts?.studentId) setSelectedStudentId("");
    setAdminScreen(screen);
    setView("admin");
  }

  function goAttendance(ctx?: { cohortId?: string; classId?: string }) {
    if (ctx?.cohortId) setSelectedCohortId(ctx.cohortId);
    setAttendanceContext({ ...ctx, returnToScreen: adminScreen, lockedToSession: Boolean(ctx?.classId) });
    setView("admin-attendance");
  }

  function changeCohort(id: string) {
    setSelectedCohortId(id);
  }

  return (
    <>
      <style>{`
        .shell { min-height: 100vh; font-family: var(--font-body); }
        .shell h1,.shell h2,.shell h3,.shell h4,.shell h5,.shell h6 { font-family: var(--font-body); font-style: normal; letter-spacing: 0; }
        .page { width: min(1760px, calc(100% - 32px)); margin: 0 auto; padding: 20px 0 28px; }
        .topbar {
          display: flex; align-items: center; justify-content: space-between; gap: ${T.space3};
          padding: ${T.space3} ${T.space4}; border: 1px solid rgba(255,255,255,0.08); border-radius: ${T.radiusLg};
          background: linear-gradient(135deg, rgba(18,18,18,0.98) 0%, rgba(8,8,8,0.98) 100%);
          box-shadow: 0 20px 60px rgba(0,0,0,0.24);
          margin-bottom: 16px; position: sticky; top: 12px; z-index: 50;
        }
        .view-switcher { display: inline-flex; gap: 4px; padding: 4px; border-radius: ${T.radiusMd}; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); }
        .admin-grid { display: grid; grid-template-columns: 252px minmax(0, 1fr); gap: ${T.space4}; align-items: start; min-width: 0; }
        .sidebar { position: sticky; top: 84px; display: grid; gap: ${T.space3}; }
        .sidebar-card { border-radius: ${T.radiusLg}; border: 1px solid ${T.sidebarBorder}; background: linear-gradient(135deg, rgba(18,18,18,0.98) 0%, rgba(8,8,8,0.98) 100%); padding: ${T.space4} ${T.space3}; display: grid; gap: ${T.space3}; box-shadow: 0 20px 60px rgba(0,0,0,0.24); }
        .sidebar-group { display: grid; gap: 4px; }
        .sidebar-label { padding: 0 ${T.space2} ${T.space1}; color: ${T.sidebarMuted}; font-size: ${T.textXs}; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
        .content { display: grid; gap: ${T.space4}; min-width: 0; }
        .student-layout { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(380px, 420px); gap: 24px; align-items: start; }
        .student-info-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
        .mobile-view-shell { display: grid; gap: 24px; justify-items: center; }
        .mobile-device-frame { padding: 14px; border-radius: 38px; border: 1px solid rgba(255,255,255,0.08); background: linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%), linear-gradient(135deg, rgba(24,24,24,0.98) 0%, rgba(9,9,9,0.98) 100%); box-shadow: 0 30px 80px rgba(0,0,0,0.45); }
        @media (max-width: 1180px) {
          .admin-grid, .student-layout, .student-info-grid { grid-template-columns: 1fr; }
          .sidebar { position: static; }
        }
        @media (max-width: 720px) {
          .page { width: calc(100% - 24px); }
          .topbar { position: static; flex-direction: column; align-items: stretch; }
        }
      `}</style>

      <div className="shell" style={{ background: adminActive ? T.bg : "linear-gradient(180deg, #111827 0%, #0B1120 100%)" }}>
        <div className="page">
          <div className="topbar">
            <div style={{ display: "flex", alignItems: "center", gap: T.space4 }}>
              <img src={autodromeHeaderLogo} alt="Dubai Autodrome" style={{ height: "30px", width: "auto" }} />
              <div>
                <p style={{ color: "rgba(255,255,255,0.56)", fontSize: T.textXs, textTransform: "uppercase", letterSpacing: "0.08em", margin: `0 0 ${T.space1} 0`, fontWeight: 700 }}>DAKA Platform</p>
                <h1 style={{ color: "#FFFFFF", fontSize: T.textXl, fontWeight: 700, margin: 0, lineHeight: 1.05, letterSpacing: "-0.02em" }}>Academy Operations Suite</h1>
              </div>
            </div>

            <div className="view-switcher">
              {([{ id: "admin", label: "Admin" }, { id: "student", label: "Student" }, { id: "student-mobile", label: "Mobile" }] as const).map((option) => {
                const isActive = option.id === "admin" ? adminActive : view === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      if (option.id === "admin") go("dashboard", { cohortId: effectiveCohortId });
                      else setView(option.id);
                    }}
                    style={{
                      height: T.controlMd,
                      padding: `0 ${T.space4}`,
                      borderRadius: T.radiusMd,
                      border: isActive ? "1px solid rgba(255,255,255,0.14)" : "1px solid transparent",
                      background: isActive ? "#FFFFFF" : "transparent",
                      color: isActive ? "#111827" : "rgba(255,255,255,0.72)",
                      fontSize: T.textBase,
                      fontFamily: "var(--font-body)",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {adminActive ? (
            <div className="admin-grid">
              <aside className="sidebar">
                <nav className="sidebar-card">
                  <div style={{ padding: `0 ${T.space2} ${T.space1}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: T.space3 }}>
                      <div style={{ width: "34px", height: "34px", borderRadius: T.radiusMd, background: "rgba(255,255,255,0.06)", border: `1px solid ${T.sidebarBorder}`, display: "grid", placeItems: "center", color: "#FFFFFF", fontSize: T.textMd, fontWeight: 800, flexShrink: 0 }}>D</div>
                      <div>
                        <p style={{ color: T.sidebarMuted, fontSize: T.textXs, textTransform: "uppercase", letterSpacing: "0.08em", margin: `0 0 ${T.space1} 0`, fontWeight: 700 }}>Admin workspace</p>
                        <p style={{ color: T.sidebarTextActive, fontSize: T.textLg, fontWeight: 700, margin: 0, lineHeight: 1.05 }}>Operations</p>
                      </div>
                    </div>
                  </div>

                  <div className="sidebar-group">
                    <p className="sidebar-label">Operations</p>
                    <NavButton label="Dashboard" icon={<Home size={15} />} active={view === "admin" && adminScreen === "dashboard"} onClick={() => go("dashboard", { cohortId: effectiveCohortId })} />
                    <NavButton label="Attendance" icon={<CalendarDays size={15} />} active={view === "admin-attendance"} onClick={() => goAttendance()} badge={needsAttendanceBadge} />
                    <NavButton label="Schedule" icon={<Clock3 size={15} />} active={view === "admin" && adminScreen === "schedule"} onClick={() => go("schedule", { cohortId: effectiveCohortId })} />
                  </div>

                  <div className="sidebar-group">
                    <p className="sidebar-label">Management</p>
                    <NavButton label="Cohorts" icon={<Users size={15} />} active={view === "admin" && adminScreen === "cohorts"} onClick={() => go("cohorts", { cohortId: effectiveCohortId })} />
                    <NavButton label="Students" icon={<GraduationCap size={15} />} active={view === "admin" && adminScreen === "students"} onClick={() => go("students", { cohortId: effectiveCohortId })} />
                  </div>

                  <div className="sidebar-group">
                    <p className="sidebar-label">Insights</p>
                    <NavButton label="Student Progress" icon={<FileText size={15} />} active={view === "admin" && adminScreen === "reports"} onClick={() => go("reports", { cohortId: effectiveCohortId })} />
                    <NavButton label="Website Reports" icon={<BarChart3 size={15} />} active={view === "admin" && adminScreen === "website-reports"} onClick={() => go("website-reports", { cohortId: effectiveCohortId })} />
                  </div>

                  <div className="sidebar-group">
                    <p className="sidebar-label">Communication</p>
                    <NavButton label="Announcements" icon={<Megaphone size={15} />} active={view === "admin" && adminScreen === "announcements"} onClick={() => go("announcements", { cohortId: effectiveCohortId })} badge={activeAnnouncementBadge} />
                  </div>
                </nav>
              </aside>

              <div className="content">
                {view === "admin-attendance" ? (
                  <AdminAttendancePage
                    initialCohortId={attendanceContext.cohortId}
                    initialClassId={attendanceContext.classId}
                    allowCohortSwitch={!attendanceContext.lockedToSession}
                    onSelectionChange={(ctx) => {
                      setSelectedCohortId(ctx.cohortId);
                      setAttendanceContext((current) => ({
                        ...current,
                        cohortId: ctx.cohortId,
                        classId: ctx.classId,
                      }));
                    }}
                    onBackToDashboard={() => {
                      if (attendanceContext.cohortId) setSelectedCohortId(attendanceContext.cohortId);
                      setAdminScreen(attendanceContext.returnToScreen ?? "dashboard");
                      setView("admin");
                    }}
                  />
                ) : adminScreen === "dashboard" ? (
                  <AdminDashboardPage
                    key={`dash-${effectiveCohortId}`}
                    initialCohortId={effectiveCohortId}
                    onOpenAttendance={(ctx) => goAttendance(ctx)}
                    onOpenSchedule={(cohortId) => go("schedule", { cohortId })}
                    onOpenCohorts={() => go("cohorts", { cohortId: effectiveCohortId })}
                    onOpenStudents={(cohortId) => go("students", { cohortId })}
                    onOpenReports={(cohortId) => go("reports", { cohortId })}
                    onOpenWebsiteReports={() => go("website-reports", { cohortId: effectiveCohortId })}
                    onOpenAnnouncements={(cohortId) => go("announcements", cohortId ? { cohortId } : undefined)}
                  />
                ) : adminScreen === "schedule" ? (
                  <AdminSchedulePage
                    key={`schedule-${effectiveCohortId}`}
                    initialCohortId={effectiveCohortId}
                    onSelectCohort={changeCohort}
                  />
                ) : adminScreen === "cohorts" ? (
                  <AdminCohortsPage
                    onOpenCohort={(cohortId) => go("dashboard", { cohortId })}
                  />
                ) : adminScreen === "students" ? (
                  <AdminStudentsPage
                    key={`students-${effectiveCohortId}`}
                    initialCohortId={effectiveCohortId}
                    onSelectCohort={changeCohort}
                    onOpenReports={(cohortId, studentId) => go("reports", { cohortId, studentId })}
                  />
                ) : adminScreen === "reports" ? (
                  <AdminReportsPage
                    key={`reports-${effectiveCohortId}`}
                    initialCohortId={effectiveCohortId}
                    initialStudentId={selectedStudentId}
                    onSelectCohort={changeCohort}
                    onSelectStudent={(studentId) => setSelectedStudentId(studentId)}
                  />
                ) : adminScreen === "website-reports" ? (
                  <Suspense fallback={<div style={{ color: T.muted, fontSize: T.textMd }}>Loading website reports...</div>}>
                    <AdminWebsiteReportsPage
                      key="website-reports"
                      onOpenCohort={(cohortId) => go("dashboard", { cohortId })}
                      onOpenAttendance={(ctx) => goAttendance(ctx)}
                      onOpenReports={(cohortId) => go("reports", { cohortId })}
                    />
                  </Suspense>
                ) : (
                  <AdminAnnouncementsPage
                    key={`announcements-${effectiveCohortId}`}
                    initialCohortId={effectiveCohortId}
                    onSelectCohort={changeCohort}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="content">
              {view === "student-mobile" ? (
                <div className="mobile-view-shell">
                  <div style={{ width: "min(860px, 100%)", padding: "28px", borderRadius: "26px", border: "1px solid rgba(255,255,255,0.08)", background: "radial-gradient(circle at top right, rgba(200,52,46,0.2), transparent 30%), linear-gradient(135deg, rgba(24,24,24,0.98) 0%, rgba(12,12,12,0.98) 100%)", boxShadow: "0 24px 70px rgba(0,0,0,0.3)" }}>
                    <p style={{ color: "#C8342E", fontSize: "11px", textTransform: "uppercase", margin: "0 0 8px 0" }}>User Dashboard</p>
                    <h2 style={{ color: "#FFFFFF", fontSize: "34px", fontWeight: 800, margin: "0 0 16px 0", lineHeight: 0.98 }}>Mobile View</h2>
                    <button type="button" onClick={() => setView("student")} style={{ height: "46px", padding: "0 18px", borderRadius: "999px", border: "1px solid rgba(106,152,255,0.68)", background: "linear-gradient(180deg, rgba(87,136,255,0.98) 0%, rgba(59,130,246,0.92) 52%, rgba(44,91,227,0.92) 100%)", color: "#FFFFFF", fontSize: "13px", fontWeight: 800, textTransform: "uppercase", cursor: "pointer", boxShadow: "0 14px 28px rgba(44,91,227,0.28), inset 0 1px 0 rgba(255,255,255,0.16)" }}>
                      Back To Split View
                    </button>
                  </div>
                  <div className="mobile-device-frame"><StudentDashboard /></div>
                </div>
              ) : (
                <div className="student-layout">
                  <div style={{ padding: "28px", borderRadius: "26px", border: "1px solid rgba(255,255,255,0.08)", background: "radial-gradient(circle at top right, rgba(200,52,46,0.18), transparent 32%), linear-gradient(135deg, rgba(24,24,24,0.98) 0%, rgba(14,14,14,0.98) 55%, rgba(8,8,8,0.98) 100%)", boxShadow: "0 24px 70px rgba(0,0,0,0.3)" }}>
                    <p style={{ color: "#C8342E", fontSize: "11px", textTransform: "uppercase", margin: "0 0 8px 0" }}>Student Experience</p>
                    <h2 style={{ color: "#FFFFFF", fontSize: "34px", fontWeight: 800, margin: "0 0 16px 0", lineHeight: 0.98 }}>Mobile Dashboard Preview</h2>
                    <div className="student-info-grid" style={{ marginBottom: "22px" }}>
                      <InfoCard label="Form Factor" value="375px" note="Kept as a phone-first student interface" />
                      <InfoCard label="Current Driver" value="Ahmed" note="Advanced level student profile loaded" />
                      <InfoCard label="Next Session" value="5 May" note="Level 2 continuation CTA remains intact" />
                    </div>
                    <button type="button" onClick={() => setView("student-mobile")} style={{ height: "46px", padding: "0 18px", borderRadius: "999px", border: "1px solid rgba(106,152,255,0.68)", background: "linear-gradient(180deg, rgba(87,136,255,0.98) 0%, rgba(59,130,246,0.92) 52%, rgba(44,91,227,0.92) 100%)", color: "#FFFFFF", fontSize: "13px", fontWeight: 800, textTransform: "uppercase", cursor: "pointer", boxShadow: "0 14px 28px rgba(44,91,227,0.28), inset 0 1px 0 rgba(255,255,255,0.16)" }}>
                      Open Mobile View
                    </button>
                  </div>
                  <div className="mobile-device-frame"><StudentDashboard /></div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
