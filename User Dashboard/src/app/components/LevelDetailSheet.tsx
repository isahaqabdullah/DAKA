import { useState } from "react";
import { X, CalendarDays, Users, Flag, AlertTriangle, Trophy, Lock, CheckCircle2 } from "lucide-react";
import { CurriculumAccordion } from "./CurriculumAccordion";
import { SessionTimeline, Session } from "./SessionTimeline";

export interface AgeGroup {
  label: string;
  time: string;
  ages: string;
}

export interface CurriculumSection {
  title: string;
  items: string[];
}

export interface Cohort {
  label: string;
  sessions: Session[];
}

export interface LevelData {
  levelNumber: number;
  levelTitle: string;
  subtitle: string;
  price: string;
  priceLabel: string;
  schedule?: string;
  groupPrice?: string;
  prerequisite?: string;
  note?: string;
  ageGroups?: AgeGroup[];
  status: "completed" | "active" | "locked";
  totalSessions: number;
  completedSessions: number;
  curriculum?: CurriculumSection[];
  sessions?: Session[];
  cohorts?: Cohort[];
}

interface LevelDetailSheetProps {
  level: LevelData;
  onClose: () => void;
}

const STATUS_CFG = {
  completed: { color: "#22C55E", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.25)", label: "Completed", icon: <CheckCircle2 size={11} color="#22C55E" /> },
  active:    { color: "#C8342E", bg: "rgba(200,52,46,0.1)",  border: "rgba(200,52,46,0.3)",  label: "Active",    icon: null },
  locked:    { color: "#5A5A5A", bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)", label: "Locked", icon: <Lock size={11} color="#5A5A5A" /> },
};

export function LevelDetailSheet({ level, onClose }: LevelDetailSheetProps) {
  const [activeCohort, setActiveCohort] = useState(0);
  const cfg = STATUS_CFG[level.status];
  const activeSessions = level.cohorts ? level.cohorts[activeCohort]?.sessions : level.sessions;

  return (
    <>
      <style>{`
        @keyframes sheetSlideUp {
          from { transform: translateX(-50%) translateY(100%); }
          to   { transform: translateX(-50%) translateY(0); }
        }
        @keyframes backdropIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .sheet-backdrop {
          animation: backdropIn 0.2s ease-out forwards;
        }
        .sheet-panel {
          animation: sheetSlideUp 0.32s cubic-bezier(0.32, 0.72, 0, 1) forwards;
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="sheet-backdrop"
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.72)",
          zIndex: 200,
          backdropFilter: "blur(3px)",
        }}
      />

      {/* Sheet panel */}
      <div
        className="sheet-panel"
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: "375px",
          maxHeight: "82vh",
          backgroundColor: "#141414",
          borderRadius: "22px 22px 0 0",
          zIndex: 201,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderTop: `2px solid ${level.status === "active" ? "#C8342E" : level.status === "completed" ? "#22C55E" : "rgba(255,255,255,0.08)"}`,
        }}
      >
        {/* Drag handle */}
        <div style={{ padding: "14px 16px 0", display: "flex", justifyContent: "center" }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.12)" }} />
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {/* Header */}
          <div style={{ padding: "14px 16px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: "#5A5A5A", fontSize: "9px", fontFamily: "Barlow, sans-serif", fontWeight: 700, letterSpacing: "2.5px", textTransform: "uppercase", margin: "0 0 2px 0" }}>
                Level {level.levelNumber}
              </p>
              <p style={{ color: "#FFFFFF", fontSize: "22px", fontFamily: "var(--font-heading)", fontStyle: "italic", fontWeight: 900, letterSpacing: "0.5px", margin: "0 0 3px 0", lineHeight: 1.1 }}>
                {level.levelTitle.toUpperCase()}
              </p>
              <p style={{ color: "#4A4A4A", fontSize: "11px", fontFamily: "Barlow, sans-serif", margin: "0 0 8px 0", lineHeight: 1.4 }}>
                {level.subtitle}
              </p>
              {/* Status + price row */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: "6px", padding: "3px 9px", display: "flex", alignItems: "center", gap: "4px" }}>
                  {cfg.icon}
                  <span style={{ color: cfg.color, fontSize: "10px", fontFamily: "Barlow, sans-serif", fontWeight: 700 }}>{cfg.label}</span>
                </div>
                <span style={{ color: "#CCCCCC", fontSize: "15px", fontFamily: "Barlow Condensed, sans-serif", fontWeight: 800 }}>{level.price}</span>
                <span style={{ color: "#4A4A4A", fontSize: "10px", fontFamily: "Barlow, sans-serif" }}>{level.priceLabel}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, marginLeft: 12 }}
            >
              <X size={15} color="#8D8D8D" />
            </button>
          </div>

          {/* Locked notice */}
          {level.status === "locked" && (
            <div style={{ margin: "12px 16px 0", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "12px", display: "flex", gap: "10px", alignItems: "center" }}>
              <Lock size={16} color="#5A5A5A" style={{ flexShrink: 0 }} />
              <p style={{ color: "#5A5A5A", fontSize: "12px", fontFamily: "Barlow, sans-serif", margin: 0, lineHeight: 1.5 }}>
                Complete Level {level.levelNumber - 1} to unlock this course.
              </p>
            </div>
          )}

          {/* Info strip */}
          <div style={{ margin: "12px 16px 0", display: "flex", flexDirection: "column", gap: "8px" }}>
            {level.schedule && (
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                <CalendarDays size={12} color="#C8342E" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ color: "#8D8D8D", fontSize: "11px", fontFamily: "Barlow, sans-serif", margin: 0, lineHeight: 1.5 }}>{level.schedule}</p>
              </div>
            )}
            {level.groupPrice && (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <Users size={12} color="#C8342E" style={{ flexShrink: 0 }} />
                <p style={{ color: "#8D8D8D", fontSize: "11px", fontFamily: "Barlow, sans-serif", margin: 0 }}>{level.groupPrice}</p>
              </div>
            )}
            {level.prerequisite && (
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                <Flag size={12} color="#5A5A5A" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ color: "#5A5A5A", fontSize: "11px", fontFamily: "Barlow, sans-serif", margin: 0, lineHeight: 1.5 }}>{level.prerequisite}</p>
              </div>
            )}

            {/* Age groups */}
            {level.ageGroups && level.ageGroups.length > 0 && (
              <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                {level.ageGroups.map((ag) => (
                  <div key={ag.label} style={{ flex: 1, backgroundColor: "rgba(200,52,46,0.07)", border: "1px solid rgba(200,52,46,0.18)", borderRadius: "9px", padding: "9px 11px" }}>
                    <p style={{ color: "#C8342E", fontSize: "9px", fontFamily: "Barlow, sans-serif", fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase", margin: "0 0 2px 0" }}>{ag.label}</p>
                    <p style={{ color: "#FFFFFF", fontSize: "12px", fontFamily: "Barlow Condensed, sans-serif", fontWeight: 700, margin: "0 0 1px 0" }}>{ag.time}</p>
                    <p style={{ color: "#5A5A5A", fontSize: "10px", fontFamily: "Barlow, sans-serif", margin: 0 }}>{ag.ages}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{ margin: "14px 16px", height: 1, backgroundColor: "rgba(255,255,255,0.05)" }} />

          {/* Session count badge */}
          <div style={{ padding: "0 16px 10px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "7px", padding: "5px 12px" }}>
              <span style={{ color: "#C8342E", fontSize: "15px", fontFamily: "Barlow Condensed, sans-serif", fontWeight: 900 }}>
                {level.status === "completed" ? level.totalSessions : `${level.completedSessions} / ${level.totalSessions}`}
              </span>
              <span style={{ color: "#5A5A5A", fontSize: "9px", fontFamily: "Barlow, sans-serif", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase" }}>
                {level.status === "completed" ? "Sessions Complete" : "Sessions"}
              </span>
            </div>
          </div>

          {/* Curriculum */}
          {level.curriculum && (
            <div style={{ padding: "0 16px 0" }}>
              <CurriculumAccordion sections={level.curriculum} />
            </div>
          )}

          {/* Cohort switcher + sessions */}
          {(level.sessions || level.cohorts) && (
            <div style={{ padding: "16px 16px 0" }}>
              {level.cohorts && level.cohorts.length > 1 && (
                <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
                  {level.cohorts.map((cohort, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveCohort(idx)}
                      style={{
                        flex: 1,
                        padding: "7px 0",
                        backgroundColor: activeCohort === idx ? "#C8342E" : "rgba(255,255,255,0.04)",
                        border: activeCohort === idx ? "1px solid #C8342E" : "1px solid rgba(255,255,255,0.07)",
                        borderRadius: "8px",
                        color: activeCohort === idx ? "#FFFFFF" : "#5A5A5A",
                        fontSize: "11px",
                        fontFamily: "Barlow, sans-serif",
                        fontWeight: 700,
                        cursor: "pointer",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {cohort.label}
                    </button>
                  ))}
                </div>
              )}
              {activeSessions && <SessionTimeline sessions={activeSessions} />}
            </div>
          )}

          {/* Note */}
          {level.note && (
            <div style={{ margin: "14px 16px 8px", backgroundColor: "rgba(200,52,46,0.05)", border: "1px solid rgba(200,52,46,0.15)", borderRadius: "9px", padding: "10px 12px", display: "flex", gap: "8px", alignItems: "flex-start" }}>
              {level.note.startsWith("🏆") ? (
                <Trophy size={12} color="#C8342E" style={{ flexShrink: 0, marginTop: 1 }} />
              ) : (
                <AlertTriangle size={12} color="#C8342E" style={{ flexShrink: 0, marginTop: 1 }} />
              )}
              <p style={{ color: "#8D8D8D", fontSize: "11px", fontFamily: "Barlow, sans-serif", margin: 0, lineHeight: 1.55 }}>
                {level.note.replace(/^[🏆⚠]\s*/, "")}
              </p>
            </div>
          )}

          {/* Bottom padding */}
          <div style={{ height: 32 }} />
        </div>
      </div>
    </>
  );
}
