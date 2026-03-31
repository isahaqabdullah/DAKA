import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { ArrowLeft, Plus, X } from "lucide-react";
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
  mode?: "create" | "manage";
  onBackToLanding?: () => void;
  onOpenCreatedCohort?: (cohortId: string) => void;
}

export function AdminCreateCohortPage({
  mode = "create",
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
  const displayedCohorts = useMemo(
    () => [...cohorts].sort((left, right) => {
      if ((left.archived ?? false) !== (right.archived ?? false)) return left.archived ? 1 : -1;
      return left.name.localeCompare(right.name);
    }),
    [cohorts],
  );
  const isCreateMode = mode === "create";
  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(() => isCreateMode || cohorts.length === 0);

  useEffect(() => {
    if (isCreateMode || cohorts.length === 0) {
      setIsCreatePanelOpen(true);
    }
  }, [cohorts.length, isCreateMode]);

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
    setCohortDraft(emptyCohortDraft());
    setErrorMessage("");

    if (openDashboard && onOpenCreatedCohort) {
      onOpenCreatedCohort(nextCohort.id);
      return;
    }

    if (isCreateMode) {
      onBackToLanding?.();
      return;
    }

    setIsCreatePanelOpen(false);
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

  function handleArchiveCohort(cohortId: string) {
    const cohort = cohorts.find((c) => c.id === cohortId);
    if (!cohort) return;
    const nextCohorts = cohorts.map((c) =>
      c.id === cohortId ? { ...c, archived: !c.archived } : c,
    );
    persistCohorts(nextCohorts);
  }

  return (
    <>
      <style>{`
        .cohort-create-grid {
          display: grid;
          gap: 12px;
        }
        .cohort-create-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
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

          <div style={{ display: "grid", gap: "12px", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start", flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", flexWrap: "wrap" }}>
                {onBackToLanding ? (
                  <button
                    type="button"
                    onClick={onBackToLanding}
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "12px",
                      border: `1px solid ${ADMIN_THEME.border}`,
                      backgroundColor: ADMIN_THEME.surface,
                      color: ADMIN_THEME.heading,
                      display: "grid",
                      placeItems: "center",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    <ArrowLeft size={16} />
                  </button>
                ) : null}
                <SectionTitle
                  eyebrow="Cohort Management"
                  title={isCreateMode ? "Create Cohort" : "Create and Maintain Cohorts"}
                  detail={
                    isCreateMode
                      ? "Set up a new cohort desk and open it once the setup is complete."
                      : "Create new cohorts here, then edit, archive, delete, and open existing cohort desks."
                  }
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ padding: "8px 12px", borderRadius: "999px", border: `1px solid ${ADMIN_THEME.accentBorder}`, backgroundColor: ADMIN_THEME.accentBg, color: ADMIN_THEME.accent, fontSize: "12px", letterSpacing: "0px", textTransform: "uppercase" }}>
                {cohorts.length} stored cohort{cohorts.length === 1 ? "" : "s"}
              </span>
              <span style={{ padding: "8px 12px", borderRadius: "999px", border: `1px solid ${ADMIN_THEME.border}`, backgroundColor: ADMIN_THEME.surfaceSoft, color: ADMIN_THEME.muted, fontSize: "12px", letterSpacing: "0px", textTransform: "uppercase" }}>
                {isCreateMode ? "Attendance-ready desk" : "Create, edit, archive"}
              </span>
              {isCreateMode || isCreatePanelOpen ? (
                <span style={{ padding: "8px 12px", borderRadius: "999px", border: `1px solid ${ADMIN_THEME.border}`, backgroundColor: ADMIN_THEME.surfaceSoft, color: ADMIN_THEME.muted, fontSize: "12px", letterSpacing: "0px", textTransform: "uppercase" }}>
                  Create and optionally open dashboard
                </span>
              ) : null}
            </div>
          </div>
        </Surface>

        <Surface style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "14px", alignItems: "flex-start", flexWrap: "wrap", marginBottom: "18px" }}>
            <div style={{ maxWidth: "720px" }}>
              <SectionTitle eyebrow="Existing Cohorts" title="Manage Stored Desks" detail={`${cohorts.length} available`} />
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {!isCreatePanelOpen ? (
                <ActionButton onClick={() => setIsCreatePanelOpen(true)} style={{ minWidth: "188px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                    <Plus size={16} /> Create Cohort
                  </span>
                </ActionButton>
              ) : null}
              <ActionButton secondary onClick={handleToggleEditMode} style={{ minWidth: "188px" }}>
                {isCohortEditMode ? "Done Editing" : "Edit Cohorts"}
              </ActionButton>
            </div>
          </div>

          {isCreateMode || isCreatePanelOpen ? (
            <div className="cohort-create-grid" style={{ marginBottom: "18px" }}>
              <div style={{ padding: "24px", borderRadius: "22px", ...nestedCardStyle }}>
                <SectionTitle
                  eyebrow="New Cohort"
                  title={isCreateMode ? "Core Setup" : "Create Cohort"}
                  detail={isCreateMode ? "These fields define the desk." : "Add a new cohort without leaving cohort management."}
                />

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

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", flexWrap: "wrap", marginTop: "18px" }}>
                    {isCreateMode ? (
                      <ActionButton secondary onClick={() => handleCreateCohort(false)} style={{ minWidth: "176px" }}>
                        Create And Return
                      </ActionButton>
                    ) : (
                      <>
                        <ActionButton secondary onClick={() => setIsCreatePanelOpen(false)} style={{ minWidth: "152px" }}>
                          Close Form
                        </ActionButton>
                        <ActionButton secondary onClick={() => handleCreateCohort(false)} style={{ minWidth: "176px" }}>
                          Create Cohort
                        </ActionButton>
                      </>
                    )}
                    <ActionButton onClick={() => handleCreateCohort(true)} style={{ minWidth: "238px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                        <Plus size={16} /> Create And Open Dashboard
                      </span>
                    </ActionButton>
                </div>
              </div>
            </div>
          ) : null}

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
              No cohorts have been created yet. Use the create cohort panel above to create the first cohort desk.
            </div>
          ) : (
            <div className="cohort-existing-grid">
              {displayedCohorts.map((cohort) => {
                const completedSyllabus = cohort.syllabus.filter((item) => item.status === "complete").length;
                const isArchived = cohort.archived ?? false;

                return (
                  <div
                    key={cohort.id}
                    style={{
                      display: "grid",
                      gap: "14px",
                      padding: "18px",
                      borderRadius: "20px",
                      ...nestedCardStyle,
                      opacity: isArchived ? 0.65 : 1,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start" }}>
                      <div style={{ display: "grid", gap: "5px" }}>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <p style={{ color: ADMIN_THEME.accent, fontSize: "10px", fontWeight: 700, letterSpacing: "0px", textTransform: "uppercase", margin: 0 }}>
                            {cohort.program}
                          </p>
                          {isArchived && (
                            <span style={{ padding: "2px 8px", borderRadius: "999px", backgroundColor: ADMIN_THEME.surfaceSoft, border: `1px solid ${ADMIN_THEME.border}`, color: ADMIN_THEME.subtle, fontSize: "9px", fontWeight: 700, letterSpacing: "0px", textTransform: "uppercase" }}>
                              Archived
                            </span>
                          )}
                        </div>
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
                              onClick={() => handleArchiveCohort(cohort.id)}
                              style={{
                                minHeight: "36px",
                                padding: "0 14px",
                                borderRadius: "999px",
                                border: `1px solid ${ADMIN_THEME.border}`,
                                backgroundColor: isArchived ? ADMIN_THEME.surface : ADMIN_THEME.surfaceSoft,
                                color: ADMIN_THEME.subtle,
                                fontSize: "11px",
                                fontWeight: 800,
                                letterSpacing: "0px",
                                textTransform: "uppercase",
                                cursor: "pointer",
                              }}
                            >
                              {isArchived ? "Unarchive" : "Archive"}
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
