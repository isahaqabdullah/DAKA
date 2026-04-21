import type { CSSProperties, ReactNode } from "react";
import { T } from "../../theme";

export function TableShell({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        borderRadius: T.radiusLg,
        border: `1px solid ${T.border}`,
        backgroundColor: T.surface,
        overflowX: "auto",
        overflowY: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function TableHeader({ children, columns }: { children: ReactNode; columns: string }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: columns,
        gap: T.space2,
        alignItems: "center",
        minHeight: "44px",
        padding: `0 ${T.space4}`,
        backgroundColor: T.surfaceSoft,
        borderBottom: `1px solid ${T.border}`,
      }}
    >
      {children}
    </div>
  );
}

export function Th({ children, align }: { children: ReactNode; align?: "left" | "center" | "right" }) {
  return (
    <span style={{ color: T.subtle, fontSize: T.textSm, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", textAlign: align ?? "left" }}>
      {children}
    </span>
  );
}

export function TableRow({ children, columns, highlight, onClick }: { children: ReactNode; columns: string; highlight?: boolean; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "grid",
        gridTemplateColumns: columns,
        gap: T.space2,
        alignItems: "center",
        minHeight: "52px",
        padding: `0 ${T.space4}`,
        borderBottom: `1px solid ${T.borderSoft}`,
        backgroundColor: highlight ? T.accentBg : "transparent",
        cursor: onClick ? "pointer" : undefined,
        transition: "background 0.1s ease",
      }}
      onMouseEnter={(e) => { if (onClick) e.currentTarget.style.backgroundColor = T.surfaceSoft; }}
      onMouseLeave={(e) => { if (onClick) e.currentTarget.style.backgroundColor = highlight ? T.accentBg : "transparent"; }}
    >
      {children}
    </div>
  );
}

export function Td({ children, align, muted: isMuted, bold }: { children: ReactNode; align?: "left" | "center" | "right"; muted?: boolean; bold?: boolean }) {
  return (
    <div style={{ color: isMuted ? T.muted : T.text, fontSize: T.textMd, fontWeight: bold ? 500 : 400, textAlign: align ?? "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>
      {children}
    </div>
  );
}
