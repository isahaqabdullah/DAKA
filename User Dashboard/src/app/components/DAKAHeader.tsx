import autodromeHeaderLogo from "../../assets/autodrome-header-logo.svg";

interface DAKAHeaderProps {
  heroImageUrl: string;
}

export function DAKAHeader({ heroImageUrl }: DAKAHeaderProps) {
  return (
    <div style={{ position: "relative", height: "200px", overflow: "hidden" }}>
      {/* Hero image */}
      <img
        src={heroImageUrl}
        alt="Dubai Autodrome Kartdrome"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
        }}
      />

      {/* Dark overlay gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to bottom, rgba(12,12,12,0.3) 0%, rgba(12,12,12,0.7) 60%, #0C0C0C 100%)",
        }}
      />

      {/* Red top bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "3px",
          backgroundColor: "#C8342E",
        }}
      />

      {/* Top nav row */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          padding: "18px 16px 0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <img
          src={autodromeHeaderLogo}
          alt="Dubai Autodrome"
          style={{
            height: "36px",
            width: "auto",
            display: "block",
            flexShrink: 0,
          }}
        />

        {/* Avatar */}
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            backgroundColor: "#C8342E",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid rgba(200,52,46,0.4)",
          }}
        >
          <span
            style={{
              color: "#FFFFFF",
              fontSize: "13px",
              fontFamily: "Barlow Condensed, sans-serif",
              fontWeight: 800,
            }}
          >
            AK
          </span>
        </div>
      </div>

      {/* Bottom title */}
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          left: "16px",
          right: "16px",
        }}
      >
        <p
          style={{
            color: "#C8342E",
            fontSize: "10px",
            fontFamily: "Barlow, sans-serif",
            fontWeight: 700,
            letterSpacing: "2.5px",
            textTransform: "uppercase",
            margin: "0 0 2px 0",
          }}
        >
          Karting Academy
        </p>
        <h1
          style={{
            color: "#FFFFFF",
            fontSize: "28px",
            fontFamily: "var(--font-heading)",
            fontWeight: 900,
            letterSpacing: "1px",
            textTransform: "uppercase",
            margin: 0,
            lineHeight: 1,
          }}
        >
          MY TRAINING
        </h1>
      </div>
    </div>
  );
}
