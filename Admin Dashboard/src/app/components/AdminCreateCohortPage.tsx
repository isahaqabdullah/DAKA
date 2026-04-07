import { useEffect, useState, type FormEvent } from "react";
import { Users } from "lucide-react";
import {
  Btn, T, TableShell, TableHeader, Th, TableRow, Td, StatusChip,
  Drawer, FilterBar, FormField, EmptyState, InlineSelect, PageHeader, SectionLabel, Surface,
  inputStyle, loadCohorts, STORAGE_KEY,
  type Cohort,
} from "./AdminDashboard";

function emptyDraft() {
  return { name: "", year: String(new Date().getFullYear()), program: "", coach: "", cadence: "", capacity: "10", room: "" };
}

function slugify(v: string) { return v.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }

function createCohortId(name: string, cohorts: Cohort[]) {
  const base = slugify(name) || "new-cohort";
  if (!cohorts.some((c) => c.id === base)) return base;
  let n = 2;
  while (cohorts.some((c) => c.id === `${base}-${n}`)) n++;
  return `${base}-${n}`;
}

interface Props {
  onOpenCohort?: (id: string) => void;
}

export function AdminCohortsPage({ onOpenCohort }: Props) {
  const [cohorts, setCohorts] = useState<Cohort[]>(() => loadCohorts());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [statusFilter, setStatusFilter] = useState<"active" | "archived" | "all">("all");

  useEffect(() => { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cohorts)); }, [cohorts]);

  const visible = cohorts.filter((c) => {
    if (statusFilter === "active") return !c.archived;
    if (statusFilter === "archived") return c.archived;
    return true;
  });

  function openCreate() { setEditingId(null); setDraft(emptyDraft()); setDrawerOpen(true); }
  function openEdit(c: Cohort) {
    setEditingId(c.id);
    setDraft({ name: c.name, year: c.year, program: c.program, coach: c.coach, cadence: c.cadence, capacity: String(c.capacity), room: c.room });
    setDrawerOpen(true);
  }
  function closeDrawer() { setDrawerOpen(false); setEditingId(null); }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!draft.name.trim()) return;

    if (editingId) {
      setCohorts((all) => all.map((c) => c.id === editingId ? {
        ...c, name: draft.name.trim(), year: draft.year.trim() || String(new Date().getFullYear()), program: draft.program.trim(), coach: draft.coach.trim(),
        cadence: draft.cadence.trim(), capacity: Number(draft.capacity) || 10, room: draft.room.trim(),
      } : c));
    } else {
      const newId = createCohortId(draft.name, cohorts);
      setCohorts((all) => [...all, {
        id: newId, name: draft.name.trim(), year: draft.year.trim() || String(new Date().getFullYear()), program: draft.program.trim(), coach: draft.coach.trim(),
        cadence: draft.cadence.trim(), capacity: Number(draft.capacity) || 10, room: draft.room.trim(),
        students: [], syllabus: [], classes: [], reports: [], announcements: [],
      }]);
    }
    closeDrawer();
  }

  function toggleArchive(id: string) {
    setCohorts((all) => all.map((c) => c.id === id ? { ...c, archived: !c.archived } : c));
  }

  const cols = "minmax(140px,1fr) 72px 100px 100px 120px 80px 70px 70px";
  const activeCount = cohorts.filter((cohort) => !cohort.archived).length;
  const archivedCount = cohorts.filter((cohort) => cohort.archived).length;
  void onOpenCohort;

  return (
    <div style={{ display: "grid", gap: T.space4 }}>
      <PageHeader title="Cohorts">
        <StatusChip tone="success" label={`${activeCount} active`} />
        <StatusChip tone="neutral" label={`${archivedCount} archived`} />
        <StatusChip tone="neutral" label={`${cohorts.length} total cohorts`} />
        <Btn size="large" onClick={openCreate}>
          + New Cohort
        </Btn>
      </PageHeader>

      <FilterBar>
        <InlineSelect value={statusFilter} onChange={(value) => setStatusFilter(value as "active" | "archived" | "all")} style={{ minWidth: "180px" }}>
          <option value="all">All Cohorts</option>
          <option value="active">Active Cohorts</option>
          <option value="archived">Archived Cohorts</option>
        </InlineSelect>
      </FilterBar>

      <Surface style={{ padding: T.space5 }}>
        <div style={{ display: "grid", gap: T.space3 }}>
          <SectionLabel>Cohort Directory</SectionLabel>
          <TableShell>
            <TableHeader columns={cols}>
              <Th>Name</Th>
              <Th align="center">Year</Th>
              <Th>Program</Th>
              <Th>Coach</Th>
              <Th>Cadence</Th>
              <Th align="center">Students</Th>
              <Th align="center">Fill</Th>
              <Th>Status</Th>
            </TableHeader>
            {visible.length === 0 ? (
              <EmptyState icon={<Users size={24} />} title="No cohorts" action={<Btn onClick={openCreate}>+ New Cohort</Btn>} />
            ) : visible.map((c) => {
              const activeCount = c.students.filter((s) => (s.status ?? "active") === "active").length;
              const fillPct = c.capacity > 0 ? Math.round((activeCount / c.capacity) * 100) : 0;
              return (
                <TableRow key={c.id} columns={cols} onClick={() => openEdit(c)}>
                  <Td bold>{c.name}</Td>
                  <Td align="center" muted>{c.year}</Td>
                  <Td muted>{c.program || "–"}</Td>
                  <Td muted>{c.coach || "–"}</Td>
                  <Td muted>{c.cadence || "–"}</Td>
                  <Td align="center">{activeCount}/{c.capacity}</Td>
                  <Td align="center" muted>{fillPct}%</Td>
                  <Td><StatusChip tone={c.archived ? "neutral" : "success"} label={c.archived ? "Archived" : "Active"} /></Td>
                </TableRow>
              );
            })}
          </TableShell>
        </div>
      </Surface>

      <Drawer open={drawerOpen} title={editingId ? "Edit Cohort" : "New Cohort"} onClose={closeDrawer} footer={
        <>
          {editingId && (
            <Btn variant="danger" onClick={() => { toggleArchive(editingId); closeDrawer(); }}>
              {cohorts.find((c) => c.id === editingId)?.archived ? "Unarchive" : "Archive"}
            </Btn>
          )}
          <div style={{ flex: 1 }} />
          <Btn variant="secondary" onClick={closeDrawer}>Cancel</Btn>
          <Btn type="submit" onClick={() => (document.getElementById("cohort-form") as HTMLFormElement)?.requestSubmit()}>{editingId ? "Save" : "Create"}</Btn>
        </>
      }>
        <form id="cohort-form" onSubmit={handleSubmit} style={{ display: "grid", gap: "10px" }}>
          <FormField label="Cohort Name"><input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} style={inputStyle} required /></FormField>
          <FormField label="Cohort Year"><input value={draft.year} onChange={(e) => setDraft({ ...draft, year: e.target.value })} placeholder="e.g. 2026" style={inputStyle} /></FormField>
          <FormField label="Program"><input value={draft.program} onChange={(e) => setDraft({ ...draft, program: e.target.value })} placeholder="e.g. Beginner Course (Level One)" style={inputStyle} /></FormField>
          <FormField label="Coach"><input value={draft.coach} onChange={(e) => setDraft({ ...draft, coach: e.target.value })} style={inputStyle} /></FormField>
          <FormField label="Cadence"><input value={draft.cadence} onChange={(e) => setDraft({ ...draft, cadence: e.target.value })} placeholder="e.g. Thursday · 4:30 PM to 6:30 PM · Starts 2 Apr 2026" style={inputStyle} /></FormField>
          <FormField label="Capacity"><input type="number" min={1} value={draft.capacity} onChange={(e) => setDraft({ ...draft, capacity: e.target.value })} style={inputStyle} /></FormField>
          <FormField label="Room / Track"><input value={draft.room} onChange={(e) => setDraft({ ...draft, room: e.target.value })} style={inputStyle} /></FormField>
        </form>
      </Drawer>
    </div>
  );
}
