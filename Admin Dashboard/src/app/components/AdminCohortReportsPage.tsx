import { useEffect, useMemo, useState } from "react";
import { Check, FileText } from "lucide-react";
import {
  Btn, T, PageHeader, FilterBar, InlineSelect, TableShell, TableHeader, Th, TableRow, Td, StatusChip,
  EmptyState, StickyActionBar, SectionLabel, Surface,
  createId,
  loadCohorts, STORAGE_KEY,
  type Cohort, type ReportEntry, type StudentRecord,
} from "./AdminDashboard";

type WeeklyGrade = "A" | "B" | "C" | "D";
const GRADES: WeeklyGrade[] = ["A", "B", "C", "D"];

type AttentionTone = "good" | "watch" | "risk" | "neutral";
type SkillCategory = "Driving" | "Mechanical" | "Racecraft" | "Session";

interface SkillTemplate {
  id: string;
  label: string;
  category: SkillCategory;
}

const SKILL_ID_ALIASES: Record<string, string[]> = {
  "full-daily-maintenance-checklist": ["daily-maintenance-checklist"],
};

function parseWeekIndex(v: string) { const m = v.match(/(\d+)/); return m ? Number(m[1]) : Infinity; }
function sortWeeks(values: string[]) { return [...new Set(values)].sort((a, b) => parseWeekIndex(a) - parseWeekIndex(b) || a.localeCompare(b)); }
function normalizeGrade(v?: string): WeeklyGrade | "" { return GRADES.includes(v as WeeklyGrade) ? (v as WeeklyGrade) : ""; }

function getReportWeekLabel(r: ReportEntry, i = 0) {
  if (r.weekLabel?.trim()) return r.weekLabel.trim();
  const m = r.title.match(/Week\s*\d+/i)?.[0];
  if (m) return m.replace(/\s+/g, " ").replace("week", "Week");
  return `Week ${String(i + 1).padStart(2, "0")}`;
}

function findReport(reports: ReportEntry[], studentId: string, week: string) {
  return reports.find((r) => r.studentId === studentId && getReportWeekLabel(r) === week);
}

function buildWeekOptions(cohort?: Cohort) {
  if (!cohort) return ["Week 01"];
  const weeks = [...cohort.syllabus.map((s) => s.weekLabel), ...cohort.reports.map((r) => r.weekLabel).filter(Boolean) as string[], ...cohort.classes.map((_, i) => `Week ${String(i + 1).padStart(2, "0")}`)];
  return weeks.length > 0 ? sortWeeks(weeks) : ["Week 01"];
}

function formatShort(v: string) { return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(v)); }

function toSkillId(label: string) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function buildSkillSet(entries: Array<[SkillCategory, string]>): SkillTemplate[] {
  return entries.map(([category, label]) => ({ id: toSkillId(label), label, category }));
}

/* Inspired by the DAKA Parents Pack weekly task progression. */
const PDF_WEEKLY_SKILLS: Record<string, Record<string, SkillTemplate[]>> = {
  "junior-thursday": {
    "Week 01": buildSkillSet([
      ["Driving", "Correct driving position"],
      ["Driving", "Steering technique"],
      ["Racecraft", "Racing line basics"],
      ["Mechanical", "Full daily maintenance checklist"],
    ]),
    "Week 02": buildSkillSet([
      ["Driving", "Braking points"],
      ["Racecraft", "CW and anti-CW circuit cues"],
      ["Mechanical", "Wheel change and tyre pressure"],
      ["Session", "Safety flags and pit rules"],
    ]),
    "Week 03": buildSkillSet([
      ["Driving", "Circuit memorisation"],
      ["Racecraft", "Smooth steering reset"],
      ["Mechanical", "Brake pads check and refit"],
      ["Session", "Workshop tool handling"],
    ]),
    "Week 04": buildSkillSet([
      ["Driving", "Corner apex consistency"],
      ["Racecraft", "Brake release timing"],
      ["Mechanical", "Spark plugs and gapping"],
      ["Session", "Coach instruction recall"],
    ]),
    "Week 05": buildSkillSet([
      ["Driving", "Anti-clockwise adaptation"],
      ["Racecraft", "Traffic awareness"],
      ["Mechanical", "Brake fluid bleed"],
      ["Session", "Session independence"],
    ]),
    "Week 06": buildSkillSet([
      ["Driving", "Track map confidence"],
      ["Racecraft", "Post-session debrief"],
      ["Mechanical", "Carburetor removal and refit"],
      ["Session", "Mechanical sequencing"],
    ]),
    "Week 07": buildSkillSet([
      ["Driving", "Repeatable lap routine"],
      ["Racecraft", "Exit vision"],
      ["Mechanical", "Oil change"],
      ["Session", "Self-check on kart condition"],
    ]),
    "Week 08": buildSkillSet([
      ["Driving", "Pressure and grip awareness"],
      ["Racecraft", "Line memory under pace"],
      ["Mechanical", "Air filter removal and cleaning"],
      ["Session", "Workshop clean-down"],
    ]),
    "Week 09": buildSkillSet([
      ["Driving", "Indoor race application"],
      ["Racecraft", "Start procedure awareness"],
      ["Mechanical", "Rear sprocket alignment"],
      ["Session", "Race-day resilience"],
    ]),
    "Week 10": buildSkillSet([
      ["Driving", "Outdoor track orientation"],
      ["Racecraft", "Safe first outdoor laps"],
      ["Mechanical", "Outdoor kart handover checks"],
      ["Session", "Transfer indoor habits outdoors"],
    ]),
  },
  "advanced-tuesday": {
    "Week 01": buildSkillSet([
      ["Mechanical", "Carburetor cleaning"],
      ["Racecraft", "Overtaking through designated corners"],
      ["Driving", "Consistency and smoothness"],
      ["Session", "Race discipline briefing"],
    ]),
    "Week 02": buildSkillSet([
      ["Mechanical", "Drive belt adjust and replace"],
      ["Racecraft", "Defending position"],
      ["Driving", "Cadet circuit adaptation"],
      ["Session", "Session preparation"],
    ]),
    "Week 03": buildSkillSet([
      ["Mechanical", "Steering column removal and refit"],
      ["Racecraft", "Progressive circuit mastery"],
      ["Driving", "Braking map recall"],
      ["Session", "Workshop safety"],
    ]),
    "Week 04": buildSkillSet([
      ["Mechanical", "Stub axle and track rod removal"],
      ["Racecraft", "Fast line repeatability"],
      ["Driving", "Exit commitment"],
      ["Session", "Coach feedback application"],
    ]),
    "Week 05": buildSkillSet([
      ["Mechanical", "Front wheel alignment"],
      ["Racecraft", "Recovery lines"],
      ["Driving", "National circuit reference points"],
      ["Session", "Defensive positioning"],
    ]),
    "Week 06": buildSkillSet([
      ["Mechanical", "Rear sprocket refit and alignment"],
      ["Racecraft", "Overtaking window recognition"],
      ["Driving", "National circuit consistency"],
      ["Session", "Mechanical care"],
    ]),
    "Week 07": buildSkillSet([
      ["Mechanical", "Exhaust and inlet valve clearance"],
      ["Racecraft", "Race discipline under traffic"],
      ["Driving", "Trail braking"],
      ["Session", "Data recall"],
    ]),
    "Week 08": buildSkillSet([
      ["Mechanical", "Exhaust removal and refit"],
      ["Racecraft", "Line adjustment under pressure"],
      ["Driving", "Rotating the kart"],
      ["Session", "Workshop independence"],
    ]),
    "Week 09": buildSkillSet([
      ["Mechanical", "Engine removal"],
      ["Racecraft", "Session resilience"],
      ["Driving", "Outdoor International confidence"],
      ["Session", "Start procedure focus"],
    ]),
    "Week 10": buildSkillSet([
      ["Mechanical", "Kart care after session"],
      ["Racecraft", "Competitive awareness"],
      ["Driving", "Race-day execution"],
      ["Session", "SWS-format review"],
    ]),
  },
};

function getWeekContext(cohort: Cohort, week: string) {
  const weekIndex = Math.max(parseWeekIndex(week) - 1, 0);
  const syllabus = cohort.syllabus.find((item) => item.weekLabel === week) ?? cohort.syllabus[weekIndex];
  const session = cohort.classes[weekIndex];
  return { syllabus, session };
}

function trimSkillLabel(value: string | undefined, fallback: string) {
  const clean = value?.replace(/\s+/g, " ").replace(/\.$/, "").trim();
  if (!clean) return fallback;
  return clean.length > 52 ? `${clean.slice(0, 49).trim()}...` : clean;
}

function buildFallbackSkills(cohort: Cohort, week: string) {
  const { syllabus, session } = getWeekContext(cohort, week);
  return buildSkillSet([
    ["Driving", trimSkillLabel(syllabus?.title, `${week} driving objective`)],
    ["Racecraft", trimSkillLabel(syllabus?.objective, "Apply the weekly racing focus safely")],
    ["Mechanical", trimSkillLabel(session?.topic, "Complete the weekly workshop task")],
    ["Session", "Coach feedback applied"],
  ]);
}

function getWeekSkills(cohort: Cohort, week: string) {
  return PDF_WEEKLY_SKILLS[cohort.id]?.[week] ?? buildFallbackSkills(cohort, week);
}

function getReportSkillChecks(report: ReportEntry | undefined, skills: SkillTemplate[]) {
  const checks: Record<string, boolean> = {};
  for (const skill of skills) {
    const aliases = SKILL_ID_ALIASES[skill.id] ?? [];
    const matchedKey = [skill.id, ...aliases].find((key) => report?.skillChecks?.[key] !== undefined);
    checks[skill.id] = Boolean(matchedKey ? report?.skillChecks?.[matchedKey] : false);
  }
  return checks;
}

function hasWeeklyEntry(report: ReportEntry | undefined) {
  if (!report) return false;
  if (Object.keys(report.skillChecks ?? {}).length > 0) return true;
  return Boolean(report.summary?.trim() || report.remark?.trim() || report.grade);
}

function countCheckedSkills(checks: Record<string, boolean>, skills: SkillTemplate[]) {
  return skills.reduce((total, skill) => total + (checks[skill.id] ? 1 : 0), 0);
}

function summarizeSkillChecks(skills: SkillTemplate[], checks: Record<string, boolean>) {
  const completed = skills.filter((skill) => checks[skill.id]);
  if (completed.length === 0) return "No skills checked yet.";
  if (completed.length === skills.length) return `All ${skills.length} skills checked.`;
  const list = completed.slice(0, 3).map((skill) => skill.label).join(", ");
  const extra = completed.length > 3 ? ` +${completed.length - 3} more` : "";
  return `${completed.length}/${skills.length} skills checked: ${list}${extra}.`;
}

function deriveGradeFromChecks(skills: SkillTemplate[], checks: Record<string, boolean>): WeeklyGrade | undefined {
  if (skills.length === 0) return undefined;
  const ratio = countCheckedSkills(checks, skills) / skills.length;
  if (ratio >= 0.85) return "A";
  if (ratio >= 0.7) return "B";
  if (ratio >= 0.45) return "C";
  if (ratio > 0) return "D";
  return undefined;
}

function getReportProgress(report: ReportEntry | undefined, cohort: Cohort) {
  if (!report) return null;
  const week = getReportWeekLabel(report);
  const skills = getWeekSkills(cohort, week);
  if (skills.length > 0 && report.skillChecks) {
    const trackedSkills = skills.filter((skill) => report.skillChecks?.[skill.id] !== undefined);
    if (trackedSkills.length > 0) return Math.round((countCheckedSkills(report.skillChecks, skills) / skills.length) * 100);
  }
  const grade = normalizeGrade(report.grade);
  if (grade === "A") return 95;
  if (grade === "B") return 80;
  if (grade === "C") return 60;
  if (grade === "D") return 35;
  return null;
}

/* analytics helpers */

function getStudentAttendanceRate(s: StudentRecord, classes: Cohort["classes"]) {
  let marked = 0, good = 0;
  for (const c of classes) { const st = s.attendance[c.id]; if (st && st !== "pending") { marked++; if (st === "present" || st === "late") good++; } }
  return marked === 0 ? null : Math.round((good / marked) * 100);
}

function getStudentTone(attRate: number | null, progress: number | null): { tone: AttentionTone; label: string } {
  if (attRate !== null && attRate < 70) return { tone: "risk", label: "Low Attendance" };
  if (progress !== null && progress < 40) return { tone: "risk", label: "Low Progress" };
  if ((progress !== null && progress < 70) || (attRate !== null && attRate < 85)) return { tone: "watch", label: "Watch" };
  if (progress !== null && progress >= 70) return { tone: "good", label: "On Track" };
  return { tone: "neutral", label: "–" };
}

const toneChip: Record<AttentionTone, "success" | "warning" | "danger" | "neutral"> = { good: "success", watch: "warning", risk: "danger", neutral: "neutral" };

/* component */

interface Props {
  initialCohortId?: string;
  initialStudentId?: string;
  onSelectCohort?: (id: string) => void;
  onSelectStudent?: (id: string) => void;
}

export function AdminReportsPage({ initialCohortId, initialStudentId, onSelectCohort, onSelectStudent }: Props) {
  const [cohorts, setCohorts] = useState<Cohort[]>(() => loadCohorts());
  const [selectedCohortId, setSelectedCohortId] = useState(initialCohortId ?? loadCohorts()[0]?.id ?? "");
  const [tab, setTab] = useState("weekly");
  const activeCohorts = cohorts.filter((c) => !c.archived);
  const cohort = cohorts.find((c) => c.id === selectedCohortId) ?? cohorts[0];
  const weekOptions = buildWeekOptions(cohort);
  const [selectedWeek, setSelectedWeek] = useState(weekOptions[weekOptions.length - 1] ?? "Week 01");

  useEffect(() => { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cohorts)); }, [cohorts]);
  useEffect(() => { if (initialCohortId && cohorts.some((c) => c.id === initialCohortId)) setSelectedCohortId(initialCohortId); }, [initialCohortId, cohorts]);
  useEffect(() => {
    if (!weekOptions.includes(selectedWeek)) {
      setSelectedWeek(weekOptions[weekOptions.length - 1] ?? "Week 01");
    }
  }, [selectedWeek, weekOptions]);

  function selectCohort(id: string) { setSelectedCohortId(id); onSelectCohort?.(id); }

  const activeStudents = cohort?.students.filter((student) => (student.status ?? "active") === "active") ?? [];
  const selectedWeekSkills = cohort ? getWeekSkills(cohort, selectedWeek) : [];
  const reportViewOptions = [
    { id: "weekly", label: "Weekly Progress" },
    { id: "analytics", label: "Analytics" },
  ] as const;

  void initialStudentId;
  void onSelectStudent;

  if (!cohort) return null;

  return (
    <div style={{ display: "grid", gap: T.space4 }}>
      <PageHeader title="Student Progress">
        <StatusChip tone="success" label={`${activeStudents.length} active students`} />
        <StatusChip tone="neutral" label={`${cohort.classes.length} sessions`} />
        <StatusChip tone="neutral" label={`${cohort.reports.length} reports`} />
      </PageHeader>

      <FilterBar>
        <InlineSelect value={selectedCohortId} onChange={selectCohort} style={{ minWidth: "200px" }}>
          {activeCohorts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </InlineSelect>
        <InlineSelect value={tab} onChange={setTab} style={{ minWidth: "180px" }}>
          {reportViewOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
        </InlineSelect>
        {tab === "weekly" ? (
          <InlineSelect value={selectedWeek} onChange={setSelectedWeek} style={{ minWidth: "140px" }}>
            {weekOptions.map((w) => <option key={w} value={w}>{w}</option>)}
          </InlineSelect>
        ) : null}
      </FilterBar>

      {tab === "weekly" ? (
        <WeeklyReportsTab cohort={cohort} setCohorts={setCohorts} selectedWeek={selectedWeek} selectedWeekSkills={selectedWeekSkills} />
      ) : (
        <AnalyticsTab cohort={cohort} />
      )}
    </div>
  );
}

/* Weekly Reports Tab */

function WeeklyReportsTab({ cohort, setCohorts, selectedWeek, selectedWeekSkills }: {
  cohort: Cohort;
  setCohorts: (fn: (c: Cohort[]) => Cohort[]) => void;
  selectedWeek: string;
  selectedWeekSkills: SkillTemplate[];
}) {
  const activeStudents = useMemo(
    () => cohort.students.filter((s) => (s.status ?? "active") === "active"),
    [cohort.students],
  );
  const weekContext = useMemo(() => getWeekContext(cohort, selectedWeek), [cohort.id, selectedWeek, cohort.syllabus, cohort.classes]);

  type DraftMap = Record<string, Record<string, boolean>>;
  const [drafts, setDrafts] = useState<DraftMap>(() => {
    const map: DraftMap = {};
    for (const s of activeStudents) {
      map[s.id] = getReportSkillChecks(findReport(cohort.reports, s.id, selectedWeek), selectedWeekSkills);
    }
    return map;
  });

  useEffect(() => {
    const map: DraftMap = {};
    for (const s of activeStudents) {
      map[s.id] = getReportSkillChecks(findReport(cohort.reports, s.id, selectedWeek), selectedWeekSkills);
    }
    setDrafts(map);
  }, [selectedWeek, cohort.id, cohort.reports, activeStudents, selectedWeekSkills]);

  const hasChanges = useMemo(() => {
    for (const s of activeStudents) {
      const original = getReportSkillChecks(findReport(cohort.reports, s.id, selectedWeek), selectedWeekSkills);
      const draft = drafts[s.id] ?? {};
      for (const skill of selectedWeekSkills) {
        if (Boolean(draft[skill.id]) !== original[skill.id]) return true;
      }
    }
    return false;
  }, [drafts, cohort.reports, selectedWeek, selectedWeekSkills, activeStudents]);

  function saveAll() {
    const now = new Date().toISOString();
    setCohorts((all) => all.map((c) => {
      if (c.id !== cohort.id) return c;
      let reports = [...c.reports];
      for (const s of activeStudents) {
        const existing = findReport(reports, s.id, selectedWeek);
        const checks = Object.fromEntries(selectedWeekSkills.map((skill) => [skill.id, Boolean(drafts[s.id]?.[skill.id])])) as Record<string, boolean>;
        const checkedCount = countCheckedSkills(checks, selectedWeekSkills);
        if (!existing && checkedCount === 0) continue;
        const summary = summarizeSkillChecks(selectedWeekSkills, checks);
        const grade = deriveGradeFromChecks(selectedWeekSkills, checks);
        if (existing) {
          reports = reports.map((r) => r.id === existing.id ? { ...r, skillChecks: checks, summary, remark: summary, grade, createdAt: now } : r);
        } else {
          reports.push({
            id: createId("report"),
            studentId: s.id,
            title: `${selectedWeek} progress`,
            summary,
            recommendation: "",
            weekLabel: selectedWeek,
            grade,
            remark: summary,
            skillChecks: checks,
            createdAt: now,
          });
        }
      }
      return { ...c, reports };
    }));
  }

  const cols = `minmax(220px,1.2fr) repeat(${selectedWeekSkills.length}, minmax(156px,1fr)) 108px`;
  const tableMinWidth = `${380 + selectedWeekSkills.length * 164}px`;

  return (
    <>
      <Surface style={{ padding: T.space5 }}>
        <div style={{ display: "grid", gap: T.space3 }}>
          <div style={{ display: "grid", gap: T.space1 }}>
            <SectionLabel>Weekly Progress</SectionLabel>
            <div style={{ color: T.heading, fontSize: T.textLg, fontWeight: 700 }}>
              {selectedWeek} · {weekContext.syllabus?.title ?? weekContext.session?.topic ?? "Skill checklist"}
            </div>
          </div>

          <TableShell>
            <div style={{ minWidth: tableMinWidth }}>
              <TableHeader columns={cols}>
                <Th>Student</Th>
                {selectedWeekSkills.map((skill) => (
                  <div key={skill.id} style={{ display: "grid", gap: "3px", minWidth: 0 }}>
                    <span style={{ color: T.subtle, fontSize: T.textXs, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                      {skill.category}
                    </span>
                    <span style={{ color: T.heading, fontSize: T.textSm, fontWeight: 700, lineHeight: 1.25 }}>
                      {skill.label}
                    </span>
                  </div>
                ))}
                <Th align="right">Progress</Th>
              </TableHeader>

              {activeStudents.length === 0 ? (
                <EmptyState icon={<FileText size={24} />} title="No students" />
              ) : activeStudents.map((s) => {
                const existing = findReport(cohort.reports, s.id, selectedWeek);
                const draft = drafts[s.id] ?? getReportSkillChecks(existing, selectedWeekSkills);
                const checkedCount = countCheckedSkills(draft, selectedWeekSkills);
                return (
                  <TableRow key={s.id} columns={cols} highlight={selectedWeekSkills.length > 0 && checkedCount === selectedWeekSkills.length}>
                    <div style={{ minWidth: 0, display: "grid", gap: "3px" }}>
                      <span style={{ color: T.text, fontSize: T.textMd, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {s.name}
                      </span>
                      <span style={{ color: T.subtle, fontSize: T.textSm, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {s.pace} pace
                      </span>
                    </div>

                    {selectedWeekSkills.map((skill) => {
                      const checked = Boolean(draft[skill.id]);
                      return (
                        <div key={skill.id} style={{ display: "flex", justifyContent: "center" }}>
                          <label
                            title={skill.label}
                            style={{
                              position: "relative",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "42px",
                              height: "42px",
                              borderRadius: T.radiusMd,
                              border: checked ? "1px solid rgba(104,146,255,0.34)" : `1px solid ${T.borderSoft}`,
                              background: checked ? "linear-gradient(180deg, rgba(245,249,255,0.96) 0%, rgba(232,240,255,0.92) 100%)" : "linear-gradient(180deg, #FCFDFE 0%, #F6F8FB 100%)",
                              boxShadow: checked
                                ? "0 10px 22px rgba(74,125,255,0.14), inset 0 1px 0 rgba(255,255,255,0.95)"
                                : "inset 0 1px 0 rgba(255,255,255,0.9)",
                              cursor: "pointer",
                              transition: "border-color 0.14s ease, box-shadow 0.14s ease, background 0.14s ease, transform 0.14s ease",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => setDrafts((prev) => ({ ...prev, [s.id]: { ...(prev[s.id] ?? {}), [skill.id]: e.target.checked } }))}
                              aria-label={`${s.name} · ${skill.label}`}
                              style={{ position: "absolute", inset: 0, opacity: 0, margin: 0, cursor: "pointer" }}
                            />
                            <span
                              aria-hidden="true"
                              style={{
                                display: "grid",
                                placeItems: "center",
                                width: "20px",
                                height: "20px",
                                borderRadius: "7px",
                                border: checked ? "1px solid #2C5BE3" : "1px solid #CBD5E1",
                                background: checked
                                  ? "linear-gradient(180deg, #5C8BFF 0%, #3B82F6 55%, #2C5BE3 100%)"
                                  : "linear-gradient(180deg, #FFFFFF 0%, #EEF2F7 100%)",
                                boxShadow: checked
                                  ? "0 6px 14px rgba(74,125,255,0.22), inset 0 1px 0 rgba(255,255,255,0.28)"
                                  : "inset 0 1px 0 rgba(255,255,255,0.94)",
                                transition: "border-color 0.14s ease, box-shadow 0.14s ease, background 0.14s ease",
                              }}
                            >
                              {checked ? (
                                <Check size={13} strokeWidth={3} color="#FFFFFF" />
                              ) : (
                                <span style={{ width: 5, height: 5, borderRadius: "999px", backgroundColor: "rgba(148,163,184,0.62)" }} />
                              )}
                            </span>
                          </label>
                        </div>
                      );
                    })}

                    <div style={{ display: "grid", gap: "3px", justifyItems: "end", minWidth: 0 }}>
                      <span style={{ color: T.heading, fontSize: T.textMd, fontWeight: 700 }}>
                        {checkedCount}/{selectedWeekSkills.length}
                      </span>
                      <span style={{ color: T.subtle, fontSize: T.textSm }}>
                        {existing ? formatShort(existing.createdAt) : "Not saved"}
                      </span>
                    </div>
                  </TableRow>
                );
              })}
            </div>
          </TableShell>
        </div>
      </Surface>

      <StickyActionBar visible={hasChanges}>
        <span style={{ color: T.muted, fontSize: T.textSm, marginRight: "auto" }}>Unsaved changes</span>
        <Btn onClick={saveAll}>Save All</Btn>
      </StickyActionBar>
    </>
  );
}

/* Analytics Tab */

function AnalyticsTab({ cohort }: { cohort: Cohort }) {
  const activeStudents = cohort.students.filter((s) => (s.status ?? "active") === "active");

  const studentRows = activeStudents.map((s) => {
    const attRate = getStudentAttendanceRate(s, cohort.classes);
    const latestReport = [...cohort.reports].filter((r) => r.studentId === s.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    const progress = getReportProgress(latestReport, cohort);
    const attention = getStudentTone(attRate, progress);
    return { student: s, attRate, progress, attention };
  }).sort((a, b) => {
    const order: Record<AttentionTone, number> = { risk: 0, watch: 1, neutral: 2, good: 3 };
    return order[a.attention.tone] - order[b.attention.tone];
  });

  const cols = "minmax(140px,1fr) 92px 92px 110px";

  return (
    <Surface style={{ padding: T.space5 }}>
      <div style={{ display: "grid", gap: T.space3 }}>
        <SectionLabel>Student Overview</SectionLabel>
        <TableShell>
          <TableHeader columns={cols}>
            <Th>Student</Th>
            <Th>Attendance</Th>
            <Th>Progress</Th>
            <Th>Flag</Th>
          </TableHeader>
          {studentRows.map((r) => (
            <TableRow key={r.student.id} columns={cols}>
              <Td bold>{r.student.name}</Td>
              <Td muted>{r.attRate != null ? `${r.attRate}%` : "–"}</Td>
              <Td muted>{r.progress != null ? `${r.progress}%` : "–"}</Td>
              <Td><StatusChip tone={toneChip[r.attention.tone]} label={r.attention.label} /></Td>
            </TableRow>
          ))}
        </TableShell>
      </div>
    </Surface>
  );
}
