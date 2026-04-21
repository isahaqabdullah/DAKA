import { useEffect, useMemo, useState, type FormEvent } from "react";
import { CalendarDays, Check, Globe2, Megaphone, Pencil, Pin, SendHorizontal, Trash2 } from "lucide-react";
import type { AnnouncementEntry, Cohort } from "../types";
import { T } from "../theme";
import { createId } from "../utils";
import { loadCohorts, STORAGE_KEY } from "../storage";
import { Btn, EmptyState, InlineSelect, PageHeader, SectionLabel, StatusChip, Surface, inputStyle } from "./shared";

type AnnouncementDraft = {
  message: string;
  audienceMode: "all" | "selected";
  targetCohortIds: string[];
  expiresAt: string;
  pinned: boolean;
};

type AnnouncementTargetRef = {
  cohortId: string;
  announcementId: string;
};

type AnnouncementFeedItem = {
  key: string;
  title: string;
  message: string;
  createdAt: string;
  expiresAt?: string;
  pinned?: boolean;
  audienceMode: "all" | "selected";
  targetCohortIds: string[];
  targetCohortNames: string[];
  refs: AnnouncementTargetRef[];
};

function formatShort(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(value));
}

function isExpired(expiresAt?: string) {
  return expiresAt ? new Date(expiresAt) < new Date() : false;
}

function buildDraft(targetCohortIds: string[] = []): AnnouncementDraft {
  return {
    message: "",
    audienceMode: targetCohortIds.length > 0 ? "selected" : "all",
    targetCohortIds,
    expiresAt: "",
    pinned: false,
  };
}

function resolveTitle(message: string) {
  const excerpt = message.trim().replace(/\s+/g, " ").slice(0, 56).trim();
  return excerpt.length > 0 ? excerpt : "Announcement";
}

function actionButtonStyle(active?: boolean) {
  return {
    width: "26px",
    height: "26px",
    borderRadius: T.radiusSm,
    border: `1px solid ${active ? T.accentBorder : T.border}`,
    backgroundColor: active ? T.accentBg : T.surface,
    color: active ? T.accentDeep : T.muted,
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    flexShrink: 0,
  } as const;
}

function audienceModeButtonStyle(active: boolean) {
  return {
    minHeight: T.controlSm,
    padding: `0 ${T.space3}`,
    borderRadius: "999px",
    border: `1px solid ${active ? T.accentDeep : "transparent"}`,
    backgroundColor: active ? T.accentDeep : "transparent",
    color: active ? T.surface : T.muted,
    fontSize: T.textSm,
    fontWeight: active ? 700 : 600,
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    cursor: "pointer",
    boxShadow: active ? `0 0 0 1px ${T.accentBorder}, ${T.shadowMd}` : "none",
    transition: "background-color 140ms ease, color 140ms ease, box-shadow 140ms ease",
  } as const;
}

function cohortToggleStyle(active: boolean) {
  return {
    minHeight: T.controlSm,
    padding: `0 ${T.space3}`,
    borderRadius: "999px",
    border: `1px solid ${active ? T.accentBorder : T.border}`,
    backgroundColor: active ? T.accentBg : T.surface,
    color: active ? T.accentDeep : T.text,
    fontSize: T.textSm,
    fontWeight: active ? 700 : 600,
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    cursor: "pointer",
  } as const;
}

function summarizeAudience(names: string[]) {
  if (names.length === 0) return "no cohorts";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names[0]} +${names.length - 1}`;
}

function announcementAudienceLabel(announcement: AnnouncementFeedItem) {
  if (announcement.audienceMode === "all") return "All cohorts";
  if (announcement.targetCohortNames.length === 1) return announcement.targetCohortNames[0] ?? "1 cohort";
  return `${announcement.targetCohortNames.length} cohorts`;
}

function AnnouncementRow({
  announcement,
  onEdit,
  onDelete,
  onPin,
}: {
  announcement: AnnouncementFeedItem;
  onEdit: () => void;
  onDelete: () => void;
  onPin: () => void;
}) {
  const expired = isExpired(announcement.expiresAt);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) auto",
        gap: T.space2,
        alignItems: "center",
        padding: "6px 0",
        borderBottom: `1px solid ${T.borderSoft}`,
      }}
    >
      <div style={{ minWidth: 0, display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        <span
          style={{
            minWidth: 0,
            flex: "1 1 280px",
            color: T.heading,
            fontSize: T.textSm,
            fontWeight: 600,
            lineHeight: 1.25,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          title={announcement.message}
        >
          {announcement.message}
        </span>
        <span
          style={{
            color: expired ? T.subtle : T.success,
            fontSize: T.textXs,
            fontWeight: 700,
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          {expired ? "Expired" : "Live"}
        </span>
        {announcement.audienceMode === "all" || announcement.targetCohortIds.length > 1 ? (
          <span style={{ color: T.subtle, fontSize: T.textXs, fontWeight: 700, whiteSpace: "nowrap" }}>
            {announcementAudienceLabel(announcement)}
          </span>
        ) : null}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: T.space1, flexShrink: 0 }}>
        <span style={{ color: T.subtle, fontSize: T.textXs, fontWeight: 700, whiteSpace: "nowrap", marginRight: "2px" }}>
          {formatShort(announcement.createdAt)}
        </span>
        <button type="button" onClick={onPin} aria-label={announcement.pinned ? "Unpin post" : "Pin post"} style={actionButtonStyle(announcement.pinned)}>
          <Pin size={13} />
        </button>
        <button type="button" onClick={onEdit} aria-label="Edit post" style={actionButtonStyle()}>
          <Pencil size={13} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete post"
          style={{
            ...actionButtonStyle(),
            border: `1px solid ${T.dangerBorder}`,
            backgroundColor: T.dangerBg,
            color: T.danger,
          }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

interface Props {
  initialCohortId?: string;
  onSelectCohort?: (id: string) => void;
}

export function AdminAnnouncementsPage({ initialCohortId }: Props) {
  const [cohorts, setCohorts] = useState<Cohort[]>(() => loadCohorts());
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [filterCohortId, setFilterCohortId] = useState("all");
  const [draft, setDraft] = useState<AnnouncementDraft>(() => buildDraft(initialCohortId ? [initialCohortId] : []));

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cohorts));
  }, [cohorts]);

  const activeCohorts = useMemo(() => cohorts.filter((cohort) => !cohort.archived), [cohorts]);
  const activeCohortIds = useMemo(() => activeCohorts.map((cohort) => cohort.id), [activeCohorts]);
  const scopedCohortIds = initialCohortId ? [initialCohortId] : [];
  const filterableCohorts = activeCohorts;

  const announcementFeed = useMemo<AnnouncementFeedItem[]>(() => {
    const cohortNameById = new Map(activeCohorts.map((cohort) => [cohort.id, cohort.name]));
    const grouped = new Map<string, AnnouncementFeedItem>();

    for (const cohort of activeCohorts) {
      for (const announcement of cohort.announcements) {
        const key = announcement.broadcastId ?? `${cohort.id}:${announcement.id}`;
        const storedTargetIds = Array.isArray(announcement.targetCohortIds) && announcement.targetCohortIds.length > 0
          ? announcement.targetCohortIds
          : [cohort.id];
        const audienceMode = announcement.audienceMode ?? "selected";
        const targetCohortIds = [...storedTargetIds];
        const targetCohortNames = targetCohortIds
          .map((id) => cohortNameById.get(id))
          .filter((value): value is string => Boolean(value));

        const existing = grouped.get(key);
        if (existing) {
          existing.refs.push({ cohortId: cohort.id, announcementId: announcement.id });
          continue;
        }

        grouped.set(key, {
          key,
          title: announcement.title,
          message: announcement.message,
          createdAt: announcement.createdAt,
          expiresAt: announcement.expiresAt,
          pinned: announcement.pinned,
          audienceMode,
          targetCohortIds,
          targetCohortNames,
          refs: [{ cohortId: cohort.id, announcementId: announcement.id }],
        });
      }
    }

    return [...grouped.values()].sort((left, right) => {
      if ((left.pinned ?? false) !== (right.pinned ?? false)) return left.pinned ? -1 : 1;
      return right.createdAt.localeCompare(left.createdAt);
    });
  }, [activeCohorts]);

  const editingAnnouncement = useMemo(
    () => (editingKey ? announcementFeed.find((announcement) => announcement.key === editingKey) ?? null : null),
    [announcementFeed, editingKey],
  );

  const filteredAnnouncements = useMemo(
    () => (filterCohortId === "all"
      ? announcementFeed
      : announcementFeed.filter((announcement) => announcement.targetCohortIds.includes(filterCohortId))),
    [announcementFeed, filterCohortId],
  );
  const groupedAnnouncements = useMemo(
    () => (filterCohortId === "all" ? filterableCohorts : filterableCohorts.filter((cohort) => cohort.id === filterCohortId))
      .map((cohort) => ({
        cohortId: cohort.id,
        cohortName: cohort.name,
        items: filteredAnnouncements.filter((announcement) => announcement.targetCohortIds.includes(cohort.id)),
      }))
      .filter((group) => group.items.length > 0),
    [filterCohortId, filterableCohorts, filteredAnnouncements],
  );

  const liveCount = announcementFeed.filter((announcement) => !isExpired(announcement.expiresAt)).length;
  const historyCount = announcementFeed.filter((announcement) => isExpired(announcement.expiresAt)).length;
  const selectedAudienceNames = activeCohorts
    .filter((cohort) => draft.targetCohortIds.includes(cohort.id))
    .map((cohort) => cohort.name);
  const selectedAudienceCount = draft.audienceMode === "all" ? activeCohortIds.length : draft.targetCohortIds.length;
  const postReady = Boolean(draft.message.trim()) && selectedAudienceCount > 0;
  const audienceSummary = activeCohortIds.length === 0
    ? "No active cohorts available."
    : draft.audienceMode === "all"
      ? `This post will go to all ${activeCohortIds.length} active cohorts.`
      : selectedAudienceCount > 0
        ? `Sending to ${summarizeAudience(selectedAudienceNames)}.`
        : "Choose one or more cohorts for this post.";

  function resetComposer(targetIds = scopedCohortIds) {
    setEditingKey(null);
    setDraft(buildDraft(targetIds));
  }

  function openEdit(announcement: AnnouncementFeedItem) {
    setEditingKey(announcement.key);
    setDraft({
      message: announcement.message,
      audienceMode: announcement.audienceMode,
      targetCohortIds: announcement.targetCohortIds,
      expiresAt: announcement.expiresAt ?? "",
      pinned: announcement.pinned ?? false,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleDraftCohort(cohortId: string) {
    setDraft((current) => {
      const exists = current.targetCohortIds.includes(cohortId);
      return {
        ...current,
        audienceMode: "selected",
        targetCohortIds: exists
          ? current.targetCohortIds.filter((id) => id !== cohortId)
          : [...current.targetCohortIds, cohortId],
      };
    });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const message = draft.message.trim();
    const targetCohortIds = draft.audienceMode === "all" ? activeCohortIds : draft.targetCohortIds;
    if (!message || targetCohortIds.length === 0) return;

    const nextTitle = resolveTitle(message);
    const expiresAt = draft.expiresAt.trim() || undefined;
    const previousRefs = editingAnnouncement?.refs ?? [];
    const broadcastId = editingAnnouncement
      ? editingAnnouncement.key.includes(":") ? createId("announcement-broadcast") : editingAnnouncement.key
      : createId("announcement-broadcast");
    const createdAt = editingAnnouncement?.createdAt ?? new Date().toISOString();

    setCohorts((current) => current.map((cohort) => {
      const refsForCohort = previousRefs.filter((ref) => ref.cohortId === cohort.id).map((ref) => ref.announcementId);
      const refsToRemove = new Set(refsForCohort);
      const withoutPrevious = refsToRemove.size > 0
        ? cohort.announcements.filter((announcement) => !refsToRemove.has(announcement.id))
        : cohort.announcements;

      if (!targetCohortIds.includes(cohort.id)) {
        return refsToRemove.size > 0 ? { ...cohort, announcements: withoutPrevious } : cohort;
      }

      const nextAnnouncement: AnnouncementEntry = {
        id: createId("announcement"),
        broadcastId,
        title: nextTitle,
        message,
        createdAt,
        expiresAt,
        pinned: draft.pinned,
        audienceMode: draft.audienceMode,
        targetCohortIds,
      };

      return {
        ...cohort,
        announcements: [nextAnnouncement, ...withoutPrevious],
      };
    }));

    resetComposer(targetCohortIds.length === 1 ? targetCohortIds : scopedCohortIds);
  }

  function handleDelete(announcement: AnnouncementFeedItem) {
    if (!window.confirm("Delete this announcement?")) return;

    setCohorts((current) => current.map((cohort) => {
      const idsToRemove = new Set(
        announcement.refs.filter((ref) => ref.cohortId === cohort.id).map((ref) => ref.announcementId),
      );
      if (idsToRemove.size === 0) return cohort;
      return {
        ...cohort,
        announcements: cohort.announcements.filter((item) => !idsToRemove.has(item.id)),
      };
    }));

    if (editingKey === announcement.key) resetComposer();
  }

  function handlePin(announcement: AnnouncementFeedItem) {
    setCohorts((current) => current.map((cohort) => {
      const idsToToggle = new Set(
        announcement.refs.filter((ref) => ref.cohortId === cohort.id).map((ref) => ref.announcementId),
      );
      if (idsToToggle.size === 0) return cohort;
      return {
        ...cohort,
        announcements: cohort.announcements.map((item) => (
          idsToToggle.has(item.id) ? { ...item, pinned: !(announcement.pinned ?? false) } : item
        )),
      };
    }));
  }

  return (
    <div style={{ display: "grid", gap: T.space4 }}>
      <PageHeader title="Announcements">
        <StatusChip tone="success" label={`${liveCount} live`} />
        <StatusChip tone="neutral" label={`${historyCount} history`} />
        {editingAnnouncement ? <Btn onClick={() => resetComposer()}>New Post</Btn> : null}
      </PageHeader>

      <Surface style={{ padding: T.space3 }}>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: T.space2 }}>
          <textarea
            value={draft.message}
            onChange={(event) => setDraft({ ...draft, message: event.target.value })}
            placeholder="Write an announcement..."
            style={{
              border: "none",
              outline: "none",
              resize: "vertical",
              minHeight: "64px",
              padding: 0,
              background: "transparent",
              color: T.heading,
              fontSize: T.textLg,
              lineHeight: 1.45,
              fontFamily: "var(--font-body)",
              width: "100%",
            }}
            required
          />

          <div style={{ display: "grid", gap: T.space2, paddingTop: T.space2, borderTop: `1px solid ${T.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: T.space2, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: T.space2, flexWrap: "wrap" }}>
                <span
                  style={{
                    color: T.subtle,
                    fontSize: T.textSm,
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Globe2 size={14} />
                  Send to
                </span>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "2px",
                    padding: "2px",
                    borderRadius: "999px",
                    border: `1px solid ${T.border}`,
                    backgroundColor: T.surfaceTint,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setDraft((current) => ({ ...current, audienceMode: "all" }))}
                    style={audienceModeButtonStyle(draft.audienceMode === "all")}
                  >
                    All cohorts
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraft((current) => ({
                      ...current,
                      audienceMode: "selected",
                      targetCohortIds: current.targetCohortIds.length > 0
                        ? current.targetCohortIds
                        : scopedCohortIds,
                    }))}
                    style={audienceModeButtonStyle(draft.audienceMode === "selected")}
                  >
                    Specific cohorts
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: T.space2, flexWrap: "wrap" }}>
                <div
                  style={{
                    minHeight: T.controlSm,
                    borderRadius: "999px",
                    border: `1px solid ${T.border}`,
                    backgroundColor: T.surfaceSoft,
                    color: T.text,
                    fontSize: T.textSm,
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    paddingLeft: T.space3,
                    overflow: "hidden",
                  }}
                >
                  <CalendarDays size={14} />
                  <span>{draft.expiresAt ? "Expires" : "No expiry"}</span>
                  <input
                    type="date"
                    value={draft.expiresAt}
                    onChange={(event) => setDraft({ ...draft, expiresAt: event.target.value })}
                    style={{
                      ...inputStyle,
                      height: T.controlSm,
                      border: "none",
                      borderLeft: `1px solid ${T.border}`,
                      borderRadius: 0,
                      backgroundColor: "transparent",
                      width: draft.expiresAt ? "134px" : "118px",
                      fontSize: T.textSm,
                      padding: `0 ${T.space2}`,
                    }}
                  />
                </div>

                <label
                  style={{
                    minHeight: T.controlSm,
                    padding: `0 ${T.space3}`,
                    borderRadius: "999px",
                    border: `1px solid ${draft.pinned ? T.accentBorder : T.border}`,
                    backgroundColor: draft.pinned ? T.accentBg : T.surfaceSoft,
                    color: draft.pinned ? T.accentDeep : T.text,
                    fontSize: T.textSm,
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    cursor: "pointer",
                  }}
                >
                  <Pin size={14} />
                  <span>Pin</span>
                  <input
                    type="checkbox"
                    checked={draft.pinned}
                    onChange={(event) => setDraft({ ...draft, pinned: event.target.checked })}
                    style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
                  />
                </label>

                <span style={{ color: T.subtle, fontSize: T.textSm }}>
                  {draft.message.trim().length}
                </span>
                {editingAnnouncement ? <Btn variant="secondary" onClick={() => resetComposer()}>Cancel</Btn> : null}
                <Btn type="submit" disabled={!postReady}>
                  <SendHorizontal size={14} />
                  {editingAnnouncement ? "Save" : "Post"}
                </Btn>
              </div>
            </div>

            <div style={{ color: T.subtle, fontSize: T.textSm }}>{audienceSummary}</div>

            {draft.audienceMode === "selected" ? (
              <div style={{ display: "flex", gap: T.space1, flexWrap: "wrap" }}>
                {activeCohorts.map((cohort) => {
                  const active = draft.targetCohortIds.includes(cohort.id);
                  return (
                    <button
                      key={cohort.id}
                      type="button"
                      onClick={() => toggleDraftCohort(cohort.id)}
                      style={cohortToggleStyle(active)}
                    >
                      <span>{cohort.name}</span>
                      {active ? <Check size={12} strokeWidth={3} /> : null}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </form>
      </Surface>

      <Surface style={{ padding: T.space4 }}>
        <div style={{ display: "grid", gap: T.space4 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: T.space3, flexWrap: "wrap", alignItems: "center" }}>
            <SectionLabel>Announcement Feed</SectionLabel>
            <div style={{ display: "flex", alignItems: "center", gap: T.space2, flexWrap: "wrap" }}>
              <span style={{ color: T.subtle, fontSize: T.textSm, fontWeight: 600 }}>
                {filteredAnnouncements.length} post{filteredAnnouncements.length === 1 ? "" : "s"}
              </span>
              <InlineSelect value={filterCohortId} onChange={setFilterCohortId} style={{ minWidth: "210px" }}>
                <option value="all">All cohorts</option>
                {filterableCohorts.map((cohort) => (
                  <option key={cohort.id} value={cohort.id}>
                    {cohort.name}
                  </option>
                ))}
              </InlineSelect>
            </div>
          </div>

          {filteredAnnouncements.length === 0 ? (
            <EmptyState
              icon={<Megaphone size={22} />}
              title="No announcements yet"
            />
          ) : (
            <div style={{ display: "grid", gap: T.space3 }}>
              {groupedAnnouncements.map((group) => (
                <div key={group.cohortId} style={{ display: "grid", gap: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: T.space2, alignItems: "baseline", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: T.space2, flexWrap: "wrap" }}>
                      <SectionLabel>{group.cohortName}</SectionLabel>
                      <span style={{ color: T.subtle, fontSize: T.textXs, fontWeight: 700 }}>
                        {group.items.length} post{group.items.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    <span style={{ color: T.subtle, fontSize: T.textXs }}>
                      Latest {formatShort(group.items[0].createdAt)}
                    </span>
                  </div>

                  <div style={{ display: "grid" }}>
                    {group.items.map((announcement) => (
                      <AnnouncementRow
                        key={`${group.cohortId}-${announcement.key}`}
                        announcement={announcement}
                        onEdit={() => openEdit(announcement)}
                        onDelete={() => handleDelete(announcement)}
                        onPin={() => handlePin(announcement)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Surface>
    </div>
  );
}
