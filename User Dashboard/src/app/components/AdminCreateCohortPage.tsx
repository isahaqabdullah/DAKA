import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, GraduationCap, Plus, Users, X } from "lucide-react";
import {
  ActionButton,
  ADMIN_THEME,
  STORAGE_KEY,
  SectionTitle,
  Surface,
  loadCohorts,
  type Cohort,
} from "./AdminDashboard";

const nestedCardStyle: CSSProperties = {
  border: `1px solid ${ADMIN_THEME.borderSoft}`,
  backgroundColor: ADMIN_THEME.surfaceSoft,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.75)",
};

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

function emptyCohortDraft() {
  return {
    name: "",
    program: "",
    coach: "",
    cadence: "",
    capacity: "10",
    room: "",
  };
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

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createCohortId(name: string, cohorts: Cohort[]) {
  const base = slugify(name) || "new-cohort";

  if (!cohorts.some((cohort) => cohort.id === base)) {
    return base;
  }

  let suffix = 2;
  let nextId = `${base}-${suffix}`;

  while (cohorts.some((cohort) => cohort.id === nextId)) {
    suffix += 1;
    nextId = `${base}-${suffix}`;
  }

  return nextId;
}

function buildDraftFromCohort(cohort: Cohort) {
  return {
    name: cohort.name,
    program: cohort.program,
    coach: cohort.coach,
    cadence: cohort.cadence,
    capacity: String(cohort.capacity),
    room: cohort.room,
  };
}

interface AdminCreateCohortPageProps {
  onBackToLanding?: () => void;
  onOpenCreatedCohort?: (cohortId: string) => void;
}

export function AdminCreateCohortPage({
  onBackToLanding,
  onOpenCreatedCohort,
}: AdminCreateCohortPageProps) {
  const [cohorts, setCohorts] = useState<Cohort[]>(() => loadCohorts());
  const [cohortDraft, setCohortDraft] = useState(() => emptyCohortDraft());
  const [errorMessage, setErrorMessage] = useState("");
  const [isCohortEditMode, setIsCohortEditMode] = useState(false);
  const [editingCohortId, setEditingCohortId] = useState<string | null>(null);
  const [editingCohortDraft, setEditingCohortDraft] = useState(() => emptyCohortDraft());
  const [editErrorMessage, setEditErrorMessage] = useState("");

  const trimmedName = cohortDraft.name.trim();
  const previewCapacity = Math.max(Number(cohortDraft.capacity) || 0, 0);
  const duplicateName = useMemo(
    () =>
      trimmedName.length > 0 &&
      cohorts.some((cohort) => cohort.name.trim().toLowerCase() === trimmedName.toLowerCase()),
    [cohorts, trimmedName],
  );
  const duplicateEditingName = useMemo(
    () =>
      editingCohortId !== null &&
      editingCohortDraft.name.trim().length > 0 &&
      cohorts.some(
        (cohort) =>
          cohort.id !== editingCohortId &&
          cohort.name.trim().toLowerCase() === editingCohortDraft.name.trim().toLowerCase(),
      ),
    [cohorts, editingCohortDraft.name, editingCohortId],
  );
  const displayedCohorts = useMemo(() => [...cohorts].sort((left, right) => left.name.localeCompare(right.name)), [cohorts]);
  const cohortPortfolio = useMemo(
    () =>
      cohorts.reduce(
        (summary, cohort) => ({
          students: summary.students + cohort.students.length,
          sessions: summary.sessions + cohort.classes.length,
          announcements: summary.announcements + cohort.announcements.length,
        }),
        { students: 0, sessions: 0, announcements: 0 },
      ),
    [cohorts],
  );

  function updateDraft<K extends keyof ReturnType<typeof emptyCohortDraft>>(key: K, value: ReturnType<typeof emptyCohortDraft>[K]) {
    setCohortDraft((current) => ({
      ...current,
      [key]: value,
    }));

    if (errorMessage) {
      setErrorMessage("");
    }
  }

  function updateEditingDraft<K extends keyof ReturnType<typeof emptyCohortDraft>>(
    key: K,
    value: ReturnType<typeof emptyCohortDraft>[K],
  ) {
    setEditingCohortDraft((current) => ({
      ...current,
      [key]: value,
    }));

    if (editErrorMessage) {
      setEditErrorMessage("");
    }
  }

  function persistCohorts(nextCohorts: Cohort[]) {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextCohorts));
    }

    setCohorts(nextCohorts);
  }

  function handleCloseEditModal() {
    setEditingCohortId(null);
    setEditingCohortDraft(emptyCohortDraft());
    setEditErrorMessage("");
  }

  function handleToggleEditMode() {
    const nextValue = !isCohortEditMode;
    setIsCohortEditMode(nextValue);

    if (!nextValue) {
      handleCloseEditModal();
    }
  }

  function handleOpenEdit(cohort: Cohort) {
    setIsCohortEditMode(true);
    setEditingCohortId(cohort.id);
    setEditingCohortDraft(buildDraftFromCohort(cohort));
    setEditErrorMessage("");
  }

  function handleCreateCohort(openDashboard: boolean) {
    const name = cohortDraft.name.trim();
    const program = cohortDraft.program.trim();
    const coach = cohortDraft.coach.trim();
    const cadence = cohortDraft.cadence.trim();
    const room = cohortDraft.room.trim();
    const capacity = Number(cohortDraft.capacity);

    if (!name || !program || !coach || !cadence || !room) {
      setErrorMessage("Complete all cohort setup fields before creating the cohort.");
      return;
    }

    if (!Number.isFinite(capacity) || capacity < 1) {
      setErrorMessage("Capacity must be at least 1 seat.");
      return;
    }

    if (duplicateName) {
      setErrorMessage("A cohort with that name already exists. Rename it before saving.");
      return;
    }

    const nextCohort: Cohort = {
      id: createCohortId(name, cohorts),
      name,
      program,
      coach,
      cadence,
      capacity,
      room,
      students: [],
      syllabus: [],
      classes: [],
      reports: [],
      announcements: [],
    };

    const nextCohorts = [...cohorts, nextCohort];
    persistCohorts(nextCohorts);

    if (openDashboard && onOpenCreatedCohort) {
      onOpenCreatedCohort(nextCohort.id);
      return;
    }

    onBackToLanding?.();
  }

  function handleSaveCohortEdit() {
    if (!editingCohortId) {
      return;
    }

    const name = editingCohortDraft.name.trim();
    const program = editingCohortDraft.program.trim();
    const coach = editingCohortDraft.coach.trim();
    const cadence = editingCohortDraft.cadence.trim();
    const room = editingCohortDraft.room.trim();
    const capacity = Number(editingCohortDraft.capacity);

    if (!name || !program || !coach || !cadence || !room) {
      setEditErrorMessage("Complete all cohort setup fields before saving the cohort.");
      return;
    }

    if (!Number.isFinite(capacity) || capacity < 1) {
      setEditErrorMessage("Capacity must be at least 1 seat.");
      return;
    }

    if (duplicateEditingName) {
      setEditErrorMessage("A cohort with that name already exists. Rename it before saving.");
      return;
    }

    const nextCohorts = cohorts.map((cohort) =>
      cohort.id === editingCohortId
        ? {
            ...cohort,
            name,
            program,
            coach,
            cadence,
            capacity,
            room,
          }
        : cohort,
    );

    persistCohorts(nextCohorts);
    handleCloseEditModal();
  }

  function handleDeleteCohort(cohortId: string) {
    if (typeof window !== "undefined" && !window.confirm("Delete this cohort and all of its stored data?")) {
      return;
    }

    const nextCohorts = cohorts.filter((cohort) => cohort.id !== cohortId);
    persistCohorts(nextCohorts);

    if (editingCohortId === cohortId) {
      handleCloseEditModal();
    }
  }

  return (
    <>
      <style>{`
        .cohort-create-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.12fr) minmax(320px, 380px);
          gap: 18px;
          align-items: start;
        }
        .cohort-create-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }
        .cohort-create-side-stack {
          display: grid;
          gap: 18px;
        }
        .cohort-existing-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 14px;
        }
        .cohort-create-full-span {
          grid-column: 1 / -1;
        }
        @media (max-width: 1120px) {
          .cohort-create-grid,
          .cohort-create-form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div style={{ display: "grid", gap: "18px" }}>
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

          <div style={{ display: "grid", gap: "16px", position: "relative" }}>
            {onBackToLanding ? (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <ActionButton secondary onClick={onBackToLanding} style={{ minWidth: "176px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                    <ArrowLeft size={16} /> Back To Landing
                  </span>
                </ActionButton>
              </div>
            ) : null}

            <SectionTitle eyebrow="Cohort Setup" title="Create + Manage Cohorts" detail="Dedicated subpage for new desks and existing cohorts" />

            <p style={{ color: ADMIN_THEME.muted, fontSize: "16px", lineHeight: 1.7, margin: 0, maxWidth: "860px" }}>
              Create new cohort desks here, or manage existing ones without going back to landing. New cohorts still start empty, while existing cohorts can be opened, edited, or removed from the same workspace.
            </p>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ padding: "8px 12px", borderRadius: "999px", border: `1px solid ${ADMIN_THEME.accentBorder}`, backgroundColor: ADMIN_THEME.accentBg, color: ADMIN_THEME.accent, fontSize: "12px", letterSpacing: "0px", textTransform: "uppercase" }}>
                New cohort creation
              </span>
              <span style={{ padding: "8px 12px", borderRadius: "999px", border: `1px solid ${ADMIN_THEME.border}`, backgroundColor: ADMIN_THEME.surfaceSoft, color: ADMIN_THEME.muted, fontSize: "12px", letterSpacing: "0px", textTransform: "uppercase" }}>
                Existing cohort management
              </span>
              <span style={{ padding: "8px 12px", borderRadius: "999px", border: `1px solid ${ADMIN_THEME.border}`, backgroundColor: ADMIN_THEME.surfaceSoft, color: ADMIN_THEME.muted, fontSize: "12px", letterSpacing: "0px", textTransform: "uppercase" }}>
                Attendance-ready desk
              </span>
            </div>
          </div>
        </Surface>

        <div className="cohort-create-grid">
          <Surface style={{ padding: "24px", alignSelf: "start" }}>
            <SectionTitle eyebrow="New Cohort" title="Core Setup" detail="These fields define the desk" />

            <div className="cohort-create-form-grid">
              <div>
                <FieldLabel>Cohort Name</FieldLabel>
                <FieldShell>
                  <input
                    value={cohortDraft.name}
                    onChange={(event) => updateDraft("name", event.target.value)}
                    placeholder="Juniors · Saturday"
                    style={inputStyle}
                  />
                </FieldShell>
              </div>

              <div>
                <FieldLabel>Program</FieldLabel>
                <FieldShell>
                  <input
                    value={cohortDraft.program}
                    onChange={(event) => updateDraft("program", event.target.value)}
                    placeholder="Level 1 Beginner"
                    style={inputStyle}
                  />
                </FieldShell>
              </div>

              <div>
                <FieldLabel>Lead Coach</FieldLabel>
                <FieldShell>
                  <input
                    value={cohortDraft.coach}
                    onChange={(event) => updateDraft("coach", event.target.value)}
                    placeholder="Coach Kareem"
                    style={inputStyle}
                  />
                </FieldShell>
              </div>

              <div>
                <FieldLabel>Capacity</FieldLabel>
                <FieldShell>
                  <input
                    value={cohortDraft.capacity}
                    onChange={(event) => updateDraft("capacity", event.target.value.replace(/[^\d]/g, ""))}
                    placeholder="10"
                    inputMode="numeric"
                    style={inputStyle}
                  />
                </FieldShell>
              </div>

              <div className="cohort-create-full-span">
                <FieldLabel>Cadence</FieldLabel>
                <FieldShell>
                  <input
                    value={cohortDraft.cadence}
                    onChange={(event) => updateDraft("cadence", event.target.value)}
                    placeholder="Saturday · 10:00 AM to 12:00 PM"
                    style={inputStyle}
                  />
                </FieldShell>
              </div>

              <div className="cohort-create-full-span">
                <FieldLabel>Room / Track Base</FieldLabel>
                <FieldShell>
                  <input
                    value={cohortDraft.room}
                    onChange={(event) => updateDraft("room", event.target.value)}
                    placeholder="Indoor Kartdrome"
                    style={inputStyle}
                  />
                </FieldShell>
              </div>
            </div>

            {errorMessage ? (
              <p
                style={{
                  margin: "14px 0 0 0",
                  padding: "12px 14px",
                  borderRadius: "14px",
                  border: `1px solid ${ADMIN_THEME.accentBorder}`,
                  backgroundColor: ADMIN_THEME.accentBg,
                  color: ADMIN_THEME.accent,
                  fontSize: "12px",
                  lineHeight: 1.5,
                }}
              >
                {errorMessage}
              </p>
            ) : null}

            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", flexWrap: "wrap", marginTop: "18px" }}>
              <p style={{ color: ADMIN_THEME.subtle, fontSize: "12px", lineHeight: 1.6, margin: 0 }}>
                New cohorts start with an empty roster, session list, syllabus plan, report log, and announcements log.
              </p>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <ActionButton secondary onClick={() => handleCreateCohort(false)} style={{ minWidth: "176px" }}>
                  Create And Return
                </ActionButton>
                <ActionButton onClick={() => handleCreateCohort(true)} style={{ minWidth: "238px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                    <Plus size={16} /> Create And Open Dashboard
                  </span>
                </ActionButton>
              </div>
            </div>
          </Surface>

          <div className="cohort-create-side-stack">
            <Surface style={{ padding: "24px", alignSelf: "start" }}>
              <SectionTitle eyebrow="Preview" title={trimmedName || "New Cohort"} subdetail={cohortDraft.program.trim() || "Program not set"} />

              <div style={{ display: "grid", gap: "12px" }}>
                <div style={{ padding: "14px 15px", borderRadius: "16px", ...nestedCardStyle }}>
                  <p style={{ color: ADMIN_THEME.subtle, fontSize: "10px", letterSpacing: "0px", textTransform: "uppercase", margin: "0 0 6px 0" }}>
                    Operating Slot
                  </p>
                  <p style={{ color: ADMIN_THEME.heading, fontSize: "14px", fontWeight: 700, margin: "0 0 4px 0" }}>
                    {cohortDraft.cadence.trim() || "Cadence pending"}
                  </p>
                  <p style={{ color: ADMIN_THEME.muted, fontSize: "13px", margin: 0 }}>
                    {cohortDraft.room.trim() || "Room pending"} · {cohortDraft.coach.trim() || "Coach pending"}
                  </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "10px" }}>
                  <div style={{ padding: "12px 13px", borderRadius: "14px", ...nestedCardStyle }}>
                    <p style={{ color: ADMIN_THEME.subtle, fontSize: "9px", letterSpacing: "0px", textTransform: "uppercase", margin: "0 0 6px 0" }}>Seats</p>
                    <p style={{ color: ADMIN_THEME.heading, fontSize: "13px", fontWeight: 700, margin: 0 }}>{previewCapacity || "0"}</p>
                  </div>
                  <div style={{ padding: "12px 13px", borderRadius: "14px", ...nestedCardStyle }}>
                    <p style={{ color: ADMIN_THEME.subtle, fontSize: "9px", letterSpacing: "0px", textTransform: "uppercase", margin: "0 0 6px 0" }}>Students</p>
                    <p style={{ color: ADMIN_THEME.heading, fontSize: "13px", fontWeight: 700, margin: 0 }}>0</p>
                  </div>
                  <div style={{ padding: "12px 13px", borderRadius: "14px", ...nestedCardStyle }}>
                    <p style={{ color: ADMIN_THEME.subtle, fontSize: "9px", letterSpacing: "0px", textTransform: "uppercase", margin: "0 0 6px 0" }}>Sessions</p>
                    <p style={{ color: ADMIN_THEME.heading, fontSize: "13px", fontWeight: 700, margin: 0 }}>0</p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <span style={{ padding: "7px 10px", borderRadius: "999px", backgroundColor: ADMIN_THEME.accentBg, border: `1px solid ${ADMIN_THEME.accentBorder}`, color: ADMIN_THEME.accent, fontSize: "10px", letterSpacing: "0px", textTransform: "uppercase" }}>
                    {cohorts.length + 1} total cohorts after save
                  </span>
                  {duplicateName ? (
                    <span style={{ padding: "7px 10px", borderRadius: "999px", backgroundColor: ADMIN_THEME.surfaceSoft, border: `1px solid ${ADMIN_THEME.border}`, color: ADMIN_THEME.accent, fontSize: "10px", letterSpacing: "0px", textTransform: "uppercase" }}>
                      Rename required
                    </span>
                  ) : null}
                </div>
              </div>
            </Surface>

            <Surface style={{ padding: "24px", alignSelf: "start" }}>
              <SectionTitle eyebrow="Portfolio" title="Cohort Snapshot" detail={`${cohorts.length} stored`} />

              <div style={{ display: "grid", gap: "10px" }}>
                {[
                  {
                    icon: <Users size={16} />,
                    title: `${cohortPortfolio.students} enrolled students`,
                    copy: "Open any existing cohort dashboard from below to continue roster management and coach reporting.",
                  },
                  {
                    icon: <CalendarDays size={16} />,
                    title: `${cohortPortfolio.sessions} scheduled sessions`,
                    copy: "Existing cohorts keep their class timeline and teaching data while you update the core desk details here.",
                  },
                  {
                    icon: <GraduationCap size={16} />,
                    title: `${cohortPortfolio.announcements} stored updates`,
                    copy: "Turn on edit mode below only when needed so delete controls stay tucked away during normal browsing.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    style={{
                      padding: "14px",
                      borderRadius: "16px",
                      display: "grid",
                      gap: "8px",
                      ...nestedCardStyle,
                    }}
                  >
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: ADMIN_THEME.heading }}>
                      {item.icon}
                      <span style={{ fontSize: "13px", fontWeight: 800, letterSpacing: "0px", textTransform: "uppercase" }}>{item.title}</span>
                    </div>
                    <p style={{ color: ADMIN_THEME.muted, fontSize: "13px", lineHeight: 1.55, margin: 0 }}>{item.copy}</p>
                  </div>
                ))}

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: ADMIN_THEME.heading, fontSize: "13px", fontWeight: 800, letterSpacing: "0px", textTransform: "uppercase" }}>
                    Create and manage from one page <ArrowRight size={16} />
                  </span>
                </div>
              </div>
            </Surface>
          </div>
        </div>

        <Surface style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "14px", alignItems: "flex-start", flexWrap: "wrap", marginBottom: "18px" }}>
            <div style={{ display: "grid", gap: "8px", maxWidth: "720px" }}>
              <SectionTitle eyebrow="Existing Cohorts" title="Manage Stored Desks" detail={`${cohorts.length} available`} />
              <p style={{ color: ADMIN_THEME.muted, fontSize: "13px", lineHeight: 1.65, margin: 0 }}>
                Open any cohort dashboard directly from here, or turn on edit mode to update desk details and remove retired cohorts.
              </p>
            </div>

            <ActionButton secondary onClick={handleToggleEditMode} style={{ minWidth: "188px" }}>
              {isCohortEditMode ? "Done Editing" : "Edit Cohorts"}
            </ActionButton>
          </div>

          {displayedCohorts.length === 0 ? (
            <div
              style={{
                padding: "22px",
                borderRadius: "18px",
                border: `1px dashed ${ADMIN_THEME.border}`,
                backgroundColor: ADMIN_THEME.surfaceSoft,
                color: ADMIN_THEME.subtle,
                fontSize: "14px",
                lineHeight: 1.6,
              }}
            >
              No cohorts have been created yet. Use the form above to create the first cohort desk.
            </div>
          ) : (
            <div className="cohort-existing-grid">
              {displayedCohorts.map((cohort) => {
                const completedSyllabus = cohort.syllabus.filter((item) => item.status === "Completed").length;

                return (
                  <div
                    key={cohort.id}
                    style={{
                      display: "grid",
                      gap: "14px",
                      padding: "18px",
                      borderRadius: "20px",
                      ...nestedCardStyle,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start" }}>
                      <div style={{ display: "grid", gap: "5px" }}>
                        <p style={{ color: ADMIN_THEME.accent, fontSize: "10px", fontWeight: 700, letterSpacing: "0px", textTransform: "uppercase", margin: 0 }}>
                          {cohort.program}
                        </p>
                        <h3 style={{ color: ADMIN_THEME.heading, fontSize: "22px", fontFamily: "var(--font-heading)", margin: 0, lineHeight: 0.98 }}>
                          {cohort.name}
                        </h3>
                        <p style={{ color: ADMIN_THEME.muted, fontSize: "12px", margin: 0 }}>
                          {cohort.room} · {cohort.coach}
                        </p>
                      </div>
                      <span
                        style={{
                          padding: "7px 10px",
                          borderRadius: "999px",
                          backgroundColor: ADMIN_THEME.surface,
                          border: `1px solid ${ADMIN_THEME.border}`,
                          color: ADMIN_THEME.subtle,
                          fontSize: "10px",
                          letterSpacing: "0px",
                          textTransform: "uppercase",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {cohort.cadence}
                      </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "10px" }}>
                      <div style={{ padding: "11px 12px", borderRadius: "14px", backgroundColor: ADMIN_THEME.surface, border: `1px solid ${ADMIN_THEME.borderSoft}` }}>
                        <p style={{ color: ADMIN_THEME.subtle, fontSize: "9px", letterSpacing: "0px", textTransform: "uppercase", margin: "0 0 6px 0" }}>Students</p>
                        <p style={{ color: ADMIN_THEME.heading, fontSize: "14px", fontWeight: 700, margin: 0 }}>
                          {cohort.students.length}/{cohort.capacity}
                        </p>
                      </div>
                      <div style={{ padding: "11px 12px", borderRadius: "14px", backgroundColor: ADMIN_THEME.surface, border: `1px solid ${ADMIN_THEME.borderSoft}` }}>
                        <p style={{ color: ADMIN_THEME.subtle, fontSize: "9px", letterSpacing: "0px", textTransform: "uppercase", margin: "0 0 6px 0" }}>Sessions</p>
                        <p style={{ color: ADMIN_THEME.heading, fontSize: "14px", fontWeight: 700, margin: 0 }}>{cohort.classes.length}</p>
                      </div>
                      <div style={{ padding: "11px 12px", borderRadius: "14px", backgroundColor: ADMIN_THEME.surface, border: `1px solid ${ADMIN_THEME.borderSoft}` }}>
                        <p style={{ color: ADMIN_THEME.subtle, fontSize: "9px", letterSpacing: "0px", textTransform: "uppercase", margin: "0 0 6px 0" }}>Syllabus</p>
                        <p style={{ color: ADMIN_THEME.heading, fontSize: "14px", fontWeight: 700, margin: 0 }}>
                          {completedSyllabus}/{cohort.syllabus.length}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ color: ADMIN_THEME.subtle, fontSize: "11px", lineHeight: 1.45 }}>
                        {cohort.announcements.length} updates · {cohort.reports.length} reports logged
                      </span>

                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {isCohortEditMode ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(cohort)}
                              style={{
                                minHeight: "36px",
                                padding: "0 14px",
                                borderRadius: "999px",
                                border: `1px solid ${ADMIN_THEME.border}`,
                                backgroundColor: ADMIN_THEME.surface,
                                color: ADMIN_THEME.heading,
                                fontSize: "11px",
                                fontWeight: 800,
                                letterSpacing: "0px",
                                textTransform: "uppercase",
                                cursor: "pointer",
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCohort(cohort.id)}
                              style={{
                                minHeight: "36px",
                                padding: "0 14px",
                                borderRadius: "999px",
                                border: `1px solid ${ADMIN_THEME.accentBorder}`,
                                backgroundColor: ADMIN_THEME.accentBg,
                                color: ADMIN_THEME.accent,
                                fontSize: "11px",
                                fontWeight: 800,
                                letterSpacing: "0px",
                                textTransform: "uppercase",
                                cursor: "pointer",
                              }}
                            >
                              Delete
                            </button>
                          </>
                        ) : null}

                        <ActionButton onClick={() => onOpenCreatedCohort?.(cohort.id)} style={{ minWidth: "170px" }}>
                          Open Dashboard
                        </ActionButton>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Surface>
      </div>

      {editingCohortId ? (
        <div
          onClick={handleCloseEditModal}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(22,18,14,0.38)",
            display: "grid",
            placeItems: "center",
            padding: "24px",
            zIndex: 45,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "min(680px, 100%)",
              padding: "18px",
              borderRadius: "20px",
              background: "linear-gradient(180deg, #FFFFFF 0%, #FBF8F4 100%)",
              border: `1px solid ${ADMIN_THEME.border}`,
              boxShadow: "0 24px 70px rgba(22,18,14,0.22)",
              display: "grid",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start" }}>
              <div style={{ display: "grid", gap: "4px" }}>
                <p style={{ color: ADMIN_THEME.accent, fontSize: "10px", fontWeight: 700, letterSpacing: "0px", textTransform: "uppercase", margin: 0 }}>
                  Existing Cohort
                </p>
                <h3 style={{ color: ADMIN_THEME.heading, fontSize: "24px", fontFamily: "var(--font-heading)", margin: 0, lineHeight: 1 }}>
                  Edit Cohort
                </h3>
                <p style={{ color: ADMIN_THEME.muted, fontSize: "12px", margin: 0 }}>
                  Update the core desk details here without reusing the create-cohort form.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseEditModal}
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "999px",
                  border: `1px solid ${ADMIN_THEME.border}`,
                  backgroundColor: ADMIN_THEME.surface,
                  color: ADMIN_THEME.heading,
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="cohort-create-form-grid">
              <div>
                <FieldLabel>Cohort Name</FieldLabel>
                <FieldShell>
                  <input
                    value={editingCohortDraft.name}
                    onChange={(event) => updateEditingDraft("name", event.target.value)}
                    placeholder="Juniors · Saturday"
                    style={inputStyle}
                  />
                </FieldShell>
              </div>

              <div>
                <FieldLabel>Program</FieldLabel>
                <FieldShell>
                  <input
                    value={editingCohortDraft.program}
                    onChange={(event) => updateEditingDraft("program", event.target.value)}
                    placeholder="Level 1 Beginner"
                    style={inputStyle}
                  />
                </FieldShell>
              </div>

              <div>
                <FieldLabel>Lead Coach</FieldLabel>
                <FieldShell>
                  <input
                    value={editingCohortDraft.coach}
                    onChange={(event) => updateEditingDraft("coach", event.target.value)}
                    placeholder="Coach Kareem"
                    style={inputStyle}
                  />
                </FieldShell>
              </div>

              <div>
                <FieldLabel>Capacity</FieldLabel>
                <FieldShell>
                  <input
                    value={editingCohortDraft.capacity}
                    onChange={(event) => updateEditingDraft("capacity", event.target.value.replace(/[^\d]/g, ""))}
                    placeholder="10"
                    inputMode="numeric"
                    style={inputStyle}
                  />
                </FieldShell>
              </div>

              <div className="cohort-create-full-span">
                <FieldLabel>Cadence</FieldLabel>
                <FieldShell>
                  <input
                    value={editingCohortDraft.cadence}
                    onChange={(event) => updateEditingDraft("cadence", event.target.value)}
                    placeholder="Saturday · 10:00 AM to 12:00 PM"
                    style={inputStyle}
                  />
                </FieldShell>
              </div>

              <div className="cohort-create-full-span">
                <FieldLabel>Room / Track Base</FieldLabel>
                <FieldShell>
                  <input
                    value={editingCohortDraft.room}
                    onChange={(event) => updateEditingDraft("room", event.target.value)}
                    placeholder="Indoor Kartdrome"
                    style={inputStyle}
                  />
                </FieldShell>
              </div>
            </div>

            {editErrorMessage ? (
              <p
                style={{
                  margin: 0,
                  padding: "12px 14px",
                  borderRadius: "14px",
                  border: `1px solid ${ADMIN_THEME.accentBorder}`,
                  backgroundColor: ADMIN_THEME.accentBg,
                  color: ADMIN_THEME.accent,
                  fontSize: "12px",
                  lineHeight: 1.5,
                }}
              >
                {editErrorMessage}
              </p>
            ) : null}

            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
              <p style={{ color: ADMIN_THEME.subtle, fontSize: "12px", lineHeight: 1.6, margin: 0 }}>
                Existing student, report, schedule, and announcement data stays attached to this cohort while the desk details are updated.
              </p>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <ActionButton secondary onClick={handleCloseEditModal} style={{ minWidth: "144px" }}>
                  Cancel
                </ActionButton>
                <ActionButton onClick={handleSaveCohortEdit} style={{ minWidth: "176px" }}>
                  Save Changes
                </ActionButton>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
