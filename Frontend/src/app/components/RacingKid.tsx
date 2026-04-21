export function RacingKid({ size = 70 }: { size?: number }) {
  const h = Math.round(size * (108 / 84));

  return (
    <>
      <style>{`
        @keyframes racerBounce {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }
        @keyframes shadowBreath {
          0%, 100% { transform: scaleX(1);   opacity: 0.35; }
          50%       { transform: scaleX(0.6); opacity: 0.15; }
        }
        .racer-wrap {
          animation: racerBounce 2.2s ease-in-out infinite;
          display: inline-flex;
          flex-direction: column;
          align-items: center;
        }
        .racer-shadow {
          width: 44px;
          height: 8px;
          border-radius: 50%;
          background: radial-gradient(ellipse, rgba(200,52,46,0.45) 0%, transparent 70%);
          margin-top: 2px;
          animation: shadowBreath 2.2s ease-in-out infinite;
        }
      `}</style>

      <div className="racer-wrap" style={{ display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
        {/* ── SVG Character ── */}
        <svg
          viewBox="0 0 84 108"
          width={size}
          height={h}
          style={{ overflow: "visible", filter: "drop-shadow(0 4px 12px rgba(200,52,46,0.3))" }}
        >
          {/* ──── HELMET ──── */}
          {/* Shell */}
          <ellipse cx="42" cy="23" rx="22" ry="21" fill="#1A1A1A" />
          {/* Top red stripe */}
          <path d="M32 4 Q42 1 52 4 L50 16 Q42 13 34 16 Z" fill="#C8342E" />
          {/* Visor */}
          <rect x="24" y="15" width="36" height="15" rx="5" fill="#080808" />
          {/* Visor inner reflection */}
          <path d="M26 17 L38 17" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" strokeLinecap="round" />
          {/* Chin bar */}
          <path d="M22 28 Q22 41 42 41 Q62 41 62 28" fill="#141414" />
          {/* Chin vent */}
          <line x1="37" y1="37" x2="47" y2="37" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round" />
          {/* Helmet side bumps */}
          <ellipse cx="22" cy="22" rx="3" ry="5" fill="#141414" />
          <ellipse cx="62" cy="22" rx="3" ry="5" fill="#141414" />

          {/* ──── NECK ──── */}
          <rect x="34" y="39" width="16" height="9" rx="3" fill="#C8342E" />

          {/* ──── TORSO ──── */}
          <rect x="20" y="47" width="44" height="34" rx="5" fill="#C8342E" />
          {/* Left side panel */}
          <rect x="20" y="47" width="13" height="34" rx="4" fill="#9A2020" opacity="0.55" />
          {/* Right side panel */}
          <rect x="51" y="47" width="13" height="34" rx="4" fill="#9A2020" opacity="0.55" />
          {/* White center zipper strip */}
          <rect x="36" y="48" width="12" height="32" rx="4" fill="rgba(255,255,255,0.92)" />
          {/* Number "2" on strip */}
          <text
            x="42"
            y="69"
            textAnchor="middle"
            fill="#C8342E"
            fontSize="13"
            fontWeight="900"
            letterSpacing="-0.5"
            style={{ fontFamily: "var(--font-body)" }}
          >
            2
          </text>
          {/* Collar detail */}
          <path d="M34 47 Q42 51 50 47" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" fill="none" />

          {/* ──── SHOULDER PADS ──── */}
          <ellipse cx="21" cy="50" rx="9" ry="5" fill="#B52525" />
          <ellipse cx="63" cy="50" rx="9" ry="5" fill="#B52525" />

          {/* ──── LEFT ARM (static, angled down) ──── */}
          <path d="M21 54 L10 70" stroke="#C8342E" strokeWidth="9" strokeLinecap="round" />
          {/* Left cuff */}
          <ellipse cx="9" cy="70" rx="1.5" ry="3" fill="#B52525" />
          {/* Left glove */}
          <ellipse cx="9" cy="74" rx="5.5" ry="5" fill="#1A1A1A" />

          {/* ──── RIGHT ARM (animated wave) ──── */}
          <g>
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="0 63 54; -14 63 54; 0 63 54; 14 63 54; 0 63 54"
              keyTimes="0; 0.25; 0.5; 0.75; 1"
              dur="2.5s"
              repeatCount="indefinite"
              calcMode="ease-in-out"
            />
            <path d="M63 54 L77 38" stroke="#C8342E" strokeWidth="9" strokeLinecap="round" />
            {/* Right cuff */}
            <ellipse cx="77" cy="38" rx="1.5" ry="3" fill="#B52525" />
            {/* Right glove */}
            <ellipse cx="77" cy="34" rx="5.5" ry="5" fill="#1A1A1A" />
            {/* Waving fingers */}
            <line x1="74" y1="30" x2="73" y2="27" stroke="#111" strokeWidth="2" strokeLinecap="round" />
            <line x1="78" y1="29" x2="77" y2="26" stroke="#111" strokeWidth="2" strokeLinecap="round" />
            <line x1="81" y1="31" x2="81" y2="28" stroke="#111" strokeWidth="2" strokeLinecap="round" />
          </g>

          {/* ──── LEGS ──── */}
          <rect x="25" y="80" width="13" height="16" rx="3.5" fill="#1A1A1A" />
          <rect x="46" y="80" width="13" height="16" rx="3.5" fill="#1A1A1A" />

          {/* ──── BOOTS ──── */}
          <rect x="22" y="93" width="19" height="11" rx="4" fill="#0D0D0D" />
          <rect x="43" y="93" width="19" height="11" rx="4" fill="#0D0D0D" />
          {/* Boot red stripes */}
          <rect x="22" y="93" width="19" height="3" rx="1.5" fill="#C8342E" />
          <rect x="43" y="93" width="19" height="3" rx="1.5" fill="#C8342E" />
        </svg>

        {/* Shadow blob under feet */}
        <div className="racer-shadow" />
      </div>
    </>
  );
}
