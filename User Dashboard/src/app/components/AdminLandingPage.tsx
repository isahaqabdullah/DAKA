import { useMemo, useState, type CSSProperties, type FormEvent } from "react";
import {
  ArrowRight,
  CalendarDays,
  FileText,
  GraduationCap,
  Megaphone,
  Users,
} from "lucide-react";
import {
  ActionButton,
  ADMIN_THEME,
  MetricCard,
  SectionTitle,
  Surface,
  formatDateTime,
  loadCohorts,
  type Cohort,
} from "./AdminDashboard";

const nestedCardStyle: CSSProperties = {
  border: `1px solid ${ADMIN_THEME.borderSoft}`,
  backgroundColor: ADMIN_THEME.surfaceSoft,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.75)",
};

function sessionStamp(session: Cohort["classes"][number]) {
  return new Date(`${session.date}T${session.time}:00`).getTime();
}

function getSortedSessions(cohorts: Cohort[]) {
  return cohorts
    .flatMap((cohort) =>
      cohort.classes.map((session) => ({
        ...session,
        cohortId: cohort.id,
        cohortName: cohort.name,
        program: cohort.program,
      })),
    )
    .sort((left, right) => sessionStamp(left) - sessionStamp(right));
}

function getPrioritySession(classes: Cohort["classes"]) {
  const ordered = [...classes].sort((left, right) => sessionStamp(left) - sessionStamp(right));
  const now = Date.now();

  return ordered.find((session) => sessionStamp(session) >= now) ?? ordered[ordered.length - 1];
}

export function AdminLandingPage({
  onOpenCohort,
  onOpenAttendance,
  onOpenCohortCreate,
}: {
  onOpenCohort: (cohortId: string) => void;
  onOpenAttendance: (context: { cohortId: string; classId: string }) => void;
  onOpenCohortCreate?: () => void;
}) {
  const [cohorts] = useState<Cohort[]>(() => loadCohorts());
  const [announcementDraft, setAnnouncementDraft] = useState("");
  const [sessionCohortFilter, setSessionCohortFilter] = useState<string>("all");
  const [sessionWindow, setSessionWindow] = useState<"upcoming" | "previous">("upcoming");

  const allSessions = getSortedSessions(cohorts);
  const nextSession = allSessions.find((session) => sessionStamp(session) >= Date.now()) ?? allSessions[0];
  const totalStudents = cohorts.reduce((count, cohort) => count + cohort.students.length, 0);
  const totalCapacity = cohorts.reduce((count, cohort) => count + cohort.capacity, 0);
  const totalReports = cohorts.reduce((count, cohort) => count + cohort.reports.length, 0);
  const visibleSessions = useMemo(() => {
    const now = Date.now();

    return allSessions
      .filter((session) => (sessionCohortFilter === "all" ? true : session.cohortId === sessionCohortFilter))
      .filter((session) => (sessionWindow === "upcoming" ? sessionStamp(session) >= now : sessionStamp(session) < now))
      .sort((left, right) =>
        sessionWindow === "upcoming"
          ? sessionStamp(left) - sessionStamp(right)
          : sessionStamp(right) - sessionStamp(left),
      );
  }, [allSessions, sessionCohortFilter, sessionWindow]);

  function handleAnnouncementSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!announcementDraft.trim()) {
      return;
    }

    setAnnouncementDraft("");
  }

  return (
    <>
      <style>{`
        .landing-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.4fr) minmax(320px, 380px);
          gap: 22px;
        }
        .landing-metrics {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }
        .landing-cohort-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }
        .landing-rail {
          display: grid;
          gap: 18px;
        }
        .session-access-controls {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 12px;
        }
        @media (max-width: 1120px) {
          .landing-grid,
          .landing-metrics,
          .landing-cohort-grid {
            grid-template-columns: 1fr;
          }
          .session-access-controls {
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

          <SectionTitle eyebrow="Admin Landing" title="Choose A Cohort" detail="Open a cohort desk to run daily operations" />

          <div style={{ display: "flex", justifyContent: "space-between", gap: "18px", flexWrap: "wrap", position: "relative" }}>
            <div style={{ maxWidth: "760px" }}>
              <p style={{ color: ADMIN_THEME.muted, fontSize: "16px", lineHeight: 1.7, margin: "0 0 18px 0" }}>
                Start from the cohort list, scan seat fill and the upcoming session queue, then enter the desk you need for attendance, scheduling, reporting, and roster updates.
              </p>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <span style={{ padding: "8px 12px", borderRadius: "999px", border: `1px solid ${ADMIN_THEME.accentBorder}`, backgroundColor: ADMIN_THEME.accentBg, color: ADMIN_THEME.accent, fontSize: "12px", letterSpacing: "0px", textTransform: "uppercase" }}>
                  Cohort roster
                </span>
                <span style={{ padding: "8px 12px", borderRadius: "999px", border: `1px solid ${ADMIN_THEME.border}`, backgroundColor: ADMIN_THEME.surfaceSoft, color: ADMIN_THEME.muted, fontSize: "12px", letterSpacing: "0px", textTransform: "uppercase" }}>
                  Session radar
                </span>
                <span style={{ padding: "8px 12px", borderRadius: "999px", border: `1px solid ${ADMIN_THEME.border}`, backgroundColor: ADMIN_THEME.surfaceSoft, color: ADMIN_THEME.muted, fontSize: "12px", letterSpacing: "0px", textTransform: "uppercase" }}>
                  Parent updates
                </span>
              </div>
            </div>

            <div
              style={{
                minWidth: "280px",
                padding: "18px",
                borderRadius: "18px",
                border: `1px solid ${ADMIN_THEME.border}`,
                background: "linear-gradient(180deg, #FFFFFF 0%, #F7F2ED 100%)",
                boxShadow: "0 12px 30px rgba(70,46,25,0.08)",
              }}
            >
              <p style={{ color: ADMIN_THEME.subtle, fontSize: "10px", letterSpacing: "0px", textTransform: "uppercase", margin: "0 0 10px 0" }}>
                Next Operational Pulse
              </p>
              <h3 style={{ color: ADMIN_THEME.heading, fontSize: "26px", fontFamily: "var(--font-heading)", margin: "0 0 8px 0", lineHeight: 1 }}>
                {nextSession ? nextSession.cohortName.toUpperCase() : "NO SESSION"}
              </h3>
              <p style={{ color: ADMIN_THEME.muted, fontSize: "14px", margin: "0 0 10px 0" }}>
                {nextSession ? `${nextSession.program} · ${nextSession.track}` : "Schedule the next class to populate the queue."}
              </p>
              <p style={{ color: ADMIN_THEME.subtle, fontSize: "13px", lineHeight: 1.6, margin: 0 }}>
                {nextSession ? `${formatDateTime(nextSession.date, nextSession.time)} · ${nextSession.topic}` : "No upcoming classes currently listed."}
              </p>
            </div>
          </div>
        </Surface>

        <div className="landing-metrics">
          <MetricCard icon={<Users size={20} />} label="Active Cohorts" value={String(cohorts.length)} note="Running groups visible from the landing deck" />
          <MetricCard icon={<GraduationCap size={20} />} label="Seat Fill" value={`${totalStudents}/${totalCapacity}`} note="Students enrolled across all cohorts" />
          <MetricCard icon={<CalendarDays size={20} />} label="Scheduled Sessions" value={String(allSessions.length)} note={nextSession ? `Next up: ${nextSession.cohortName}` : "Add a class to start the queue"} />
          <MetricCard icon={<FileText size={20} />} label="Reports Logged" value={String(totalReports)} note="Stored coaching notes across the academy" />
        </div>

        <div className="landing-grid">
          <Surface style={{ padding: "23px", alignSelf: "start" }}>
            <SectionTitle eyebrow="Cohorts" title="Open A Cohort Desk" detail={`${cohorts.length} active groups`} />

            <div className="landing-cohort-grid">
              {cohorts.map((cohort) => {
                const nextCohortSession = getPrioritySession(cohort.classes);
                const completedSyllabus = cohort.syllabus.filter((item) => item.status === "complete").length;
                const liveModules = cohort.syllabus.filter((item) => item.status === "live").length;

                return (
                  <button
                    key={cohort.id}
                    type="button"
                    onClick={() => onOpenCohort(cohort.id)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "19px",
                      borderRadius: "20px",
                      border: `1px solid ${ADMIN_THEME.borderSoft}`,
                      background: "linear-gradient(180deg, #FFFFFF 0%, #F9F5F0 100%)",
                      boxShadow: "0 16px 34px rgba(70,46,25,0.08)",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "grid", gap: "16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start" }}>
                        <div>
                          <p style={{ color: ADMIN_THEME.accent, fontSize: "10px", letterSpacing: "0px", textTransform: "uppercase", margin: "0 0 6px 0" }}>
                            {cohort.program}
                          </p>
                          <h3 style={{ color: ADMIN_THEME.heading, fontSize: "24px", fontFamily: "var(--font-heading)", margin: "0 0 8px 0", lineHeight: 1 }}>
                            {cohort.name.toUpperCase()}
                          </h3>
                          <p style={{ color: ADMIN_THEME.muted, fontSize: "13px", lineHeight: 1.6, margin: 0 }}>
                            {cohort.cadence} · Coach {cohort.coach}
                          </p>
                        </div>
                        <span
                          style={{
                            padding: "7px 10px",
                            borderRadius: "999px",
                            backgroundColor: ADMIN_THEME.accentBg,
                            border: `1px solid ${ADMIN_THEME.accentBorder}`,
                            color: ADMIN_THEME.accent,
                            fontSize: "11px",
                            letterSpacing: "0px",
                            textTransform: "uppercase",
                            flexShrink: 0,
                          }}
                        >
                          {cohort.students.length}/{cohort.capacity}
                        </span>
                      </div>

                      <div style={{ display: "grid", gap: "10px" }}>
                        <div style={{ padding: "14px 15px", borderRadius: "16px", ...nestedCardStyle }}>
                          <p style={{ color: ADMIN_THEME.subtle, fontSize: "10px", letterSpacing: "0px", textTransform: "uppercase", margin: "0 0 6px 0" }}>
                            Next Session
                          </p>
                          <p style={{ color: ADMIN_THEME.heading, fontSize: "14px", fontWeight: 700, margin: "0 0 4px 0" }}>
                            {nextCohortSession ? formatDateTime(nextCohortSession.date, nextCohortSession.time) : "No class scheduled"}
                          </p>
                          <p style={{ color: ADMIN_THEME.muted, fontSize: "13px", margin: 0 }}>
                            {nextCohortSession ? `${nextCohortSession.track} · ${nextCohortSession.topic}` : cohort.room}
                          </p>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "10px" }}>
                          <div style={{ padding: "12px 13px", borderRadius: "14px", ...nestedCardStyle }}>
                            <p style={{ color: ADMIN_THEME.subtle, fontSize: "9px", letterSpacing: "0px", textTransform: "uppercase", margin: "0 0 6px 0" }}>Room</p>
                            <p style={{ color: ADMIN_THEME.heading, fontSize: "13px", fontWeight: 700, margin: 0 }}>{cohort.room}</p>
                          </div>
                          <div style={{ padding: "12px 13px", borderRadius: "14px", ...nestedCardStyle }}>
                            <p style={{ color: ADMIN_THEME.subtle, fontSize: "9px", letterSpacing: "0px", textTransform: "uppercase", margin: "0 0 6px 0" }}>Syllabus</p>
                            <p style={{ color: ADMIN_THEME.heading, fontSize: "13px", fontWeight: 700, margin: 0 }}>{completedSyllabus}/{cohort.syllabus.length}</p>
                          </div>
                          <div style={{ padding: "12px 13px", borderRadius: "14px", ...nestedCardStyle }}>
                            <p style={{ color: ADMIN_THEME.subtle, fontSize: "9px", letterSpacing: "0px", textTransform: "uppercase", margin: "0 0 6px 0" }}>Updates</p>
                            <p style={{ color: ADMIN_THEME.heading, fontSize: "13px", fontWeight: 700, margin: 0 }}>{cohort.announcements.length}</p>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                        <span style={{ color: liveModules > 0 ? ADMIN_THEME.accent : ADMIN_THEME.subtle, fontSize: "12px", letterSpacing: "0px", textTransform: "uppercase" }}>
                          {liveModules > 0 ? `${liveModules} live modules in progress` : "No live modules flagged"}
                        </span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: ADMIN_THEME.heading, fontSize: "13px", fontWeight: 800, letterSpacing: "0px", textTransform: "uppercase" }}>
                          Open Dashboard <ArrowRight size={16} />
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Surface>

          <div className="landing-rail">
            <Surface style={{ padding: "23px", alignSelf: "start" }}>
              <SectionTitle eyebrow="Cohort Setup" title="Create + Manage Cohorts" />

              <div style={{ display: "grid", gap: "14px" }}>
                <p style={{ color: ADMIN_THEME.muted, fontSize: "13px", lineHeight: 1.65, margin: 0 }}>
                  Open the dedicated setup page to create new cohort desks or manage existing ones before moving into students, sessions, and syllabus workspaces.
                </p>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <span
                    style={{
                      padding: "7px 10px",
                      borderRadius: "999px",
                      backgroundColor: ADMIN_THEME.accentBg,
                      border: `1px solid ${ADMIN_THEME.accentBorder}`,
                      color: ADMIN_THEME.accent,
                      fontSize: "10px",
                      letterSpacing: "0px",
                      textTransform: "uppercase",
                    }}
                  >
                    New desk creation
                  </span>
                  <span
                    style={{
                      padding: "7px 10px",
                      borderRadius: "999px",
                      backgroundColor: ADMIN_THEME.surfaceSoft,
                      border: `1px solid ${ADMIN_THEME.borderSoft}`,
                      color: ADMIN_THEME.muted,
                      fontSize: "10px",
                      letterSpacing: "0px",
                      textTransform: "uppercase",
                    }}
                  >
                    Existing desk management
                  </span>
                </div>

                <ActionButton onClick={onOpenCohortCreate} style={{ justifySelf: "start", minWidth: "188px" }}>
                  Open Cohort Setup
                </ActionButton>
              </div>
            </Surface>

            <Surface style={{ padding: "23px", alignSelf: "start" }}>
              <form onSubmit={handleAnnouncementSubmit} style={{ display: "grid", gap: "18px" }}>
                <SectionTitle eyebrow="Announcements" title="Send Academy-wide Update" />

                <div
                  style={{
                    minHeight: "52px",
                    borderRadius: "14px",
                    border: `1px solid ${ADMIN_THEME.inputBorder}`,
                    backgroundColor: ADMIN_THEME.inputBg,
                    padding: "0 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <Megaphone size={18} color={ADMIN_THEME.subtle} />
                  <input
                    value={announcementDraft}
                    onChange={(event) => setAnnouncementDraft(event.target.value)}
                    placeholder="Share an academy-wide parent reminder, timing update, or coach note"
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
                  />
                </div>

                <p style={{ color: ADMIN_THEME.subtle, fontSize: "12px", lineHeight: 1.6, margin: 0 }}>
                  Landing keeps academy-wide communication separate, while each cohort dashboard now holds its own class-targeted announcement workflow.
                </p>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <ActionButton type="submit" style={{ minWidth: "184px" }}>Send Announcement</ActionButton>
                </div>
              </form>
            </Surface>

            <Surface style={{ padding: "23px", alignSelf: "start" }}>
              <SectionTitle
                eyebrow="Attendance Access"
                title="Manage Sessions"
                detail={sessionWindow === "upcoming" ? `${visibleSessions.length} upcoming` : `${visibleSessions.length} previous`}
              />

              <div className="session-access-controls" style={{ marginBottom: "14px" }}>
                <div
                  style={{
                    minHeight: "48px",
                    borderRadius: "14px",
                    border: `1px solid ${ADMIN_THEME.inputBorder}`,
                    backgroundColor: ADMIN_THEME.inputBg,
                    padding: "0 14px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <select
                    value={sessionCohortFilter}
                    onChange={(event) => setSessionCohortFilter(event.target.value)}
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
                    <option value="all">All Cohorts</option>
                    {cohorts.map((cohort) => (
                      <option key={cohort.id} value={cohort.id}>
                        {cohort.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <ActionButton
                    secondary={sessionWindow !== "upcoming"}
                    onClick={() => setSessionWindow("upcoming")}
                    style={{ minWidth: "144px" }}
                  >
                    Upcoming
                  </ActionButton>
                  <ActionButton
                    secondary={sessionWindow !== "previous"}
                    onClick={() => setSessionWindow("previous")}
                    style={{ minWidth: "144px" }}
                  >
                    Previous
                  </ActionButton>
                </div>
              </div>

              <div style={{ display: "grid", gap: "12px", maxHeight: "560px", overflowY: "auto", paddingRight: "4px" }}>
                {visibleSessions.length === 0 ? (
                  <div
                    style={{
                      padding: "18px",
                      borderRadius: "16px",
                      border: `1px dashed ${ADMIN_THEME.border}`,
                      backgroundColor: ADMIN_THEME.surfaceSoft,
                      color: ADMIN_THEME.subtle,
                      fontSize: "14px",
                    }}
                  >
                    No sessions match the current cohort filter and time window.
                  </div>
                ) : (
                  visibleSessions.map((session) => (
                    <div
                      key={session.id}
                      style={{
                        padding: "15px 16px",
                        borderRadius: "16px",
                        ...nestedCardStyle,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start", marginBottom: "10px" }}>
                        <div>
                          <p style={{ color: ADMIN_THEME.accent, fontSize: "10px", letterSpacing: "0px", textTransform: "uppercase", margin: "0 0 6px 0" }}>
                            {session.cohortName}
                          </p>
                          <h4 style={{ color: ADMIN_THEME.heading, fontSize: "16px", fontWeight: 800, margin: "0 0 6px 0" }}>
                            {session.topic}
                          </h4>
                        </div>
                        <span
                          style={{
                            padding: "7px 10px",
                            borderRadius: "999px",
                            backgroundColor: sessionWindow === "upcoming" ? ADMIN_THEME.accentBg : ADMIN_THEME.surfaceTint,
                            border: `1px solid ${sessionWindow === "upcoming" ? ADMIN_THEME.accentBorder : ADMIN_THEME.border}`,
                            color: sessionWindow === "upcoming" ? ADMIN_THEME.accent : ADMIN_THEME.muted,
                            fontSize: "10px",
                            letterSpacing: "0px",
                            textTransform: "uppercase",
                            flexShrink: 0,
                          }}
                        >
                          {sessionWindow}
                        </span>
                      </div>
                      <p style={{ color: ADMIN_THEME.muted, fontSize: "13px", lineHeight: 1.6, margin: "0 0 12px 0" }}>
                        {formatDateTime(session.date, session.time)} · {session.track}
                      </p>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ color: ADMIN_THEME.subtle, fontSize: "12px", lineHeight: 1.5 }}>
                          {session.program}
                        </span>
                        <ActionButton
                          secondary
                          onClick={() => onOpenAttendance({ cohortId: session.cohortId, classId: session.id })}
                          style={{ minWidth: "166px" }}
                        >
                          Open Attendance
                        </ActionButton>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Surface>
          </div>
        </div>
      </div>
    </>
  );
}
