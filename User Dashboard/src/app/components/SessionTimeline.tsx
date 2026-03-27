export interface Session {
  date: string;
  track: string;
  task: string;
  isNext?: boolean;
  isPast?: boolean;
  isNoClass?: boolean;
}

interface SessionTimelineProps {
  sessions: Session[];
}

function parseDateParts(date: string) {
  const parts = date.trim().split(" ");
  if (parts.length >= 3) return { day: parts[0], num: parts[1], month: parts[2] };
  return { day: "", num: "—", month: "" };
}

export function SessionTimeline({ sessions }: SessionTimelineProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
      <p
        style={{
          color: "#5A5A5A",
          fontSize: "9px",
          fontFamily: "var(--font-heading)",
          fontStyle: "italic",
          fontWeight: 700,
          letterSpacing: "0px",
          textTransform: "uppercase",
          margin: "0 0 6px 0",
        }}
      >
        Session Schedule
      </p>

      {sessions.map((session, i) => {
        const { day, num, month } = parseDateParts(session.date);

        if (session.isNoClass) {
          return (
            <div
              key={i}
              style={{
                backgroundColor: "rgba(255,255,255,0.02)",
                border: "1px dashed rgba(255,255,255,0.07)",
                borderRadius: "8px",
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <div
                style={{
                  backgroundColor: "rgba(255,255,255,0.04)",
                  borderRadius: "7px",
                  padding: "4px 7px",
                  minWidth: "44px",
                  textAlign: "center",
                  flexShrink: 0,
                }}
              >
                <p style={{ color: "#3A3A3A", fontSize: "9px", fontFamily: "var(--font-body)", fontWeight: 700, margin: 0, textTransform: "uppercase" }}>{day}</p>
                <p style={{ color: "#3A3A3A", fontSize: "15px", fontFamily: "var(--font-body)", fontWeight: 900, margin: 0, lineHeight: 1 }}>{num}</p>
                <p style={{ color: "#3A3A3A", fontSize: "9px", fontFamily: "var(--font-body)", fontWeight: 700, margin: 0, textTransform: "uppercase" }}>{month}</p>
              </div>
              <div>
                <p style={{ color: "#3A3A3A", fontSize: "11px", fontFamily: "var(--font-body)", fontWeight: 600, margin: "0 0 1px 0" }}>
                  No Class
                </p>
                <p style={{ color: "#2E2E2E", fontSize: "10px", fontFamily: "var(--font-body)", margin: 0 }}>
                  {session.task}
                </p>
              </div>
              <div style={{ marginLeft: "auto", flexShrink: 0 }}>
                <div style={{ backgroundColor: "rgba(255,255,255,0.04)", borderRadius: "4px", padding: "2px 6px" }}>
                  <span style={{ color: "#3A3A3A", fontSize: "8px", fontFamily: "var(--font-body)", fontWeight: 700, letterSpacing: "0px" }}>HOLIDAY</span>
                </div>
              </div>
            </div>
          );
        }

        return (
          <div
            key={i}
            style={{
              backgroundColor: session.isNext
                ? "rgba(200,52,46,0.07)"
                : "rgba(255,255,255,0.03)",
              border: session.isNext
                ? "1px solid rgba(200,52,46,0.28)"
                : "1px solid rgba(255,255,255,0.05)",
              borderRadius: "9px",
              padding: "10px 12px",
              display: "flex",
              alignItems: "center",
              gap: "11px",
            }}
          >
            {/* Date tile */}
            <div
              style={{
                backgroundColor: session.isNext
                  ? "#C8342E"
                  : session.isPast
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(255,255,255,0.04)",
                borderRadius: "7px",
                padding: "4px 7px",
                minWidth: "44px",
                textAlign: "center",
                flexShrink: 0,
              }}
            >
              <p style={{ color: session.isNext ? "rgba(255,255,255,0.75)" : "#3A3A3A", fontSize: "9px", fontFamily: "var(--font-body)", fontWeight: 700, textTransform: "uppercase", margin: 0, letterSpacing: "0px" }}>{day}</p>
              <p style={{ color: session.isNext ? "#FFFFFF" : session.isPast ? "#707070" : "#AAAAAA", fontSize: "17px", fontFamily: "var(--font-body)", fontWeight: 900, margin: 0, lineHeight: 1 }}>{num}</p>
              <p style={{ color: session.isNext ? "rgba(255,255,255,0.75)" : "#3A3A3A", fontSize: "9px", fontFamily: "var(--font-body)", fontWeight: 700, textTransform: "uppercase", margin: 0, letterSpacing: "0px" }}>{month}</p>
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  color: session.isPast ? "#606060" : "#DDDDDD",
                  fontSize: "12px",
                  fontFamily: "var(--font-body)",
                  fontWeight: 600,
                  margin: "0 0 2px 0",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {session.track}
              </p>
              <p
                style={{
                  color: session.isPast ? "#4A4A4A" : "#5A5A5A",
                  fontSize: "11px",
                  fontFamily: "var(--font-body)",
                  margin: 0,
                  lineHeight: 1.35,
                }}
              >
                {session.task}
              </p>
            </div>

            {/* Tag */}
            {session.isNext && (
              <div style={{ backgroundColor: "#C8342E", borderRadius: "5px", padding: "2px 6px", flexShrink: 0 }}>
                <span style={{ color: "#FFFFFF", fontSize: "8px", fontFamily: "var(--font-body)", fontWeight: 700, letterSpacing: "0px" }}>NEXT</span>
              </div>
            )}
            {session.isPast && !session.isNext && (
              <div style={{ backgroundColor: "rgba(255,255,255,0.04)", borderRadius: "5px", padding: "2px 6px", flexShrink: 0 }}>
                <span style={{ color: "#3A3A3A", fontSize: "8px", fontFamily: "var(--font-body)", fontWeight: 700, letterSpacing: "0px" }}>DONE</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
