import { useMemo, useState } from "react";
import { Activity, BarChart3, CalendarDays, ClipboardCheck, FileText, Megaphone, PieChart as PieChartIcon, TrendingUp, Users } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Cohort, ScheduledClass } from "../types";
import { T, workflowTone } from "../theme";
import { getAttendanceWorkflowLabel, getSessionAttendanceWorkflowStatus, getSessionTimestamp } from "../utils";
import { loadCohorts } from "../storage";
import {
  Btn, EmptyState, FilterBar, InlineSelect, KpiCard, PageHeader, SectionLabel, StatusChip,
  Surface, TableHeader, TableRow, TableShell, Td, Th,
} from "./shared";

const CHART_COLORS = [T.accent, "#D97706", T.success, "#C2410C", "#0F766E", "#7C3AED"];
const chartAxisStyle = { fill: T.subtle, fontSize: 11, fontFamily: "var(--font-body)" } as const;
const chartTooltipStyle = {
  border: `1px solid ${T.border}`,
  borderRadius: T.radiusMd,
  backgroundColor: T.surface,
  boxShadow: T.shadowMd,
} as const;

function activeStudents(cohort: Cohort) {
  return cohort.students.filter((student) => (student.status ?? "active") === "active");
}

function coveredStudentCount(cohort: Cohort) {
  const students = activeStudents(cohort);
  if (students.length === 0) return 0;
  const covered = new Set(cohort.reports.map((report) => report.studentId));
  return students.filter((student) => covered.has(student.id)).length;
}

function missingReportCount(cohort: Cohort) {
  return Math.max(activeStudents(cohort).length - coveredStudentCount(cohort), 0);
}

function attendanceRate(cohort: Cohort) {
  const students = activeStudents(cohort);
  if (students.length === 0 || cohort.classes.length === 0) return null;

  let marked = 0;
  let good = 0;
  for (const student of students) {
    for (const klass of cohort.classes) {
      const state = student.attendance[klass.id];
      if (state && state !== "pending") {
        marked += 1;
        if (state === "present" || state === "late") good += 1;
      }
    }
  }

  return marked === 0 ? null : Math.round((good / marked) * 100);
}

function reportCoverage(cohort: Cohort) {
  const students = activeStudents(cohort);
  if (students.length === 0) return null;
  const covered = new Set(cohort.reports.map((report) => report.studentId));
  return Math.round((covered.size / students.length) * 100);
}

function activeAnnouncements(cohort: Cohort) {
  const now = new Date();
  return cohort.announcements.filter((announcement) => !announcement.expiresAt || new Date(announcement.expiresAt) >= now);
}

function pendingRegisters(cohort: Cohort) {
  const now = Date.now();
  return cohort.classes.filter((session) => getSessionTimestamp(session) < now && (session.attendanceStatus ?? "pending") === "pending");
}

function formatShortDate(date: string) {
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(new Date(`${date}T00:00:00`));
}

function formatShortTime(time: string) {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(`2026-01-01T${time}:00`));
}

function formatMonthDay(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(value));
}

function shortCohortLabel(name: string) {
  const [program, cadence] = name.split("·").map((part) => part.trim());
  if (!cadence) return name;
  const day = cadence.split(" ")[0] ?? cadence;
  return `${program} ${day}`;
}

function chartMetricLabel(metric: string) {
  if (metric === "registerRate") return "Register completion";
  if (metric === "attendanceRate") return "Attendance quality";
  if (metric === "attendance") return "Attendance";
  if (metric === "coverage") return "Report coverage";
  if (metric === "pending") return "Pending attendance";
  if (metric === "missingReports") return "Students missing reports";
  if (metric === "liveUpdates") return "Live announcements";
  return metric;
}

interface PendingSessionRow {
  cohortId: string;
  cohortName: string;
  session: ScheduledClass;
  coach: string;
  cohort: Cohort;
}

interface Props {
  onOpenCohort?: (cohortId: string) => void;
  onOpenAttendance?: (ctx: { cohortId: string; classId: string }) => void;
  onOpenReports?: (cohortId: string) => void;
}

export function AdminWebsiteReportsPage({ onOpenCohort, onOpenAttendance, onOpenReports }: Props) {
  const cohorts = loadCohorts().filter((cohort) => !cohort.archived);
  const [selectedCohortId, setSelectedCohortId] = useState("");
  const visibleCohorts = useMemo(
    () => (selectedCohortId ? cohorts.filter((cohort) => cohort.id === selectedCohortId) : cohorts),
    [cohorts, selectedCohortId],
  );

  const cohortRows = visibleCohorts.map((cohort) => ({
    cohort,
    activeStudentCount: activeStudents(cohort).length,
    missingReportCount: missingReportCount(cohort),
    attendance: attendanceRate(cohort),
    pendingCount: pendingRegisters(cohort).length,
    coverage: reportCoverage(cohort),
    activeAnnouncementCount: activeAnnouncements(cohort).length,
  }));

  const pendingRows: PendingSessionRow[] = visibleCohorts.flatMap((cohort) => (
    pendingRegisters(cohort).map((session) => ({
      cohortId: cohort.id,
      cohortName: cohort.name,
      coach: session.coach || cohort.coach || "Unassigned",
      session,
      cohort,
    }))
  )).sort((left, right) => getSessionTimestamp(left.session) - getSessionTimestamp(right.session));

  const recentAnnouncements = visibleCohorts.flatMap((cohort) => (
    activeAnnouncements(cohort).map((announcement) => ({
      id: announcement.id,
      cohortId: cohort.id,
      cohortName: cohort.name,
      title: announcement.title,
      message: announcement.message,
      createdAt: announcement.createdAt,
      pinned: announcement.pinned ?? false,
    }))
  )).sort((left, right) => {
    if (left.pinned !== right.pinned) return left.pinned ? -1 : 1;
    return right.createdAt.localeCompare(left.createdAt);
  }).slice(0, 6);

  const totalPending = cohortRows.reduce((count, row) => count + row.pendingCount, 0);
  const totalActiveStudents = cohortRows.reduce((count, row) => count + row.activeStudentCount, 0);
  const totalLiveAnnouncements = cohortRows.reduce((count, row) => count + row.activeAnnouncementCount, 0);
  const averageAttendance = cohortRows.filter((row) => row.attendance != null).length > 0
    ? Math.round(cohortRows.reduce((sum, row) => sum + (row.attendance ?? 0), 0) / cohortRows.filter((row) => row.attendance != null).length)
    : null;
  const averageCoverage = cohortRows.filter((row) => row.coverage != null).length > 0
    ? Math.round(cohortRows.reduce((sum, row) => sum + (row.coverage ?? 0), 0) / cohortRows.filter((row) => row.coverage != null).length)
    : null;
  const coverageRows = [...cohortRows].sort((left, right) => (right.coverage ?? -1) - (left.coverage ?? -1));
  const reportTargetCohortId = selectedCohortId || cohortRows[0]?.cohort.id;
  const attendanceTrendData = visibleCohorts
    .flatMap((cohort) => {
      const students = activeStudents(cohort);
      return cohort.classes
        .filter((session) => getSessionTimestamp(session) <= Date.now())
        .map((session) => {
          let marked = 0;
          let good = 0;
          for (const student of students) {
            const state = student.attendance[session.id];
            if (state && state !== "pending") {
              marked += 1;
              if (state === "present" || state === "late") good += 1;
            }
          }

          const base = students.length || 1;
          return {
            id: `${cohort.id}-${session.id}`,
            timestamp: getSessionTimestamp(session),
            label: formatMonthDay(session.date),
            fullLabel: formatShortDate(session.date),
            cohortName: cohort.name,
            registerRate: Math.round((marked / base) * 100),
            attendanceRate: Math.round((good / base) * 100),
            markedStudents: marked,
            activeStudents: students.length,
          };
        });
    })
    .sort((left, right) => left.timestamp - right.timestamp)
    .slice(-8);
  const cohortPerformanceData = cohortRows.map((row) => ({
    name: shortCohortLabel(row.cohort.name),
    fullName: row.cohort.name,
    attendance: row.attendance ?? 0,
    coverage: row.coverage ?? 0,
    pending: row.pendingCount,
    students: row.activeStudentCount,
  }));
  const operationsLoadData = [...cohortRows]
    .map((row) => ({
      name: shortCohortLabel(row.cohort.name),
      fullName: row.cohort.name,
      pending: row.pendingCount,
      missingReports: row.missingReportCount,
      liveUpdates: row.activeAnnouncementCount,
      total: row.pendingCount + row.missingReportCount + row.activeAnnouncementCount,
    }))
    .sort((left, right) => right.total - left.total);
  const studentDistributionData = cohortRows.map((row, index) => ({
    name: row.cohort.name,
    shortName: shortCohortLabel(row.cohort.name),
    value: row.activeStudentCount,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  }));
  const totalDistribution = studentDistributionData.reduce((sum, item) => sum + item.value, 0);
  const fullyMarkedSessions = attendanceTrendData.filter((item) => item.activeStudents > 0 && item.markedStudents === item.activeStudents).length;
  const averageRegisterRate = attendanceTrendData.length > 0
    ? Math.round(attendanceTrendData.reduce((sum, item) => sum + item.registerRate, 0) / attendanceTrendData.length)
    : null;
  const highestLoadRow = operationsLoadData[0];
  const leadingCoverageRow = coverageRows[0];

  const performanceCols = "minmax(200px,1.2fr) 96px 110px 120px 120px 120px";
  const pendingCols = "minmax(180px,1.05fr) 120px minmax(220px,1.35fr) 120px 120px";
  const announcementCols = "minmax(220px,1.4fr) 150px 100px";

  return (
    <div style={{ display: "grid", gap: T.space4 }}>
      <PageHeader title="Website Reports">
        <Btn variant="secondary" onClick={() => reportTargetCohortId && onOpenReports?.(reportTargetCohortId)} disabled={!reportTargetCohortId}>
          <FileText size={15} />
          Open Student Progress
        </Btn>
        <Btn onClick={() => pendingRows[0] && onOpenAttendance?.({ cohortId: pendingRows[0].cohortId, classId: pendingRows[0].session.id })} disabled={!pendingRows[0]}>
          <CalendarDays size={15} />
          Resolve Attendance
        </Btn>
      </PageHeader>

      <FilterBar>
        <InlineSelect value={selectedCohortId} onChange={setSelectedCohortId} style={{ minWidth: "200px" }}>
          <option value="">All Cohorts</option>
          {cohorts.map((cohort) => (
            <option key={cohort.id} value={cohort.id}>
              {cohort.name}
            </option>
          ))}
        </InlineSelect>
        <div style={{ display: "flex", alignItems: "center", gap: T.space2, flexWrap: "wrap", marginLeft: "auto" }}>
          <StatusChip tone="neutral" label={`${cohortRows.length} cohort${cohortRows.length === 1 ? "" : "s"}`} />
          <StatusChip tone={totalPending > 0 ? "warning" : "success"} label={totalPending > 0 ? `${totalPending} pending` : "Attendance clear"} />
          <StatusChip tone="neutral" label={`${totalLiveAnnouncements} live announcements`} />
        </div>
      </FilterBar>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: T.space3 }}>
        <KpiCard label="Active Students" value={String(totalActiveStudents)} note={`${cohortRows.length} cohort${cohortRows.length === 1 ? "" : "s"} in scope`} />
        <KpiCard label="Average Attendance" value={averageAttendance != null ? `${averageAttendance}%` : "—"} note={totalPending > 0 ? `${totalPending} overdue register${totalPending === 1 ? "" : "s"}` : "No overdue attendance"} />
        <KpiCard label="Report Coverage" value={averageCoverage != null ? `${averageCoverage}%` : "—"} note={`${cohortRows.reduce((count, row) => count + (row.coverage != null ? 1 : 0), 0)} cohort${cohortRows.length === 1 ? "" : "s"} reporting`} />
        <KpiCard label="Live Announcements" value={String(totalLiveAnnouncements)} note={recentAnnouncements.length > 0 ? `${recentAnnouncements.length} recent update${recentAnnouncements.length === 1 ? "" : "s"}` : "No active communication"} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: T.space4, alignItems: "start" }}>
        <Surface style={{ padding: T.space5 }}>
          <div style={{ display: "grid", gap: T.space3 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: T.space3, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ display: "grid", gap: "4px" }}>
                <SectionLabel>Attendance Trend</SectionLabel>
                <p style={{ color: T.muted, fontSize: T.textBase, margin: 0 }}>Recent delivered sessions across the visible cohort scope.</p>
              </div>
              <TrendingUp size={16} color={T.subtle} />
            </div>

            {attendanceTrendData.length === 0 ? (
              <EmptyState icon={<ClipboardCheck size={18} />} title="No cohort data" />
            ) : (
              <div style={{ display: "grid", gap: T.space3 }}>
                <div style={{ height: "280px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={attendanceTrendData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                      <defs>
                        <linearGradient id="website-reports-register-fill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={T.accent} stopOpacity={0.28} />
                          <stop offset="100%" stopColor={T.accent} stopOpacity={0.04} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke={T.borderSoft} strokeDasharray="4 4" vertical={false} />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tick={chartAxisStyle} />
                      <YAxis tickLine={false} axisLine={false} tick={chartAxisStyle} domain={[0, 100]} tickFormatter={(value) => `${value}%`} width={44} />
                      <Tooltip
                        contentStyle={chartTooltipStyle}
                        cursor={{ fill: "rgba(79,107,138,0.06)" }}
                        labelStyle={{ color: T.heading, fontWeight: 700 }}
                        formatter={(value: number | string, name: string) => [`${value}%`, chartMetricLabel(name)]}
                        labelFormatter={(_label, payload) => {
                          const item = payload?.[0]?.payload as { fullLabel?: string; cohortName?: string } | undefined;
                          return item ? `${item.fullLabel} · ${item.cohortName}` : "";
                        }}
                      />
                      <Area type="monotone" dataKey="registerRate" stroke={T.accent} strokeWidth={2} fill="url(#website-reports-register-fill)" name="registerRate" />
                      <Area type="monotone" dataKey="attendanceRate" stroke="#D97706" strokeWidth={2.5} fill="transparent" name="attendanceRate" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ display: "flex", gap: T.space3, flexWrap: "wrap" }}>
                  <StatusChip tone={fullyMarkedSessions === attendanceTrendData.length ? "success" : "warning"} label={`${fullyMarkedSessions}/${attendanceTrendData.length} fully marked`} />
                  <StatusChip tone={averageRegisterRate != null && averageRegisterRate >= 90 ? "success" : "warning"} label={averageRegisterRate != null ? `${averageRegisterRate}% register completion` : "No register data"} />
                  <StatusChip tone={averageAttendance != null && averageAttendance >= 80 ? "success" : "warning"} label={averageAttendance != null ? `${averageAttendance}% attendance quality` : "No attendance data"} />
                </div>
              </div>
            )}
          </div>
        </Surface>

        <Surface style={{ padding: T.space5 }}>
          <div style={{ display: "grid", gap: T.space3 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: T.space3, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ display: "grid", gap: "4px" }}>
                <SectionLabel>Cohort Performance</SectionLabel>
                <p style={{ color: T.muted, fontSize: T.textBase, margin: 0 }}>Attendance and report completion compared side by side.</p>
              </div>
              <BarChart3 size={16} color={T.subtle} />
            </div>

            {cohortPerformanceData.length === 0 ? (
              <EmptyState icon={<FileText size={18} />} title="No reporting data" />
            ) : (
              <div style={{ display: "grid", gap: T.space3 }}>
                <div style={{ height: "280px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cohortPerformanceData} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
                      <CartesianGrid stroke={T.borderSoft} strokeDasharray="4 4" vertical={false} />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} tick={chartAxisStyle} />
                      <YAxis tickLine={false} axisLine={false} tick={chartAxisStyle} domain={[0, 100]} tickFormatter={(value) => `${value}%`} width={44} />
                      <Tooltip
                        contentStyle={chartTooltipStyle}
                        cursor={{ fill: "rgba(79,107,138,0.06)" }}
                        labelStyle={{ color: T.heading, fontWeight: 700 }}
                        formatter={(value: number | string, name: string) => [`${value}%`, chartMetricLabel(name)]}
                        labelFormatter={(_label, payload) => {
                          const item = payload?.[0]?.payload as { fullName?: string } | undefined;
                          return item?.fullName ?? "";
                        }}
                      />
                      <Bar dataKey="attendance" fill={T.accent} radius={[6, 6, 0, 0]} />
                      <Bar dataKey="coverage" fill="#D97706" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", gap: T.space3, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: T.space3, flexWrap: "wrap" }}>
                    <StatusChip tone="neutral" label="Blue: Attendance" />
                    <StatusChip tone="warning" label="Amber: Report coverage" />
                  </div>
                  {leadingCoverageRow ? (
                    <Btn variant="secondary" size="compact" onClick={() => onOpenReports?.(leadingCoverageRow.cohort.id)}>
                      Open Progress
                    </Btn>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </Surface>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: T.space4, alignItems: "start" }}>
        <Surface style={{ padding: T.space5 }}>
          <div style={{ display: "grid", gap: T.space3 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: T.space3, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ display: "grid", gap: "4px" }}>
                <SectionLabel>Operations Load</SectionLabel>
                <p style={{ color: T.muted, fontSize: T.textBase, margin: 0 }}>Where admin work is still sitting across attendance, reports, and live comms.</p>
              </div>
              <Activity size={16} color={T.subtle} />
            </div>

            {operationsLoadData.length === 0 ? (
              <EmptyState icon={<ClipboardCheck size={18} />} title="No operations load" />
            ) : (
              <div style={{ display: "grid", gap: T.space3 }}>
                <div style={{ height: "280px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={operationsLoadData} layout="vertical" margin={{ top: 8, right: 8, bottom: 0, left: 12 }}>
                      <CartesianGrid stroke={T.borderSoft} strokeDasharray="4 4" horizontal={false} />
                      <XAxis type="number" tickLine={false} axisLine={false} tick={chartAxisStyle} />
                      <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={chartAxisStyle} width={92} />
                      <Tooltip
                        contentStyle={chartTooltipStyle}
                        cursor={{ fill: "rgba(79,107,138,0.06)" }}
                        labelStyle={{ color: T.heading, fontWeight: 700 }}
                        formatter={(value: number | string, name: string) => [value, chartMetricLabel(name)]}
                        labelFormatter={(_label, payload) => {
                          const item = payload?.[0]?.payload as { fullName?: string } | undefined;
                          return item?.fullName ?? "";
                        }}
                      />
                      <Bar dataKey="pending" stackId="ops" fill={T.danger} radius={[0, 0, 0, 0]} />
                      <Bar dataKey="missingReports" stackId="ops" fill="#D97706" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="liveUpdates" stackId="ops" fill={T.accent} radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ display: "flex", gap: T.space3, flexWrap: "wrap" }}>
                  <StatusChip tone="danger" label="Red: overdue attendance" />
                  <StatusChip tone="warning" label="Amber: missing student reports" />
                  <StatusChip tone="neutral" label="Blue: live announcements" />
                </div>

                {highestLoadRow ? (
                  <p style={{ color: T.muted, fontSize: T.textBase, lineHeight: 1.5, margin: 0 }}>
                    Highest load: <span style={{ color: T.heading, fontWeight: 700 }}>{highestLoadRow.fullName}</span> with {highestLoadRow.total} active work items.
                  </p>
                ) : null}
              </div>
            )}
          </div>
        </Surface>

        <Surface style={{ padding: T.space5 }}>
          <div style={{ display: "grid", gap: T.space3 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: T.space3, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ display: "grid", gap: "4px" }}>
                <SectionLabel>Student Distribution</SectionLabel>
                <p style={{ color: T.muted, fontSize: T.textBase, margin: 0 }}>How the active roster is spread across the cohorts in scope.</p>
              </div>
              <PieChartIcon size={16} color={T.subtle} />
            </div>

            {totalDistribution === 0 ? (
              <EmptyState icon={<Users size={18} />} title="No active students" />
            ) : (
              <div style={{ display: "grid", gap: T.space3 }}>
                <div style={{ position: "relative", height: "280px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip
                        contentStyle={chartTooltipStyle}
                        formatter={(value: number | string) => [value, "Active students"]}
                        labelFormatter={(_label, payload) => {
                          const item = payload?.[0]?.payload as { name?: string } | undefined;
                          return item?.name ?? "";
                        }}
                      />
                      <Pie data={studentDistributionData} dataKey="value" nameKey="shortName" innerRadius={72} outerRadius={104} paddingAngle={3} stroke={T.surface} strokeWidth={3}>
                        {studentDistributionData.map((entry) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", pointerEvents: "none" }}>
                    <div style={{ display: "grid", gap: "2px", textAlign: "center" }}>
                      <span style={{ color: T.success, fontSize: T.textXs, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Active</span>
                      <span style={{ color: T.heading, fontSize: T.text4xl, fontWeight: 800, lineHeight: 1 }}>{totalDistribution}</span>
                      <span style={{ color: T.muted, fontSize: T.textSm }}>students in scope</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gap: T.space2 }}>
                  {studentDistributionData.map((item) => (
                    <div key={item.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: T.space3 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: T.space2, minWidth: 0 }}>
                        <span style={{ width: "10px", height: "10px", borderRadius: "999px", backgroundColor: item.fill, flexShrink: 0 }} />
                        <span style={{ color: T.heading, fontSize: T.textBase, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</span>
                      </div>
                      <span style={{ color: T.muted, fontSize: T.textSm, fontWeight: 600 }}>
                        {item.value} • {Math.round((item.value / totalDistribution) * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Surface>
      </div>

      <Surface style={{ padding: T.space5 }}>
        <div style={{ display: "grid", gap: T.space3 }}>
          <SectionLabel>Cohort Summary</SectionLabel>

          {cohortRows.length === 0 ? (
            <EmptyState icon={<Users size={18} />} title="No cohorts in scope" />
          ) : (
            <TableShell>
              <TableHeader columns={performanceCols}>
                <Th>Cohort</Th>
                <Th align="center">Students</Th>
                <Th align="center">Attendance</Th>
                <Th align="center">Reports</Th>
                <Th align="center">Announcements</Th>
                <Th align="right">Action</Th>
              </TableHeader>
              {cohortRows.map((row) => (
                <TableRow key={row.cohort.id} columns={performanceCols} onClick={() => onOpenCohort?.(row.cohort.id)}>
                  <Td bold>{row.cohort.name}</Td>
                  <Td align="center" muted>{row.activeStudentCount}</Td>
                  <Td align="center" muted>{row.attendance != null ? `${row.attendance}%` : "—"}</Td>
                  <Td align="center" muted>{row.coverage != null ? `${row.coverage}%` : "—"}</Td>
                  <Td align="center">
                    <StatusChip tone={row.activeAnnouncementCount > 0 ? "success" : "neutral"} label={row.activeAnnouncementCount > 0 ? `${row.activeAnnouncementCount} live` : "None"} />
                  </Td>
                  <Td align="right" muted>Open Cohort</Td>
                </TableRow>
              ))}
            </TableShell>
          )}
        </div>
      </Surface>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: T.space4, alignItems: "start" }}>
        <Surface style={{ padding: T.space5 }}>
          <div style={{ display: "grid", gap: T.space3 }}>
            <SectionLabel>Pending Attendance</SectionLabel>

            {pendingRows.length === 0 ? (
              <EmptyState icon={<CalendarDays size={18} />} title="No overdue attendance" />
            ) : (
              <TableShell>
                <TableHeader columns={pendingCols}>
                  <Th>Cohort</Th>
                  <Th>Date</Th>
                  <Th>Session</Th>
                  <Th>Coach</Th>
                  <Th>Status</Th>
                </TableHeader>
                {pendingRows.map((row) => {
                  const workflow = getSessionAttendanceWorkflowStatus(row.session, row.cohort.students);
                  return (
                    <TableRow key={`${row.cohortId}-${row.session.id}`} columns={pendingCols} onClick={() => onOpenAttendance?.({ cohortId: row.cohortId, classId: row.session.id })}>
                      <Td bold>{row.cohortName}</Td>
                      <Td muted>{formatShortDate(row.session.date)}</Td>
                      <Td>{row.session.topic || "—"}</Td>
                      <Td muted>{row.coach}</Td>
                      <Td><StatusChip tone={workflowTone(workflow)} label={getAttendanceWorkflowLabel(workflow)} /></Td>
                    </TableRow>
                  );
                })}
              </TableShell>
            )}
          </div>
        </Surface>

        <Surface style={{ padding: T.space5 }}>
          <div style={{ display: "grid", gap: T.space3 }}>
            <SectionLabel>Recent Communication</SectionLabel>

            {recentAnnouncements.length === 0 ? (
              <EmptyState icon={<Megaphone size={18} />} title="No active announcements" />
            ) : (
              <TableShell>
                <TableHeader columns={announcementCols}>
                  <Th>Announcement</Th>
                  <Th>Cohort</Th>
                  <Th>Created</Th>
                </TableHeader>
                {recentAnnouncements.map((announcement) => (
                  <TableRow key={`${announcement.cohortId}-${announcement.id}`} columns={announcementCols} onClick={() => onOpenCohort?.(announcement.cohortId)}>
                    <Td>
                      <div style={{ display: "grid", gap: "4px", minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: T.space2, flexWrap: "wrap" }}>
                          <span style={{ color: T.heading, fontSize: T.textBase, fontWeight: 700 }}>{announcement.title}</span>
                          {announcement.pinned ? <StatusChip tone="warning" label="Pinned" /> : null}
                        </div>
                        <span style={{ color: T.muted, fontSize: T.textSm, lineHeight: 1.45, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {announcement.message}
                        </span>
                      </div>
                    </Td>
                    <Td muted>{announcement.cohortName}</Td>
                    <Td muted>{formatMonthDay(announcement.createdAt)}</Td>
                  </TableRow>
                ))}
              </TableShell>
            )}
          </div>
        </Surface>
      </div>
    </div>
  );
}
