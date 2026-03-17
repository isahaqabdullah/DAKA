interface SessionProgressDotsProps {
  total: number;
  completed: number;
}

export function SessionProgressDots({ total, completed }: SessionProgressDotsProps) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
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
          Sessions
        </span>
        <span
          style={{
            color: "#5A5A5A",
            fontSize: "10px",
            fontFamily: "Barlow Condensed, sans-serif",
            fontWeight: 700,
          }}
        >
          {completed} / {total}
        </span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            style={{
              width: "9px",
              height: "9px",
              borderRadius: "50%",
              backgroundColor: i < completed ? "#C8342E" : "rgba(255,255,255,0.08)",
              border: i < completed ? "none" : "1px solid rgba(255,255,255,0.12)",
              flexShrink: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}
