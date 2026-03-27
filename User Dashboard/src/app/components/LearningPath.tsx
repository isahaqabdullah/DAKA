import { useState } from "react";
import { CheckCircle2, Lock } from "lucide-react";
import { RacingKid } from "./RacingKid";
import { LevelDetailSheet, LevelData } from "./LevelDetailSheet";

interface LearningPathProps {
  levels: LevelData[];
}

// ── Layout constants ────────────────────────────────────────────────────────
// Container is 343px wide (375 viewport – 32 px padding), 530px tall.
// Node centres (cx, cy), radii, etc.
const N1 = { cx: 92,  cy: 80,  r: 40, idx: 0 }; // Completed
const N2 = { cx: 250, cy: 260, r: 48, idx: 1 }; // Active  (bigger)
const N3 = { cx: 108, cy: 428, r: 38, idx: 2 }; // Locked

// Cubic-bezier path through all 3 nodes
const PATH = `M${N1.cx},${N1.cy} C${N1.cx},${(N1.cy + N2.cy) / 2} ${N2.cx},${(N1.cy + N2.cy) / 2} ${N2.cx},${N2.cy} C${N2.cx},${(N2.cy + N3.cy) / 2} ${N3.cx},${(N2.cy + N3.cy) / 2} ${N3.cx},${N3.cy}`;
// Segment 1 (L1→L2)
const SEG1 = `M${N1.cx},${N1.cy} C${N1.cx},${(N1.cy + N2.cy) / 2} ${N2.cx},${(N1.cy + N2.cy) / 2} ${N2.cx},${N2.cy}`;
// Segment 2 (L2→L3)
const SEG2 = `M${N2.cx},${N2.cy} C${N2.cx},${(N2.cy + N3.cy) / 2} ${N3.cx},${(N2.cy + N3.cy) / 2} ${N3.cx},${N3.cy}`;

// Approximate intermediate dot positions on the bezier curves (pre-computed t≈0.33 and t≈0.67)
const DOTS_SEG1 = [{ x: 133, y: 148 }, { x: 209, y: 196 }];
const DOTS_SEG2 = [{ x: 216, y: 326 }, { x: 148, y: 374 }];

// Character sits just above N2
const CHAR_W = 72;
const CHAR_H = 92;
const CHAR_LEFT = N2.cx - CHAR_W / 2 - 4;
const CHAR_TOP  = N2.cy - N2.r - CHAR_H - 4;

// Container height: bottom of N3 label + padding
const CONTAINER_H = N3.cy + N3.r + 70;

export function LearningPath({ levels }: LearningPathProps) {
  const [selected, setSelected] = useState<number | null>(null);

  const open  = (idx: number) => setSelected(idx);
  const close = ()            => setSelected(null);

  const nodeForLevel = [N1, N2, N3];

  return (
    <>
      <style>{`
        @keyframes nodePulse {
          0%, 100% { box-shadow: 0 0 0 0   rgba(200,52,46,0.5), 0 0 24px rgba(200,52,46,0.2); }
          50%       { box-shadow: 0 0 0 12px rgba(200,52,46,0),   0 0 36px rgba(200,52,46,0.1); }
        }
        @keyframes completedGlow {
          0%, 100% { box-shadow: 0 0 0 0  rgba(34,197,94,0.4), 0 0 16px rgba(34,197,94,0.15); }
          50%       { box-shadow: 0 0 0 8px rgba(34,197,94,0),   0 0 24px rgba(34,197,94,0.08); }
        }
        @keyframes flagWave {
          0%, 100% { transform: rotate(-4deg); }
          50%       { transform: rotate(4deg);  }
        }
        @keyframes dotPop {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.15); }
        }
        .node-active   { animation: nodePulse      2s ease-in-out infinite; }
        .node-complete { animation: completedGlow  2.5s ease-in-out infinite; }
        .flag-anim     { animation: flagWave       1.8s ease-in-out infinite; transform-origin: bottom left; }
        .dot-anim      { animation: dotPop         2s ease-in-out infinite; }
      `}</style>

      <div style={{ position: "relative", width: "100%", height: CONTAINER_H }}>
        {/* ── SVG layer: path + intermediate dots ─────────────────────────── */}
        <svg
          width="343"
          height={CONTAINER_H}
          viewBox={`0 0 343 ${CONTAINER_H}`}
          style={{ position: "absolute", top: 0, left: 0, zIndex: 0 }}
        >
          {/* Track background (full path, dark) */}
          <path d={PATH} stroke="rgba(255,255,255,0.06)" strokeWidth="12" fill="none" strokeLinecap="round" />

          {/* Completed segment: L1 → L2 (solid red) */}
          <path d={SEG1} stroke="#C8342E" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.55" />

          {/* Future segment: L2 → L3 (dashed gray) */}
          <path d={SEG2} stroke="rgba(255,255,255,0.12)" strokeWidth="5" fill="none" strokeLinecap="round" strokeDasharray="8 7" />

          {/* Intermediate checkpoint dots — SEG1 (completed, filled red) */}
          {DOTS_SEG1.map((d, i) => (
            <g key={`s1-${i}`}>
              <circle cx={d.x} cy={d.y} r="8"  fill="rgba(200,52,46,0.15)" />
              <circle cx={d.x} cy={d.y} r="4.5" fill="#C8342E" />
              <circle cx={d.x} cy={d.y} r="2"   fill="rgba(255,255,255,0.7)" />
            </g>
          ))}

          {/* Intermediate checkpoint dots — SEG2 (locked, empty) */}
          {DOTS_SEG2.map((d, i) => (
            <g key={`s2-${i}`}>
              <circle cx={d.x} cy={d.y} r="8"  fill="rgba(255,255,255,0.04)" />
              <circle cx={d.x} cy={d.y} r="4.5" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
            </g>
          ))}

          {/* Checkered flag near N1 (completed) */}
          <g transform={`translate(${N1.cx + N1.r + 6}, ${N1.cy - 22})`}>
            <line x1="0" y1="0" x2="0" y2="22" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
            <rect x="1" y="0"  width="5" height="5" fill="rgba(255,255,255,0.35)" />
            <rect x="6" y="0"  width="5" height="5" fill="rgba(0,0,0,0.4)" />
            <rect x="1" y="5"  width="5" height="5" fill="rgba(0,0,0,0.4)" />
            <rect x="6" y="5"  width="5" height="5" fill="rgba(255,255,255,0.35)" />
            <rect x="1" y="10" width="5" height="5" fill="rgba(255,255,255,0.35)" />
            <rect x="6" y="10" width="5" height="5" fill="rgba(0,0,0,0.4)" />
          </g>

          {/* "YOU ARE HERE" pointer arrow for N2 */}
          <path
            d={`M${N2.cx - 52},${N2.cy - 6} L${N2.cx - N2.r - 6},${N2.cy}`}
            stroke="#C8342E"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            fill="none"
            strokeLinecap="round"
            opacity="0.6"
          />
        </svg>

        {/* ── Animated Racing Kid character (at N2) ─────────────────────── */}
        <div
          style={{
            position: "absolute",
            left: CHAR_LEFT,
            top:  CHAR_TOP,
            zIndex: 4,
            pointerEvents: "none",
          }}
        >
          <RacingKid size={CHAR_W} />
        </div>

        {/* "YOU ARE HERE" badge to the left of N2 */}
        <div
          style={{
            position: "absolute",
            left: N2.cx - N2.r - 108,
            top: N2.cy - 14,
            zIndex: 5,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              backgroundColor: "#C8342E",
              borderRadius: "8px",
              padding: "4px 9px",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <div style={{ width: 0, height: 0, borderTop: "4px solid transparent", borderBottom: "4px solid transparent", borderLeft: "5px solid rgba(255,255,255,0.7)" }} />
            <span style={{ color: "#FFFFFF", fontSize: "9px", fontFamily: "var(--font-body)", fontWeight: 800, letterSpacing: "0px", whiteSpace: "nowrap" }}>
              YOU ARE HERE
            </span>
          </div>
        </div>

        {/* ── Level nodes ───────────────────────────────────────────────── */}
        {levels.map((level, idx) => {
          const node = nodeForLevel[idx];
          const diam = node.r * 2;
          const isCompleted = level.status === "completed";
          const isActive    = level.status === "active";
          const isLocked    = level.status === "locked";

          return (
            <div key={level.levelNumber} style={{ position: "absolute", zIndex: 3 }}>
              {/* Node circle */}
              <button
                onClick={() => open(idx)}
                className={isActive ? "node-active" : isCompleted ? "node-complete" : ""}
                style={{
                  position: "absolute",
                  left: node.cx - node.r,
                  top:  node.cy - node.r,
                  width:  diam,
                  height: diam,
                  borderRadius: "50%",
                  border: `2.5px solid ${isActive ? "#C8342E" : isCompleted ? "#22C55E" : "rgba(255,255,255,0.1)"}`,
                  backgroundColor: isActive
                    ? "#1A0A0A"
                    : isCompleted
                    ? "rgba(34,197,94,0.08)"
                    : "#0F0F0F",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  gap: "2px",
                  transition: "transform 0.12s ease",
                  opacity: isLocked ? 0.6 : 1,
                }}
                onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.94)"; }}
                onMouseUp={(e)   => { e.currentTarget.style.transform = "scale(1)"; }}
                onTouchStart={(e) => { e.currentTarget.style.transform = "scale(0.94)"; }}
                onTouchEnd={(e)   => { e.currentTarget.style.transform = "scale(1)"; }}
              >
                {isLocked ? (
                  <Lock size={isActive ? 26 : 22} color="#3A3A3A" />
                ) : isCompleted ? (
                  <>
                    <CheckCircle2 size={28} color="#22C55E" strokeWidth={1.5} />
                  </>
                ) : (
                  <>
                    <span style={{
                      color: "#C8342E",
                      fontSize: isActive ? "30px" : "24px",
                      fontFamily: "var(--font-body)",
                      fontWeight: 900,
                      lineHeight: 1,
                    }}>
                      {level.levelNumber}
                    </span>
                    {isActive && (
                      <span style={{ color: "rgba(200,52,46,0.6)", fontSize: "8px", fontFamily: "var(--font-body)", fontWeight: 700, letterSpacing: "0px" }}>
                        ACTIVE
                      </span>
                    )}
                  </>
                )}
              </button>

              {/* Label block below node */}
              <div
                style={{
                  position: "absolute",
                  left: node.cx - 70,
                  top: node.cy + node.r + 10,
                  width: 140,
                  textAlign: "center",
                  pointerEvents: "none",
                }}
              >
                <p style={{
                  color: isLocked ? "#3A3A3A" : isCompleted ? "#22C55E" : "#C8342E",
                  fontSize: "9px",
                  fontFamily: "var(--font-body)",
                  fontWeight: 700,
                  letterSpacing: "0px",
                  textTransform: "uppercase",
                  margin: "0 0 2px 0",
                }}>
                  Level {level.levelNumber}
                </p>
                <p style={{
                  color: isLocked ? "#3A3A3A" : "#FFFFFF",
                  fontSize: "13px",
                  fontFamily: "var(--font-heading)",
                  fontStyle: "italic",
                  fontWeight: 800,
                  letterSpacing: "0px",
                  margin: "0 0 2px 0",
                  lineHeight: 1.1,
                }}>
                  {level.levelTitle.toUpperCase()}
                </p>
                <p style={{
                  color: isLocked ? "#2A2A2A" : "#5A5A5A",
                  fontSize: "10px",
                  fontFamily: "var(--font-body)",
                  margin: 0,
                }}>
                  {level.completedSessions}/{level.totalSessions} sessions
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Detail sheet ─────────────────────────────────────────────────── */}
      {selected !== null && (
        <LevelDetailSheet level={levels[selected]} onClose={close} />
      )}
    </>
  );
}
