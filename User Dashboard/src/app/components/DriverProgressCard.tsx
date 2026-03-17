interface DriverProgressCardProps {
  name: string;
  level: string;
  levelLabel: string;
  progressPercent: number;
  sessionsCompleted: number;
  totalSessions: number;
  nextSessionDate: string;
}

export function DriverProgressCard({
  name,
  level,
  levelLabel,
  progressPercent,
  sessionsCompleted,
  totalSessions,
  nextSessionDate,
}: DriverProgressCardProps) {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #1A1A1A 0%, #141414 100%)",
        border: "1px solid rgba(200,52,46,0.25)",
        borderRadius: "14px",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Red accent line */}
      <div style={{ height: "3px", backgroundColor: "#C8342E" }} />

      {/* Diagonal stripe decoration */}
      <div
        style={{
          position: "absolute",
          top: 3,
          right: 0,
          width: "120px",
          height: "100%",
          background:
            "repeating-linear-gradient(60deg, transparent, transparent 10px, rgba(200,52,46,0.025) 10px, rgba(200,52,46,0.025) 12px)",
          pointerEvents: "none",
        }}
      />

      <div style={{ padding: "16px" }}>
        {/* Header row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "16px",
          }}
        >
          <div>
            <p
              style={{
                color: "#5A5A5A",
                fontSize: "9px",
                fontFamily: "Barlow, sans-serif",
                fontWeight: 700,
                letterSpacing: "2.5px",
                textTransform: "uppercase",
                margin: "0 0 3px 0",
              }}
            >
              Driver
            </p>
            <h2
              style={{
                color: "#FFFFFF",
                fontSize: "21px",
                fontFamily: "var(--font-heading)",
                fontWeight: 800,
                letterSpacing: "0.5px",
                margin: 0,
                lineHeight: 1.1,
              }}
            >
              {name}
            </h2>
          </div>

          {/* Level badge — racing number style */}
          <div
            style={{
              backgroundColor: "#C8342E",
              borderRadius: "10px",
              padding: "5px 12px",
              textAlign: "center",
              minWidth: "72px",
            }}
          >
            <p
              style={{
                color: "rgba(255,255,255,0.7)",
                fontSize: "8px",
                fontFamily: "Barlow, sans-serif",
                fontWeight: 700,
                letterSpacing: "2px",
                textTransform: "uppercase",
                margin: "0 0 0px 0",
              }}
            >
              {levelLabel}
            </p>
            <p
              style={{
                color: "#FFFFFF",
                fontSize: "14px",
                fontFamily: "Barlow Condensed, sans-serif",
                fontWeight: 900,
                letterSpacing: "1px",
                margin: 0,
                lineHeight: 1.1,
              }}
            >
              {level}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: "16px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "7px",
            }}
          >
            <span
              style={{
                color: "#5A5A5A",
                fontSize: "9px",
                fontFamily: "Barlow, sans-serif",
                fontWeight: 700,
                letterSpacing: "2px",
                textTransform: "uppercase",
              }}
            >
              Overall Progress
            </span>
            <span
              style={{
                color: "#C8342E",
                fontSize: "13px",
                fontFamily: "Barlow Condensed, sans-serif",
                fontWeight: 800,
              }}
            >
              {progressPercent}%
            </span>
          </div>
          <div
            style={{
              backgroundColor: "rgba(255,255,255,0.06)",
              borderRadius: "3px",
              height: "5px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                backgroundColor: "#C8342E",
                height: "100%",
                width: `${progressPercent}%`,
                borderRadius: "3px",
              }}
            />
          </div>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "flex",
            gap: "0",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            paddingTop: "12px",
          }}
        >
          <div style={{ flex: 1 }}>
            <p
              style={{
                color: "#5A5A5A",
                fontSize: "9px",
                fontFamily: "Barlow, sans-serif",
                fontWeight: 700,
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                margin: "0 0 2px 0",
              }}
            >
              Sessions
            </p>
            <p
              style={{
                color: "#FFFFFF",
                fontSize: "16px",
                fontFamily: "Barlow Condensed, sans-serif",
                fontWeight: 800,
                margin: 0,
                lineHeight: 1,
              }}
            >
              {sessionsCompleted}
              <span style={{ color: "#5A5A5A", fontSize: "12px" }}> / {totalSessions}</span>
            </p>
          </div>

          <div
            style={{
              width: "1px",
              backgroundColor: "rgba(255,255,255,0.06)",
              margin: "0 16px",
            }}
          />

          <div style={{ flex: 1 }}>
            <p
              style={{
                color: "#5A5A5A",
                fontSize: "9px",
                fontFamily: "Barlow, sans-serif",
                fontWeight: 700,
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                margin: "0 0 2px 0",
              }}
            >
              Next Session
            </p>
            <p
              style={{
                color: "#FFFFFF",
                fontSize: "16px",
                fontFamily: "Barlow Condensed, sans-serif",
                fontWeight: 800,
                margin: 0,
                lineHeight: 1,
              }}
            >
              {nextSessionDate}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
