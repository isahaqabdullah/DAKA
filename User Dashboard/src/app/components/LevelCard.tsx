import { Lock, CheckCircle2, ChevronDown, ChevronUp, Users, CalendarDays, Flag, AlertTriangle, Trophy } from "lucide-react";
import { useState } from "react";
import { SessionProgressDots } from "./SessionProgressDots";
import { CurriculumAccordion } from "./CurriculumAccordion";
import { SessionTimeline, Session } from "./SessionTimeline";

type LevelStatus = "completed" | "active" | "locked";

interface CurriculumSection {
  title: string;
  items: string[];
}

interface AgeGroup {
  label: string;
  time: string;
  ages: string;
}

interface Cohort {
  label: string;
  sessions: Session[];
}

interface LevelCardProps {
  levelNumber: number;
  levelTitle: string;
  subtitle?: string;
  price: string;
  priceLabel?: string;
  schedule?: string;
  groupPrice?: string;
  prerequisite?: string;
  note?: string;
  ageGroups?: AgeGroup[];
  status: LevelStatus;
  totalSessions: number;
  completedSessions: number;
  curriculum?: CurriculumSection[];
  sessions?: Session[];
  cohorts?: Cohort[];
  defaultExpanded?: boolean;
}

export function LevelCard({
  levelNumber,
  levelTitle,
  subtitle,
  price,
  priceLabel = "per term",
  schedule,
  groupPrice,
  prerequisite,
  note,
  ageGroups,
  status,
  totalSessions,
  completedSessions,
  curriculum,
  sessions,
  cohorts,
  defaultExpanded = false,
}: LevelCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [activeCohort, setActiveCohort] = useState(0);

  const isCompleted = status === "completed";
  const isActive = status === "active";
  const isLocked = status === "locked";

  const activeSessions = cohorts ? cohorts[activeCohort]?.sessions : sessions;

  const statusConfig = {
    completed: {
      color: "#22C55E",
      bg: "rgba(34,197,94,0.08)",
      border: "rgba(34,197,94,0.2)",
      cardBorder: "rgba(34,197,94,0.15)",
      label: "Completed",
    },
    active: {
      color: "#C8342E",
      bg: "rgba(200,52,46,0.1)",
      border: "rgba(200,52,46,0.3)",
      cardBorder: "rgba(200,52,46,0.25)",
      label: "Active",
    },
    locked: {
      color: "#3A3A3A",
      bg: "rgba(255,255,255,0.04)",
      border: "rgba(255,255,255,0.08)",
      cardBorder: "rgba(255,255,255,0.06)",
      label: "Locked",
    },
  };

  const cfg = statusConfig[status];

  return (
    <div
      style={{
        background: isLocked ? "#111111" : "#141414",
        border: `1px solid ${cfg.cardBorder}`,
        borderRadius: "14px",
        overflow: "hidden",
        opacity: isLocked ? 0.6 : 1,
      }}
    >
      {isActive && <div style={{ height: "3px", backgroundColor: "#C8342E" }} />}
      {isCompleted && <div style={{ height: "3px", backgroundColor: "#22C55E" }} />}

      {/* Tappable header */}
      <button
        disabled={isLocked}
        onClick={() => !isLocked && setExpanded(!expanded)}
        style={{
          width: "100%",
          background: "none",
          border: "none",
          cursor: isLocked ? "default" : "pointer",
          padding: "15px 15px 14px",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "13px" }}>
          {/* Racing number tile */}
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "10px",
              backgroundColor: isActive
                ? "#C8342E"
                : isCompleted
                ? "rgba(34,197,94,0.12)"
                : "rgba(255,255,255,0.04)",
              border: isCompleted ? "1px solid rgba(34,197,94,0.25)" : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {isLocked ? (
              <Lock size={17} color="#3A3A3A" />
            ) : (
              <span
                style={{
                  color: isActive ? "#FFFFFF" : isCompleted ? "#22C55E" : "#3A3A3A",
                  fontSize: "22px",
                  fontFamily: "var(--font-body)",
                  fontWeight: 900,
                  lineHeight: 1,
                }}
              >
                {levelNumber}
              </span>
            )}
          </div>

          {/* Title + subtitle */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                color: "#5A5A5A",
                fontSize: "9px",
                fontFamily: "var(--font-body)",
                fontWeight: 700,
                letterSpacing: "0px",
                textTransform: "uppercase",
                margin: "0 0 1px 0",
              }}
            >
              Level {levelNumber}
            </p>
            <p
              style={{
                color: isLocked ? "#3A3A3A" : "#FFFFFF",
                fontSize: "17px",
                fontFamily: "var(--font-heading)",
                fontStyle: "italic",
                fontWeight: 800,
                letterSpacing: "0px",
                margin: "0 0 2px 0",
                lineHeight: 1.1,
              }}
            >
              {levelTitle}
            </p>
            {subtitle && (
              <p
                style={{
                  color: isLocked ? "#2A2A2A" : "#4A4A4A",
                  fontSize: "10px",
                  fontFamily: "var(--font-body)",
                  fontWeight: 500,
                  margin: "0 0 4px 0",
                  lineHeight: 1.4,
                }}
              >
                {subtitle}
              </p>
            )}
            {/* Price row */}
            <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
              <p
                style={{
                  color: isLocked ? "#2E2E2E" : "#CCCCCC",
                  fontSize: "14px",
                  fontFamily: "var(--font-body)",
                  fontWeight: 800,
                  margin: 0,
                  lineHeight: 1,
                }}
              >
                {price}
              </p>
              <p
                style={{
                  color: isLocked ? "#2A2A2A" : "#4A4A4A",
                  fontSize: "10px",
                  fontFamily: "var(--font-body)",
                  margin: 0,
                }}
              >
                {priceLabel}
              </p>
            </div>
          </div>

          {/* Status + chevron */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px", flexShrink: 0 }}>
            <div
              style={{
                backgroundColor: cfg.bg,
                border: `1px solid ${cfg.border}`,
                borderRadius: "6px",
                padding: "3px 9px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              {isCompleted && <CheckCircle2 size={9} color="#22C55E" />}
              {isLocked && <Lock size={9} color="#3A3A3A" />}
              <span
                style={{
                  color: cfg.color,
                  fontSize: "10px",
                  fontFamily: "var(--font-body)",
                  fontWeight: 700,
                  letterSpacing: "0px",
                }}
              >
                {cfg.label}
              </span>
            </div>
            {!isLocked &&
              (expanded ? <ChevronUp size={14} color="#5A5A5A" /> : <ChevronDown size={14} color="#5A5A5A" />)}
          </div>
        </div>

        {/* Session progress dots */}
        {!isLocked && (
          <div style={{ marginTop: "13px" }}>
            <SessionProgressDots total={totalSessions} completed={completedSessions} />
          </div>
        )}
      </button>

      {/* Expanded content */}
      {expanded && !isLocked && (
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.05)",
            backgroundColor: "rgba(0,0,0,0.25)",
          }}
        >
          {/* Info strip */}
          <div
            style={{
              padding: "14px 15px",
              display: "flex",
              flexDirection: "column",
              gap: "9px",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
            }}
          >
            {schedule && (
              <div style={{ display: "flex", gap: "9px", alignItems: "flex-start" }}>
                <CalendarDays size={12} color="#C8342E" style={{ flexShrink: 0, marginTop: "1px" }} />
                <p style={{ color: "#8D8D8D", fontSize: "11px", fontFamily: "var(--font-body)", margin: 0, lineHeight: 1.5 }}>
                  {schedule}
                </p>
              </div>
            )}
            {groupPrice && (
              <div style={{ display: "flex", gap: "9px", alignItems: "center" }}>
                <Users size={12} color="#C8342E" style={{ flexShrink: 0 }} />
                <p style={{ color: "#8D8D8D", fontSize: "11px", fontFamily: "var(--font-body)", margin: 0 }}>
                  {groupPrice}
                </p>
              </div>
            )}
            {prerequisite && (
              <div style={{ display: "flex", gap: "9px", alignItems: "flex-start" }}>
                <Flag size={12} color="#5A5A5A" style={{ flexShrink: 0, marginTop: "1px" }} />
                <p style={{ color: "#5A5A5A", fontSize: "11px", fontFamily: "var(--font-body)", margin: 0, lineHeight: 1.5 }}>
                  {prerequisite}
                </p>
              </div>
            )}

            {/* Age group chips */}
            {ageGroups && ageGroups.length > 0 && (
              <div style={{ display: "flex", gap: "8px", marginTop: "2px" }}>
                {ageGroups.map((ag) => (
                  <div
                    key={ag.label}
                    style={{
                      flex: 1,
                      backgroundColor: "rgba(200,52,46,0.07)",
                      border: "1px solid rgba(200,52,46,0.18)",
                      borderRadius: "8px",
                      padding: "8px 10px",
                    }}
                  >
                    <p style={{ color: "#C8342E", fontSize: "9px", fontFamily: "var(--font-body)", fontWeight: 800, letterSpacing: "0px", textTransform: "uppercase", margin: "0 0 2px 0" }}>
                      {ag.label}
                    </p>
                    <p style={{ color: "#FFFFFF", fontSize: "11px", fontFamily: "var(--font-body)", fontWeight: 700, margin: "0 0 1px 0" }}>
                      {ag.time}
                    </p>
                    <p style={{ color: "#5A5A5A", fontSize: "10px", fontFamily: "var(--font-body)", margin: 0 }}>
                      {ag.ages}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Session count badge */}
          <div style={{ padding: "12px 15px 0" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "6px", padding: "4px 10px" }}>
              <span style={{ color: "#C8342E", fontSize: "13px", fontFamily: "var(--font-body)", fontWeight: 900 }}>{totalSessions}</span>
              <span style={{ color: "#5A5A5A", fontSize: "9px", fontFamily: "var(--font-body)", fontWeight: 700, letterSpacing: "0px", textTransform: "uppercase" }}>Sessions</span>
            </div>
          </div>

          {/* Curriculum */}
          {curriculum && (
            <div style={{ padding: "14px 15px 0" }}>
              <CurriculumAccordion sections={curriculum} />
            </div>
          )}

          {/* Cohort switcher */}
          {cohorts && cohorts.length > 1 && (
            <div style={{ padding: "14px 15px 0" }}>
              <div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
                {cohorts.map((cohort, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => { e.stopPropagation(); setActiveCohort(idx); }}
                    style={{
                      flex: 1,
                      padding: "7px 0",
                      backgroundColor: activeCohort === idx ? "#C8342E" : "rgba(255,255,255,0.04)",
                      border: activeCohort === idx ? "1px solid #C8342E" : "1px solid rgba(255,255,255,0.07)",
                      borderRadius: "7px",
                      color: activeCohort === idx ? "#FFFFFF" : "#5A5A5A",
                      fontSize: "11px",
                      fontFamily: "var(--font-body)",
                      fontWeight: 700,
                      cursor: "pointer",
                      letterSpacing: "0px",
                    }}
                  >
                    {cohort.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sessions */}
          {activeSessions && (
            <div style={{ padding: cohorts ? "0 15px 16px" : "14px 15px 16px" }}>
              <SessionTimeline sessions={activeSessions} />
            </div>
          )}

          {/* Note */}
          {note && (
            <div
              style={{
                margin: "0 15px 15px",
                backgroundColor: "rgba(200,52,46,0.06)",
                border: "1px solid rgba(200,52,46,0.15)",
                borderRadius: "8px",
                padding: "10px 12px",
                display: "flex",
                gap: "8px",
                alignItems: "flex-start",
              }}
            >
              {note.startsWith("🏆") ? (
                <Trophy size={12} color="#C8342E" style={{ flexShrink: 0, marginTop: "1px" }} />
              ) : (
                <AlertTriangle size={12} color="#C8342E" style={{ flexShrink: 0, marginTop: "1px" }} />
              )}
              <p
                style={{
                  color: "#8D8D8D",
                  fontSize: "11px",
                  fontFamily: "var(--font-body)",
                  margin: 0,
                  lineHeight: 1.55,
                }}
              >
                {note.replace(/^[🏆⚠]\s*/, "")}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
