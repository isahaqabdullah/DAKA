import { useEffect, useState, type FormEvent } from "react";
import { Megaphone, Pencil, Pin, Trash2 } from "lucide-react";
import {
  Btn,
  Drawer,
  EmptyState,
  FilterBar,
  FormField,
  InlineSelect,
  PageHeader,
  SearchInput,
  SectionLabel,
  StatusChip,
  Surface,
  T,
  TableHeader,
  TableRow,
  TableShell,
  Td,
  Th,
  createId,
  inputStyle,
  loadCohorts,
  STORAGE_KEY,
  textareaStyle,
  type AnnouncementEntry,
  type Cohort,
} from "./AdminDashboard";

function formatShort(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(value));
}

function isExpired(expiresAt?: string) {
  return expiresAt ? new Date(expiresAt) < new Date() : false;
}

interface Props {
  initialCohortId?: string;
  onSelectCohort?: (id: string) => void;
}

export function AdminAnnouncementsPage({ initialCohortId, onSelectCohort }: Props) {
  const [cohorts, setCohorts] = useState<Cohort[]>(() => loadCohorts());
  const [cohortFilter, setCohortFilter] = useState(initialCohortId ?? "");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expired">("all");
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCohortId, setEditingCohortId] = useState<string>("");
  const [draft, setDraft] = useState({ title: "", message: "", targetCohortIds: [] as string[], expiresAt: "", pinned: false });

  const activeCohorts = cohorts.filter((c) => !c.archived);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cohorts));
  }, [cohorts]);

  useEffect(() => {
    if (initialCohortId) setCohortFilter(initialCohortId);
  }, [initialCohortId]);

  const allAnnouncements: (AnnouncementEntry & { cohortId: string; cohortName: string })[] = [];
  for (const cohort of activeCohorts) {
    for (const announcement of cohort.announcements) {
      allAnnouncements.push({ ...announcement, cohortId: cohort.id, cohortName: cohort.name });
    }
  }
  allAnnouncements.sort((left, right) => {
    if ((left.pinned ?? false) !== (right.pinned ?? false)) return left.pinned ? -1 : 1;
    return right.createdAt.localeCompare(left.createdAt);
  });

  const visibleAnnouncements = allAnnouncements.filter((announcement) => {
    if (cohortFilter && announcement.cohortId !== cohortFilter) return false;
    const expired = isExpired(announcement.expiresAt);
    if (statusFilter === "active" && expired) return false;
    if (statusFilter === "expired" && !expired) return false;
    const query = search.trim().toLowerCase();
    if (query && !announcement.title.toLowerCase().includes(query) && !announcement.message.toLowerCase().includes(query)) return false;
    return true;
  });

  function openCreate() {
    setEditingId(null);
    setEditingCohortId("");
    setDraft({
      title: "",
      message: "",
      targetCohortIds: cohortFilter ? [cohortFilter] : activeCohorts.map((cohort) => cohort.id),
      expiresAt: "",
      pinned: false,
    });
    setDrawerOpen(true);
  }

  function openEdit(announcement: (typeof allAnnouncements)[number]) {
    setEditingId(announcement.id);
    setEditingCohortId(announcement.cohortId);
    setDraft({
      title: announcement.title,
      message: announcement.message,
      targetCohortIds: [announcement.cohortId],
      expiresAt: announcement.expiresAt ?? "",
      pinned: announcement.pinned ?? false,
    });
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setEditingId(null);
    setEditingCohortId("");
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!draft.title.trim() || !draft.message.trim() || draft.targetCohortIds.length === 0) return;
    const createdAt = new Date().toISOString();

    if (editingId && editingCohortId) {
      setCohorts((current) => current.map((cohort) => (
        cohort.id === editingCohortId
          ? {
              ...cohort,
              announcements: cohort.announcements.map((announcement) => (
                announcement.id === editingId
                  ? {
                      ...announcement,
                      title: draft.title.trim(),
                      message: draft.message.trim(),
                      expiresAt: draft.expiresAt.trim() || undefined,
                      pinned: draft.pinned,
                    }
                  : announcement
              )),
            }
          : cohort
      )));
    } else {
      setCohorts((current) => current.map((cohort) => {
        if (!draft.targetCohortIds.includes(cohort.id)) return cohort;
        return {
          ...cohort,
          announcements: [
            {
              id: createId("announcement"),
              title: draft.title.trim(),
              message: draft.message.trim(),
              createdAt,
              expiresAt: draft.expiresAt.trim() || undefined,
              pinned: draft.pinned,
            },
            ...cohort.announcements,
          ],
        };
      }));
    }

    closeDrawer();
  }

  function handleDelete(announcement: (typeof allAnnouncements)[number]) {
    if (!window.confirm("Delete this announcement?")) return;
    setCohorts((current) => current.map((cohort) => (
      cohort.id === announcement.cohortId
        ? { ...cohort, announcements: cohort.announcements.filter((item) => item.id !== announcement.id) }
        : cohort
    )));
  }

  function handlePin(announcement: (typeof allAnnouncements)[number]) {
    setCohorts((current) => current.map((cohort) => (
      cohort.id === announcement.cohortId
        ? {
            ...cohort,
            announcements: cohort.announcements.map((item) => (
              item.id === announcement.id ? { ...item, pinned: !item.pinned } : item
            )),
          }
        : cohort
    )));
  }

  function selectCohort(id: string) {
    setCohortFilter(id);
    onSelectCohort?.(id);
  }

  const cols = "minmax(260px,1.6fr) 150px 150px 100px 108px 148px";

  return (
    <div style={{ display: "grid", gap: T.space4 }}>
      <PageHeader title="Announcements">
        <Btn onClick={openCreate}>New Announcement</Btn>
      </PageHeader>

      <FilterBar>
        <InlineSelect value={cohortFilter} onChange={selectCohort} style={{ minWidth: "200px" }}>
          <option value="">All Cohorts</option>
          {activeCohorts.map((cohort) => (
            <option key={cohort.id} value={cohort.id}>
              {cohort.name}
            </option>
          ))}
        </InlineSelect>
        <InlineSelect value={statusFilter} onChange={(value) => setStatusFilter(value as "all" | "active" | "expired")} style={{ minWidth: "160px" }}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
        </InlineSelect>
        <SearchInput value={search} onChange={setSearch} placeholder="Search announcements" />
      </FilterBar>

      <Surface style={{ padding: T.space5 }}>
        <div style={{ display: "grid", gap: T.space3 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: T.space3, flexWrap: "wrap", alignItems: "center" }}>
            <SectionLabel>Announcement Queue</SectionLabel>
            <span style={{ color: T.subtle, fontSize: T.textSm, fontWeight: 600 }}>
              {visibleAnnouncements.length} item{visibleAnnouncements.length === 1 ? "" : "s"}
            </span>
          </div>

          {visibleAnnouncements.length === 0 ? (
            <EmptyState
              icon={<Megaphone size={22} />}
              title="No announcements"
              action={<Btn onClick={openCreate}>Create Announcement</Btn>}
            />
          ) : (
            <TableShell>
              <TableHeader columns={cols}>
                <Th>Announcement</Th>
                <Th>Cohort</Th>
                <Th>Status</Th>
                <Th>Created</Th>
                <Th>Expires</Th>
                <Th align="right">Actions</Th>
              </TableHeader>
              {visibleAnnouncements.map((announcement) => {
                const expired = isExpired(announcement.expiresAt);
                return (
                  <TableRow key={`${announcement.cohortId}-${announcement.id}`} columns={cols} onClick={() => openEdit(announcement)}>
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
                    <Td>
                      <StatusChip tone={expired ? "neutral" : "success"} label={expired ? "Expired" : "Active"} />
                    </Td>
                    <Td muted>{formatShort(announcement.createdAt)}</Td>
                    <Td muted>{announcement.expiresAt ? formatShort(announcement.expiresAt) : "No expiry"}</Td>
                    <Td align="right">
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: T.space2 }}>
                        <button
                          type="button"
                          onClick={(event) => { event.stopPropagation(); handlePin(announcement); }}
                          aria-label={announcement.pinned ? "Unpin announcement" : "Pin announcement"}
                          style={{ width: "28px", height: "28px", borderRadius: T.radiusSm, border: `1px solid ${T.border}`, backgroundColor: announcement.pinned ? T.accentBg : T.surface, color: announcement.pinned ? T.accent : T.muted, display: "grid", placeItems: "center", cursor: "pointer" }}
                        >
                          <Pin size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={(event) => { event.stopPropagation(); openEdit(announcement); }}
                          aria-label="Edit announcement"
                          style={{ width: "28px", height: "28px", borderRadius: T.radiusSm, border: `1px solid ${T.border}`, backgroundColor: T.surface, color: T.muted, display: "grid", placeItems: "center", cursor: "pointer" }}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={(event) => { event.stopPropagation(); handleDelete(announcement); }}
                          aria-label="Delete announcement"
                          style={{ width: "28px", height: "28px", borderRadius: T.radiusSm, border: `1px solid ${T.dangerBorder}`, backgroundColor: T.dangerBg, color: T.danger, display: "grid", placeItems: "center", cursor: "pointer" }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </Td>
                  </TableRow>
                );
              })}
            </TableShell>
          )}
        </div>
      </Surface>

      <Drawer
        open={drawerOpen}
        title={editingId ? "Edit Announcement" : "New Announcement"}
        onClose={closeDrawer}
        footer={(
          <>
            {editingId ? (
              <Btn
                variant="danger"
                onClick={() => {
                  const announcement = allAnnouncements.find((item) => item.id === editingId);
                  if (announcement) handleDelete(announcement);
                  closeDrawer();
                }}
              >
                Delete
              </Btn>
            ) : null}
            <div style={{ flex: 1 }} />
            <Btn variant="secondary" onClick={closeDrawer}>Cancel</Btn>
            <Btn type="submit" onClick={() => (document.getElementById("announce-form") as HTMLFormElement | null)?.requestSubmit()}>
              {editingId ? "Save Changes" : "Send Announcement"}
            </Btn>
          </>
        )}
      >
        <form id="announce-form" onSubmit={handleSubmit} style={{ display: "grid", gap: T.space3 }}>
          <FormField label="Title">
            <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} style={inputStyle} required />
          </FormField>

          <FormField label="Message">
            <textarea value={draft.message} onChange={(event) => setDraft({ ...draft, message: event.target.value })} style={textareaStyle} required />
          </FormField>

          {!editingId ? (
            <div>
              <label style={{ display: "block", color: T.subtle, fontSize: T.textXs, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: T.space2 }}>
                Target Cohorts
              </label>
              <div style={{ display: "grid", gap: T.space2 }}>
                {activeCohorts.map((cohort) => (
                  <label key={cohort.id} style={{ display: "flex", alignItems: "center", gap: T.space2, fontSize: T.textBase, color: T.text, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={draft.targetCohortIds.includes(cohort.id)}
                      onChange={() => setDraft((current) => ({
                        ...current,
                        targetCohortIds: current.targetCohortIds.includes(cohort.id)
                          ? current.targetCohortIds.filter((item) => item !== cohort.id)
                          : [...current.targetCohortIds, cohort.id],
                      }))}
                    />
                    {cohort.name}
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          <FormField label="Expires At">
            <input type="date" value={draft.expiresAt} onChange={(event) => setDraft({ ...draft, expiresAt: event.target.value })} style={inputStyle} />
          </FormField>

          <label style={{ display: "flex", alignItems: "center", gap: T.space2, fontSize: T.textBase, color: T.text, cursor: "pointer" }}>
            <input type="checkbox" checked={draft.pinned} onChange={(event) => setDraft({ ...draft, pinned: event.target.checked })} />
            Pin this announcement
          </label>
        </form>
      </Drawer>
    </div>
  );
}
