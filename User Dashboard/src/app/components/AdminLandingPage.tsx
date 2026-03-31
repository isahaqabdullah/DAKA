import { type CSSProperties } from "react";
import { Megaphone } from "lucide-react";
import {
  ActionButton,
  ADMIN_THEME,
  CohortSwitcher,
  SectionTitle,
  Surface,
  formatDateTime,
  loadCohorts,
  type AnnouncementEntry,
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

function formatSessionDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function formatSessionTime(time: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(`2026-01-01T${time}:00`));
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

function countActiveStudents(cohort: Cohort) {
  return cohort.students.filter((student) => (student.status ?? "active") === "active").length;
}

function countPendingAttendance(cohort: Cohort, classId: string) {
  return cohort.students.filter(
    (student) =>
      (student.status ?? "active") === "active" && (student.attendance[classId] ?? "pending") === "pending",
  ).length;
}

function announcementScopeLabel(announcement: AnnouncementEntry, cohort: Cohort) {
  if (!announcement.classId) {
    return "Whole cohort";
  }

  const targetClass = cohort.classes.find((session) => session.id === announcement.classId);

  if (!targetClass) {
    return "Archived session target";
  }

  return `${formatDateTime(targetClass.date, targetClass.time)} · ${targetClass.topic}`;
}

interface AdminLandingPageProps {
  focusedCohortId?: string;
  onSelectCohort?: (cohortId: string) => void;
  onOpenAttendance: (context: { cohortId: string; classId?: string }) => void;
  onComposeAnnouncement?: () => void;
}

export function AdminLandingPage({
  focusedCohortId,
  onSelectCohort,
  onOpenAttendance,
  onComposeAnnouncement,
}: AdminLandingPageProps) {
  const cohorts = loadCohorts();
  const activeCohorts = cohorts.filter((cohort) => !cohort.archived);
  const focusedCohort = activeCohorts.find((cohort) => cohort.id === focusedCohortId) ?? activeCohorts[0];
  const allSessions = getSortedSessions(activeCohorts);
  const now = Date.now();
  const upcomingSessions = allSessions.filter((session) => sessionStamp(session) >= now).slice(0, 6);
  const focusSession = focusedCohort ? getPrioritySession(focusedCohort.classes) : undefined;
  const focusAttendanceExceptions = focusedCohort
    ? focusedCohort.classes.filter(
        (session) => sessionStamp(session) < now && countPendingAttendance(focusedCohort, session.id) > 0,
      ).length
    : 0;
  const recentAnnouncements = activeCohorts
    .flatMap((cohort) =>
      cohort.announcements.map((announcement) => ({
        ...announcement,
        cohortId: cohort.id,
        cohortName: cohort.name,
        scopeLabel: announcementScopeLabel(announcement, cohort),
      })),
    )
    .sort((left, right) => {
      if ((left.pinned ?? false) !== (right.pinned ?? false)) {
        return left.pinned ? -1 : 1;
      }

      return right.createdAt.localeCompare(left.createdAt);
    })
    .slice(0, 6);

  return (
    <>
      <style>{`
        .landing-stack {
          display: grid;
          gap: 12px;
        }
        .landing-focus-strip {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .landing-session-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 8px;
        }
        .landing-announcement-layout {
          display: grid;
          grid-template-columns: minmax(0, 220px) minmax(0, 1fr);
          gap: 10px;
          align-items: start;
        }
        .landing-announcement-list {
          display: grid;
          gap: 8px;
        }
        @media (max-width: 900px) {
          .landing-announcement-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="landing-stack">
        <Surface style={{ padding: "14px" }}>
          <div style={{ display: "grid", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap", alignItems: "flex-start" }}>
              <SectionTitle
                eyebrow="Attendance"
                title="Manage Attendance By Session"
                detail={
                  upcomingSessions.length > 0
                    ? `${upcomingSessions.length} upcoming sessions`
                    : "No upcoming sessions"
                }
              />
              {focusedCohort ? (
                <CohortSwitcher cohorts={activeCohorts} selectedCohortId={focusedCohort.id} onSelect={(cohortId) => onSelectCohort?.(cohortId)} />
              ) : null}
            </div>

            {focusedCohort ? (
              <div className="landing-focus-strip">
                <span style={{ padding: "5px 8px", borderRadius: "999px", border: `1px solid ${ADMIN_THEME.accentBorder}`, backgroundColor: ADMIN_THEME.accentBg, color: ADMIN_THEME.accent, fontSize: "10px", textTransform: "uppercase" }}>
                  Focused {focusedCohort.name}
                </span>
                <span style={{ padding: "5px 8px", borderRadius: "999px", border: `1px solid ${ADMIN_THEME.border}`, backgroundColor: ADMIN_THEME.surface, color: ADMIN_THEME.muted, fontSize: "10px", textTransform: "uppercase" }}>
                  {countActiveStudents(focusedCohort)}/{focusedCohort.capacity} seats
                </span>
                <span
                  style={{
                    display: "grid",
                    gap: "2px",
                    padding: "6px 10px",
                    borderRadius: "12px",
                    border: `1px solid ${ADMIN_THEME.accentBorder}`,
                    backgroundColor: ADMIN_THEME.accentBg,
                    color: ADMIN_THEME.heading,
                    minWidth: "132px",
                  }}
                >
                  <span style={{ color: ADMIN_THEME.subtle, fontSize: "9px", textTransform: "uppercase", lineHeight: 1 }}>
                    {focusSession ? formatSessionDate(focusSession.date) : "Next Session"}
                  </span>
                  <span style={{ color: ADMIN_THEME.accent, fontSize: "14px", fontWeight: 900, lineHeight: 1.05 }}>
                    {focusSession ? formatSessionTime(focusSession.time) : "No session"}
                  </span>
                </span>
                <span style={{ padding: "5px 8px", borderRadius: "999px", border: `1px solid ${focusAttendanceExceptions > 0 ? ADMIN_THEME.accentBorder : ADMIN_THEME.border}`, backgroundColor: focusAttendanceExceptions > 0 ? ADMIN_THEME.accentBg : ADMIN_THEME.surface, color: focusAttendanceExceptions > 0 ? ADMIN_THEME.accent : ADMIN_THEME.muted, fontSize: "10px", textTransform: "uppercase" }}>
                  {focusAttendanceExceptions > 0 ? `${focusAttendanceExceptions} pending past sessions` : "attendance clear"}
                </span>
              </div>
            ) : null}

            {upcomingSessions.length === 0 ? (
              <p style={{ color: ADMIN_THEME.muted, fontSize: "13px", lineHeight: 1.5, margin: 0 }}>
                No upcoming sessions are scheduled. Use schedule session to build the next class.
              </p>
            ) : (
              <div className="landing-session-grid">
                {upcomingSessions.map((session) => {
                  const cohort = activeCohorts.find((item) => item.id === session.cohortId);
                  const pendingAttendance = cohort ? countPendingAttendance(cohort, session.id) : 0;

                  return (
                    <div
                      key={session.id}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "14px",
                        border: `1px solid ${ADMIN_THEME.border}`,
                        backgroundColor: ADMIN_THEME.surface,
                        display: "grid",
                        gap: "8px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", alignItems: "flex-start" }}>
                        <div style={{ display: "grid", gap: "3px", minWidth: 0 }}>
                          <p style={{ color: ADMIN_THEME.accent, fontSize: "10px", textTransform: "uppercase", margin: 0 }}>
                            {session.cohortName}
                          </p>
                          <h3 style={{ color: ADMIN_THEME.heading, fontSize: "15px", fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
                            {session.topic}
                          </h3>
                        </div>
                        <span style={{ padding: "4px 7px", borderRadius: "999px", border: `1px solid ${pendingAttendance > 0 ? ADMIN_THEME.accentBorder : ADMIN_THEME.border}`, backgroundColor: pendingAttendance > 0 ? ADMIN_THEME.accentBg : ADMIN_THEME.surfaceSoft, color: pendingAttendance > 0 ? ADMIN_THEME.accent : ADMIN_THEME.muted, fontSize: "9px", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                          {pendingAttendance > 0 ? `${pendingAttendance} pending` : "ready"}
                        </span>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                        <div
                          style={{
                            display: "grid",
                            gap: "2px",
                            padding: "7px 10px",
                            borderRadius: "12px",
                            border: `1px solid ${ADMIN_THEME.accentBorder}`,
                            backgroundColor: ADMIN_THEME.accentBg,
                            minWidth: "116px",
                          }}
                        >
                          <span style={{ color: ADMIN_THEME.subtle, fontSize: "9px", textTransform: "uppercase", lineHeight: 1 }}>
                            {formatSessionDate(session.date)}
                          </span>
                          <span style={{ color: ADMIN_THEME.accent, fontSize: "16px", fontWeight: 900, lineHeight: 1.05 }}>
                            {formatSessionTime(session.time)}
                          </span>
                        </div>
                        <p style={{ color: ADMIN_THEME.muted, fontSize: "11px", lineHeight: 1.45, margin: 0 }}>
                          {session.track} · Coach {session.coach}
                        </p>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ color: ADMIN_THEME.subtle, fontSize: "10px", textTransform: "uppercase" }}>
                          {session.program}
                        </span>
                        <ActionButton
                          onClick={() => onOpenAttendance({ cohortId: session.cohortId, classId: session.id })}
                          style={{ minWidth: "132px" }}
                        >
                          Open Attendance
                        </ActionButton>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Surface>

        <Surface style={{ padding: "14px" }}>
          <div style={{ display: "grid", gap: "10px" }}>
            <SectionTitle
              eyebrow="Announcements"
              title="Announcements"
              detail={`${recentAnnouncements.length} recent updates`}
            />

            <div className="landing-announcement-layout">
              <div style={{ padding: "12px", borderRadius: "14px", ...nestedCardStyle, display: "grid", gap: "8px" }}>
                {onComposeAnnouncement ? (
                  <ActionButton onClick={onComposeAnnouncement} style={{ minWidth: "170px", justifySelf: "start" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <Megaphone size={15} /> Compose
                    </span>
                  </ActionButton>
                ) : null}
              </div>

              {recentAnnouncements.length === 0 ? (
                <div style={{ padding: "12px", borderRadius: "14px", ...nestedCardStyle }}>
                  <p style={{ color: ADMIN_THEME.subtle, fontSize: "12px", lineHeight: 1.5, margin: 0 }}>
                    No announcements have been sent yet.
                  </p>
                </div>
              ) : (
                <div className="landing-announcement-list">
                  {recentAnnouncements.map((announcement) => {
                    const isExpired = announcement.expiresAt ? new Date(announcement.expiresAt) < new Date() : false;

                    return (
                      <div
                        key={announcement.id}
                        style={{
                          padding: "10px 12px",
                          borderRadius: "14px",
                          border: `1px solid ${announcement.pinned ? ADMIN_THEME.accentBorder : ADMIN_THEME.border}`,
                          backgroundColor: ADMIN_THEME.surface,
                          opacity: isExpired ? 0.6 : 1,
                          display: "grid",
                          gap: "5px",
                        }}
                      >
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                          <span style={{ color: ADMIN_THEME.accent, fontSize: "10px", textTransform: "uppercase" }}>
                            {announcement.cohortName}
                          </span>
                          <span style={{ color: ADMIN_THEME.subtle, fontSize: "10px", textTransform: "uppercase" }}>
                            {announcement.scopeLabel}
                          </span>
                          {announcement.pinned ? (
                            <span style={{ color: ADMIN_THEME.accent, fontSize: "9px", fontWeight: 800, textTransform: "uppercase" }}>
                              Pinned
                            </span>
                          ) : null}
                          {isExpired ? (
                            <span style={{ color: ADMIN_THEME.subtle, fontSize: "9px", fontWeight: 800, textTransform: "uppercase" }}>
                              Expired
                            </span>
                          ) : null}
                        </div>

                        <h4 style={{ color: ADMIN_THEME.heading, fontSize: "14px", fontWeight: 800, margin: 0 }}>
                          {announcement.title}
                        </h4>

                        <p style={{ color: ADMIN_THEME.muted, fontSize: "12px", lineHeight: 1.45, margin: 0 }}>
                          {announcement.message}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </Surface>
      </div>
    </>
  );
}
