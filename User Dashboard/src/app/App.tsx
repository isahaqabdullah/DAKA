import { useEffect, useState } from "react";
import autodromeHeaderLogo from "../assets/autodrome-header-logo.svg";
import { AdminCreateCohortPage } from "./components/AdminCreateCohortPage";
import { AdminAttendancePage } from "./components/AdminAttendancePage";
import { AdminCohortDashboard } from "./components/AdminCohortDashboard";
import { AdminCohortManagementPage } from "./components/AdminCohortManagementPage";
import { AdminCohortTeachingPage } from "./components/AdminCohortTeachingPage";
import { AdminLandingPage } from "./components/AdminLandingPage";
import { StudentDashboard } from "./components/StudentDashboard";

type DashboardView = "student" | "admin" | "admin-attendance" | "student-mobile";

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
      screen: "landing" as const,
      cohortId: "",
    };
  }

  const params = new URLSearchParams(window.location.search);
  const screen = params.get("screen");
  const cohortId = params.get("cohortId") ?? "";

  if (screen === "cohort" && cohortId) {
    return {
      screen: "cohort" as const,
      cohortId,
    };
  }

  if (screen === "cohort-management" && cohortId) {
    return {
      screen: "cohort-management" as const,
      cohortId,
    };
  }

  if (screen === "cohort-teaching" && cohortId) {
    return {
      screen: "cohort-teaching" as const,
      cohortId,
    };
  }

  if (screen === "cohort-create") {
    return {
      screen: "cohort-create" as const,
      cohortId: "",
    };
  }

  return {
    screen: "landing" as const,
    cohortId: "",
  };
}

function InfoCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div
      style={{
        padding: "18px",
        borderRadius: "18px",
        border: "1px solid rgba(255,255,255,0.08)",
        background: "linear-gradient(135deg, rgba(24,24,24,0.96) 0%, rgba(15,15,15,0.96) 100%)",
      }}
    >
      <p style={{ color: "#7A7A7A", fontSize: "10px", letterSpacing: "0px", textTransform: "uppercase", margin: "0 0 10px 0" }}>
        {label}
      </p>
      <p style={{ color: "#FFFFFF", fontSize: "28px", fontFamily: "var(--font-body)", fontWeight: 900, margin: "0 0 6px 0", lineHeight: 1 }}>
        {value}
      </p>
      <p style={{ color: "#A7A7A7", fontSize: "13px", margin: 0 }}>{note}</p>
    </div>
  );
}

export default function App() {
  const initialAdminContext = getInitialAdminContext();
  const [view, setView] = useState<DashboardView>(() => getInitialView());
  const [attendanceContext, setAttendanceContext] = useState<{
    cohortId?: string;
    classId?: string;
    returnTo?: "landing" | "cohort";
  }>({});
  const [adminScreen, setAdminScreen] = useState<"landing" | "cohort" | "cohort-management" | "cohort-teaching" | "cohort-create">(initialAdminContext.screen);
  const [selectedAdminCohortId, setSelectedAdminCohortId] = useState<string>(initialAdminContext.cohortId);
  const adminViewActive = view === "admin" || view === "admin-attendance";

  useEffect(() => {
    const handleHashChange = () => {
      setView(getInitialView());
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  function changeView(nextView: DashboardView) {
    setView(nextView);
    const hashByView: Record<DashboardView, string> = {
      admin: "#admin",
      "admin-attendance": "#admin-attendance",
      student: "#student",
      "student-mobile": "#student-mobile",
    };

    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.delete("view");
    nextUrl.hash = hashByView[nextView];
    window.history.replaceState(null, "", nextUrl.toString());
  }

  function openAdminLanding() {
    setAdminScreen("landing");
    changeView("admin");
  }

  function openAdminCohort(cohortId: string) {
    setSelectedAdminCohortId(cohortId);
    setAdminScreen("cohort");
    changeView("admin");
  }

  function openAdminCohortManagement(cohortId: string) {
    setSelectedAdminCohortId(cohortId);
    setAdminScreen("cohort-management");
    changeView("admin");
  }

  function openAdminCohortTeaching(cohortId: string) {
    setSelectedAdminCohortId(cohortId);
    setAdminScreen("cohort-teaching");
    changeView("admin");
  }

  function openAdminCohortCreate() {
    setAdminScreen("cohort-create");
    changeView("admin");
  }

  return (
    <>
      <style>{`
        .academy-shell {
          min-height: 100vh;
          font-family: var(--font-body);
        }
        .academy-page {
          width: min(1400px, calc(100% - 48px));
          margin: 0 auto;
          padding: 28px 0 40px;
        }
        .academy-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 18px 20px;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          background: linear-gradient(135deg, rgba(24,24,24,0.96) 0%, rgba(12,12,12,0.96) 100%);
          box-shadow: 0 20px 60px rgba(0,0,0,0.25);
          margin-bottom: 24px;
          position: sticky;
          top: 18px;
          z-index: 10;
          backdrop-filter: blur(18px);
        }
        .academy-nav {
          display: inline-flex;
          gap: 10px;
          padding: 6px;
          border-radius: 999px;
          background-color: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .academy-content {
          display: grid;
          gap: 24px;
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
          .student-layout,
          .student-info-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 720px) {
          .academy-page {
            width: calc(100% - 24px);
            padding-top: 16px;
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
              <img src={autodromeHeaderLogo} alt="Dubai Autodrome" style={{ height: "36px", width: "auto" }} />
              <div>
                <p style={{ color: "#C8342E", fontSize: "10px", letterSpacing: "0px", textTransform: "uppercase", margin: "0 0 4px 0" }}>
                  DAKA Platform
                </p>
                <h1 style={{ color: "#FFFFFF", fontSize: "28px", fontFamily: "var(--font-heading)", fontWeight: 900, margin: 0, lineHeight: 1 }}>
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
                      height: "44px",
                      padding: "0 18px",
                      borderRadius: "999px",
                      border: "none",
                      background: active ? "linear-gradient(135deg, #C8342E 0%, #9E201C 100%)" : "transparent",
                      color: "#FFFFFF",
                      fontSize: "13px",
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

          <div className="academy-content">
            {view === "admin" ? (
              adminScreen === "landing" ? (
                <AdminLandingPage
                  onOpenCohort={openAdminCohort}
                  onOpenCohortCreate={openAdminCohortCreate}
                  onOpenAttendance={(context) => {
                    setAttendanceContext({
                      ...context,
                      returnTo: "landing",
                    });
                    changeView("admin-attendance");
                  }}
                />
              ) : adminScreen === "cohort" ? (
                <AdminCohortDashboard
                  initialCohortId={selectedAdminCohortId}
                  onBackToLanding={() => setAdminScreen("landing")}
                  onOpenCohortManagement={openAdminCohortManagement}
                  onOpenTeachingOperations={openAdminCohortTeaching}
                  onOpenAttendance={(context) => {
                    setAttendanceContext({
                      ...context,
                      returnTo: "cohort",
                    });
                    changeView("admin-attendance");
                  }}
                />
              ) : adminScreen === "cohort-management" ? (
                <AdminCohortManagementPage
                  initialCohortId={selectedAdminCohortId}
                  onBackToCohortDashboard={(cohortId) => {
                    setSelectedAdminCohortId(cohortId);
                    setAdminScreen("cohort");
                  }}
                />
              ) : adminScreen === "cohort-create" ? (
                <AdminCreateCohortPage
                  onBackToLanding={() => setAdminScreen("landing")}
                  onOpenCreatedCohort={(cohortId) => {
                    setSelectedAdminCohortId(cohortId);
                    setAdminScreen("cohort");
                  }}
                />
              ) : (
                <AdminCohortTeachingPage
                  initialCohortId={selectedAdminCohortId}
                  onBackToCohortDashboard={(cohortId) => {
                    setSelectedAdminCohortId(cohortId);
                    setAdminScreen("cohort");
                  }}
                />
              )
            ) : view === "admin-attendance" ? (
              <AdminAttendancePage
                initialCohortId={attendanceContext.cohortId}
                initialClassId={attendanceContext.classId}
                allowCohortSwitch={attendanceContext.returnTo !== "cohort"}
                onBackToDashboard={() => {
                  if (attendanceContext.returnTo === "cohort" && attendanceContext.cohortId) {
                    setSelectedAdminCohortId(attendanceContext.cohortId);
                  }
                  setAdminScreen(attendanceContext.returnTo ?? "landing");
                  changeView("admin");
                }}
              />
            ) : view === "student-mobile" ? (
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
                  <p style={{ color: "#D5D5D5", fontSize: "16px", lineHeight: 1.7, margin: "0 0 20px 0", maxWidth: "620px" }}>
                    This mode isolates the driver-facing experience in a phone-size frame so you can review the user dashboard exactly as a mobile product view.
                  </p>

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
                  <p style={{ color: "#D5D5D5", fontSize: "16px", lineHeight: 1.7, margin: "0 0 20px 0", maxWidth: "680px" }}>
                    The original driver-facing dashboard stays available as a compact mobile experience. Use this tab to preview the student journey while the admin tab runs the operational cockpit for cohorts, scheduling, attendance, and reports.
                  </p>

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
        </div>
      </div>
    </>
  );
}
