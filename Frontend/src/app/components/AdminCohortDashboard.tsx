import { useEffect, useState, type FormEvent } from "react";
import { CalendarDays, Megaphone } from "lucide-react";
import type { Cohort, ScheduledClass } from "../types";
import { T, workflowTone } from "../theme";
import { createId, getAttendanceWorkflowLabel, getSessionAttendanceWorkflowStatus, getSessionTimestamp } from "../utils";
import { loadCohorts, STORAGE_KEY } from "../storage";
import {
  Btn, Drawer, EmptyState, FormField, InlineSelect, PageHeader, SectionLabel, StatusChip,
  Surface, TableHeader, TableRow, TableShell, Td, Th, inputStyle, textareaStyle,
} from "./shared";

function formatShortDate(date: string) {
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(new Date(`${date}T00:00:00`));
}

function formatShortTime(time: string) {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(`2026-01-01T${time}:00`));
}

function formatMonthDay(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(value));
}

const cohortPillStyle = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: "24px",
  padding: `0 ${T.space2}`,
  borderRadius: "999px",
  border: `1px solid ${T.accentBorder}`,
  backgroundColor: T.accentBg,
  color: T.heading,
  fontSize: T.textXs,
  fontWeight: 700,
  whiteSpace: "nowrap" as const,
};

const nextUpPillStyle = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: "20px",
  padding: `0 ${T.space2}`,
  borderRadius: "999px",
  border: `1px solid ${T.successBorder}`,
  backgroundColor: T.successBg,
  color: T.success,
  fontSize: T.textXs,
  fontWeight: 700,
  whiteSpace: "nowrap" as const,
};

const upcomingHeaderPillStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: T.space2,
  minHeight: "24px",
  padding: `0 ${T.space2}`,
  borderRadius: "999px",
  border: `1px solid ${T.successBorder}`,
  backgroundColor: T.successBg,
  color: T.success,
  fontSize: T.textXs,
  fontWeight: 700,
  whiteSpace: "nowrap" as const,
};

type SessionDraft = {
  date: string;
  time: string;
  track: string;
  coach: string;
  topic: string;
};

type AnnouncementDraft = {
  title: string;
  message: string;
  expiresAt: string;
  pinned: boolean;
  targetCohortId: string;
};

interface Props {
  initialCohortId?: string;
  onOpenAttendance?: (ctx: { cohortId: string; classId?: string }) => void;
  onOpenSchedule?: (cohortId: string) => void;
  onOpenCohorts?: () => void;
  onOpenStudents?: (cohortId: string) => void;
  onOpenReports?: (cohortId: string) => void;
  onOpenWebsiteReports?: () => void;
  onOpenAnnouncements?: (cohortId?: string) => void;
}

export function AdminDashboardPage(props: Props) {
  const [allCohorts, setAllCohorts] = useState<Cohort[]>(() => loadCohorts());
  const cohorts = allCohorts.filter((cohort) => !cohort.archived);
  const [rescheduleDrawerOpen, setRescheduleDrawerOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<{ cohortId: string; sessionId: string } | null>(null);
  const [sessionDraft, setSessionDraft] = useState<SessionDraft>({ date: "", time: "", track: "", coach: "", topic: "" });
  const [announcementDrawerOpen, setAnnouncementDrawerOpen] = useState(false);
  const defaultCohortId = cohorts.find((item) => item.id === props.initialCohortId)?.id ?? cohorts[0]?.id ?? "";
  const [announcementDraft, setAnnouncementDraft] = useState<AnnouncementDraft>({
    title: "",
    message: "",
    expiresAt: "",
    pinned: false,
    targetCohortId: defaultCohortId,
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(allCohorts));
  }, [allCohorts]);

  if (cohorts.length === 0) return null;

  function updateCohort(cohortId: string, mutator: (value: Cohort) => Cohort) {
    setAllCohorts((current) => current.map((item) => (item.id === cohortId ? mutator(item) : item)));
  }

  const upcomingSessions = cohorts
    .flatMap((cohort) => (
      cohort.classes
        .filter((session) => getSessionTimestamp(session) >= Date.now())
        .map((session) => ({
          cohortId: cohort.id,
          cohortName: cohort.name,
          session,
          students: cohort.students,
        }))
    ))
    .sort((left, right) => getSessionTimestamp(left.session) - getSessionTimestamp(right.session))
    .slice(0, 5);

  const announcementFeed = cohorts
    .flatMap((cohort) => (
      cohort.announcements.map((announcement) => ({
        ...announcement,
        cohortId: cohort.id,
        cohortName: cohort.name,
      }))
    ))
    .sort((left, right) => {
      if ((left.pinned ?? false) !== (right.pinned ?? false)) return left.pinned ? -1 : 1;
      return right.createdAt.localeCompare(left.createdAt);
    })
    .slice(0, 5);

  function openReschedule(row: { cohortId: string; session: ScheduledClass }) {
    setEditingSession({ cohortId: row.cohortId, sessionId: row.session.id });
    setSessionDraft({
      date: row.session.date,
      time: row.session.time,
      track: row.session.track,
      coach: row.session.coach,
      topic: row.session.topic,
    });
    setRescheduleDrawerOpen(true);
  }

  function closeRescheduleDrawer() {
    setRescheduleDrawerOpen(false);
    setEditingSession(null);
  }

  function submitReschedule(event: FormEvent) {
    event.preventDefault();
    if (!editingSession || !sessionDraft.topic.trim()) return;
    updateCohort(editingSession.cohortId, (current) => ({
      ...current,
      classes: current.classes.map((session) => (
        session.id === editingSession.sessionId
          ? {
              ...session,
              date: sessionDraft.date,
              time: sessionDraft.time,
              track: sessionDraft.track.trim(),
              coach: sessionDraft.coach.trim(),
              topic: sessionDraft.topic.trim(),
            }
          : session
      )),
    }));
    closeRescheduleDrawer();
  }

  function cancelSession(row: { cohortId: string; cohortName: string; session: ScheduledClass }) {
    const label = row.session.topic || `${formatShortDate(row.session.date)} ${formatShortTime(row.session.time)}`;
    if (!window.confirm(`Cancel "${label}" for ${row.cohortName}?`)) return;

    updateCohort(row.cohortId, (current) => ({
      ...current,
      classes: current.classes.filter((item) => item.id !== row.session.id),
      students: current.students.map((student) => {
        const nextAttendance = { ...student.attendance };
        delete nextAttendance[row.session.id];
        return { ...student, attendance: nextAttendance };
      }),
      announcements: current.announcements.filter((announcement) => announcement.classId !== row.session.id),
    }));
  }

  function openSessionAttendance(row: { cohortId: string; session: ScheduledClass }) {
    props.onOpenAttendance?.({ cohortId: row.cohortId, classId: row.session.id });
  }

  function openAnnouncementDrawer() {
    setAnnouncementDraft({ title: "", message: "", expiresAt: "", pinned: false, targetCohortId: defaultCohortId });
    setAnnouncementDrawerOpen(true);
  }

  function submitAnnouncement(event: FormEvent) {
    event.preventDefault();
    if (!announcementDraft.title.trim() || !announcementDraft.message.trim() || !announcementDraft.targetCohortId) return;
    const broadcastId = createId("announcement-broadcast");
    updateCohort(announcementDraft.targetCohortId, (current) => ({
      ...current,
      announcements: [
        {
          id: createId("announcement"),
          broadcastId,
          title: announcementDraft.title.trim(),
          message: announcementDraft.message.trim(),
          createdAt: new Date().toISOString(),
          expiresAt: announcementDraft.expiresAt.trim() || undefined,
          pinned: announcementDraft.pinned,
          audienceMode: "selected",
          targetCohortIds: [announcementDraft.targetCohortId],
        },
        ...current.announcements,
      ],
    }));
    setAnnouncementDrawerOpen(false);
  }

  const sessionCols = "120px 88px minmax(220px,1.25fr) 144px 120px 132px 280px";

  return (
    <div style={{ display: "grid", gap: T.space4 }}>
      <PageHeader title="Dashboard" />

      <div style={{ display: "grid", gap: T.space4 }}>
        <Surface style={{ padding: T.space5 }}>
          <div style={{ display: "grid", gap: T.space3 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: T.space3, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: T.space2, flexWrap: "wrap" }}>
                <h2 style={{ color: T.heading, fontSize: T.text2xl, fontWeight: 800, margin: 0, lineHeight: 1.04, letterSpacing: "-0.03em" }}>
                  Upcoming Sessions
                </h2>
                <span style={upcomingHeaderPillStyle}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "999px", backgroundColor: T.success, flexShrink: 0 }} />
                  Next up
                </span>
              </div>
              {upcomingSessions.length > 0 ? <StatusChip tone="neutral" label={`${upcomingSessions.length} scheduled`} /> : null}
            </div>

            {upcomingSessions.length === 0 ? (
              <EmptyState
                icon={<CalendarDays size={20} />}
                title="No upcoming sessions"
              />
            ) : (
              <TableShell>
                <TableHeader columns={sessionCols}>
                  <Th>Date</Th>
                  <Th>Time</Th>
                  <Th>Session</Th>
                  <Th>Cohort</Th>
                  <Th>Track</Th>
                  <Th>Status</Th>
                  <Th align="right">Actions</Th>
                </TableHeader>
                {upcomingSessions.map((row, index) => {
                  const workflow = getSessionAttendanceWorkflowStatus(row.session, row.students);
                  const label = workflow === "pending" ? "Scheduled" : getAttendanceWorkflowLabel(workflow);
                  const tone = workflow === "pending" ? "neutral" as const : workflowTone(workflow);
                  const isNextUp = index === 0;
                  return (
                    <TableRow key={`${row.cohortId}-${row.session.id}`} columns={sessionCols} highlight={isNextUp} onClick={() => openSessionAttendance(row)}>
                      <Td bold>{formatShortDate(row.session.date)}</Td>
                      <Td muted>{formatShortTime(row.session.time)}</Td>
                      <Td>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: T.space2, minWidth: 0 }}>
                          {isNextUp ? <span style={nextUpPillStyle}>Next Up</span> : null}
                          <span
                            style={{
                              color: T.heading,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              fontSize: T.textBase,
                              fontWeight: isNextUp ? 500 : 400,
                            }}
                            title={row.session.topic || "Session"}
                          >
                            {row.session.topic || "—"}
                          </span>
                        </span>
                      </Td>
                      <Td>
                        <span style={cohortPillStyle}>{row.cohortName}</span>
                      </Td>
                      <Td muted>{row.session.track || "—"}</Td>
                      <Td><StatusChip tone={tone} label={label} /></Td>
                      <Td align="right">
                        <div onClick={(event) => event.stopPropagation()} style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: T.space1, flexWrap: "nowrap", minWidth: "max-content" }}>
                          <Btn
                            onClick={() => openSessionAttendance(row)}
                            size="compact"
                            style={{ position: "relative", zIndex: 1 }}
                          >
                            Attendance
                          </Btn>
                          <Btn
                            variant="secondary"
                            size="compact"
                            onClick={() => openReschedule(row)}
                            style={{ position: "relative", zIndex: 1 }}
                          >
                            Reschedule
                          </Btn>
                          <Btn
                            variant="danger"
                            size="compact"
                            onClick={() => cancelSession(row)}
                            style={{ position: "relative", zIndex: 1 }}
                          >
                            Cancel
                          </Btn>
                        </div>
                      </Td>
                    </TableRow>
                  );
                })}
              </TableShell>
            )}
          </div>
        </Surface>

        <Surface style={{ padding: T.space5 }}>
          <div style={{ display: "grid", gap: T.space3 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: T.space3, alignItems: "center", flexWrap: "wrap" }}>
              <SectionLabel>Announcements</SectionLabel>
              <div style={{ display: "flex", gap: T.space2, flexWrap: "wrap" }}>
                <Btn onClick={openAnnouncementDrawer}>Create</Btn>
                <Btn variant="secondary" onClick={() => props.onOpenAnnouncements?.()}>View All</Btn>
              </div>
            </div>

            {announcementFeed.length === 0 ? (
              <EmptyState
                icon={<Megaphone size={20} />}
                title="No announcements yet"
                action={<Btn onClick={openAnnouncementDrawer}>Create Announcement</Btn>}
              />
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: T.space2 }}>
                {announcementFeed.map((announcement) => (
                  <div key={announcement.id} style={{ display: "grid", gap: "6px", padding: `${T.space3} ${T.space4}`, borderRadius: T.radiusMd, border: `1px solid ${(announcement.pinned ?? false) ? T.accentBorder : T.border}`, backgroundColor: (announcement.pinned ?? false) ? T.accentBg : T.surfaceSoft }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: T.space2, alignItems: "flex-start" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: T.space2, flexWrap: "wrap" }}>
                        <span style={{ color: T.heading, fontSize: T.textBase, fontWeight: 700 }}>{announcement.title}</span>
                        {announcement.pinned ? <StatusChip tone="warning" label="Pinned" /> : null}
                        <StatusChip tone="neutral" label={announcement.cohortName} />
                      </div>
                      <span style={{ color: T.subtle, fontSize: T.textXs }}>{formatMonthDay(announcement.createdAt)}</span>
                    </div>
                    <p style={{ color: T.muted, fontSize: T.textSm, lineHeight: 1.45, margin: 0 }}>{announcement.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Surface>
      </div>

      <Drawer
        open={rescheduleDrawerOpen}
        title="Reschedule Session"
        onClose={closeRescheduleDrawer}
        footer={(
          <>
            <Btn variant="secondary" onClick={closeRescheduleDrawer}>Cancel</Btn>
            <Btn type="submit" onClick={() => (document.getElementById("dashboard-session-form") as HTMLFormElement | null)?.requestSubmit()}>
              Save Changes
            </Btn>
          </>
        )}
      >
        <form id="dashboard-session-form" onSubmit={submitReschedule} style={{ display: "grid", gap: T.space3 }}>
          <FormField label="Date">
            <input type="date" value={sessionDraft.date} onChange={(event) => setSessionDraft({ ...sessionDraft, date: event.target.value })} style={inputStyle} />
          </FormField>
          <FormField label="Time">
            <input type="time" value={sessionDraft.time} onChange={(event) => setSessionDraft({ ...sessionDraft, time: event.target.value })} style={inputStyle} />
          </FormField>
          <FormField label="Track">
            <input value={sessionDraft.track} onChange={(event) => setSessionDraft({ ...sessionDraft, track: event.target.value })} style={inputStyle} />
          </FormField>
          <FormField label="Coach">
            <input value={sessionDraft.coach} onChange={(event) => setSessionDraft({ ...sessionDraft, coach: event.target.value })} style={inputStyle} />
          </FormField>
          <FormField label="Session Topic">
            <input value={sessionDraft.topic} onChange={(event) => setSessionDraft({ ...sessionDraft, topic: event.target.value })} style={inputStyle} required />
          </FormField>
        </form>
      </Drawer>

      <Drawer
        open={announcementDrawerOpen}
        title="Create Announcement"
        onClose={() => setAnnouncementDrawerOpen(false)}
        footer={(
          <>
            <Btn variant="secondary" onClick={() => setAnnouncementDrawerOpen(false)}>Cancel</Btn>
            <Btn type="submit" onClick={() => (document.getElementById("dashboard-announcement-form") as HTMLFormElement | null)?.requestSubmit()}>
              Create
            </Btn>
          </>
        )}
      >
        <form id="dashboard-announcement-form" onSubmit={submitAnnouncement} style={{ display: "grid", gap: T.space3 }}>
          <FormField label="Cohort">
            <InlineSelect
              value={announcementDraft.targetCohortId}
              onChange={(value) => setAnnouncementDraft({ ...announcementDraft, targetCohortId: value })}
              style={{ minWidth: "100%" }}
            >
              {cohorts.map((cohort) => (
                <option key={cohort.id} value={cohort.id}>
                  {cohort.name}
                </option>
              ))}
            </InlineSelect>
          </FormField>
          <FormField label="Title">
            <input value={announcementDraft.title} onChange={(event) => setAnnouncementDraft({ ...announcementDraft, title: event.target.value })} style={inputStyle} required />
          </FormField>
          <FormField label="Message">
            <textarea value={announcementDraft.message} onChange={(event) => setAnnouncementDraft({ ...announcementDraft, message: event.target.value })} style={textareaStyle} required />
          </FormField>
          <FormField label="Expires At">
            <input type="date" value={announcementDraft.expiresAt} onChange={(event) => setAnnouncementDraft({ ...announcementDraft, expiresAt: event.target.value })} style={inputStyle} />
          </FormField>
          <label style={{ display: "flex", alignItems: "center", gap: T.space2, fontSize: T.textBase, color: T.text, cursor: "pointer" }}>
            <input type="checkbox" checked={announcementDraft.pinned} onChange={(event) => setAnnouncementDraft({ ...announcementDraft, pinned: event.target.checked })} />
            Pin this announcement
          </label>
        </form>
      </Drawer>
    </div>
  );
}
