import type { CSSProperties, ReactNode } from "react";
import { T } from "../../theme";

export function Btn({ children, variant = "primary", size = "default", onClick, disabled, type = "button", style }: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "default" | "compact" | "large";
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  style?: CSSProperties;
}) {
  const h = size === "compact" ? T.controlSm : size === "large" ? T.controlLg : T.controlMd;
  const px = size === "compact" ? T.space2 : size === "large" ? T.space4 : T.space3;
  const fs = size === "compact" ? T.textSm : T.textBase;

  const base: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    height: h,
    padding: `0 ${px}`,
    borderRadius: T.radiusMd,
    fontSize: fs,
    fontFamily: "var(--font-body)",
    fontWeight: 700,
    letterSpacing: "0.01em",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    whiteSpace: "nowrap",
    boxShadow: "none",
    transition: "background 0.12s ease, border-color 0.12s ease, box-shadow 0.12s ease, transform 0.12s ease",
  };

  const variants: Record<string, CSSProperties> = {
    primary: {
      background: "linear-gradient(180deg, #4A7DFF 0%, #3B82F6 48%, #2C5BE3 100%)",
      color: "#FFFFFF",
      border: "1px solid #2C5BE3",
      boxShadow: "0 12px 28px rgba(74,125,255,0.28), inset 0 1px 0 rgba(255,255,255,0.24)",
    },
    secondary: {
      background: "linear-gradient(180deg, #F8FBFF 0%, #EFF5FF 44%, #EAF2FF 100%)",
      color: "#2346A0",
      border: "1px solid #C5D7FF",
      boxShadow: "0 8px 18px rgba(74,125,255,0.10), inset 0 1px 0 rgba(255,255,255,0.94)",
    },
    ghost: {
      background: "rgba(234,242,255,0.72)",
      color: "#2346A0",
      border: "1px solid rgba(197,215,255,0.86)",
      boxShadow: "0 6px 14px rgba(74,125,255,0.08)",
    },
    danger: {
      background: "linear-gradient(180deg, rgba(214,91,70,0.24) 0%, rgba(200,52,46,0.12) 100%)",
      color: T.danger,
      border: "1px solid rgba(200,52,46,0.24)",
      boxShadow: "0 10px 20px rgba(196,66,45,0.12), inset 0 1px 0 rgba(255,255,255,0.22)",
    },
  };

  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

export function ActionButton({ children, secondary, type = "button", onClick, disabled, style }: {
  children: ReactNode; secondary?: boolean; type?: "button" | "submit"; onClick?: () => void; disabled?: boolean; style?: CSSProperties;
}) {
  return <Btn variant={secondary ? "secondary" : "primary"} onClick={onClick} disabled={disabled} type={type} style={style}>{children}</Btn>;
}
