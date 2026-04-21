import { Fragment, type CSSProperties, type ReactNode } from "react";
import { ChevronRight, Funnel } from "lucide-react";
import { T } from "../../theme";

/* ══════════════════════════════════════════════════
   BREADCRUMBS
   ══════════════════════════════════════════════════ */

export function Breadcrumbs({ items }: { items: Array<{ label: string; onClick?: () => void; current?: boolean }> }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", minWidth: 0 }}>
      {items.map((item, index) => (
        <Fragment key={`${item.label}-${index}`}>
          {index > 0 ? <ChevronRight size={12} color={T.subtle} /> : null}
          {item.onClick && !item.current ? (
            <button
              type="button"
              onClick={item.onClick}
              style={{
                border: "none",
                background: "transparent",
                padding: 0,
                margin: 0,
                color: T.subtle,
                fontSize: T.textSm,
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {item.label}
            </button>
          ) : (
            <span
              style={{
                color: item.current ? T.heading : T.subtle,
                fontSize: T.textSm,
                fontWeight: item.current ? 700 : 600,
                whiteSpace: "nowrap",
              }}
            >
              {item.label}
            </span>
          )}
        </Fragment>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   PAGE HEADER
   ══════════════════════════════════════════════════ */

export function PageHeader({ title, leading, directory, children }: { title: string; leading?: ReactNode; directory?: ReactNode; children?: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: T.space2,
        flexWrap: "wrap",
        paddingBottom: T.space1,
        borderBottom: `1px solid ${T.border}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: T.space2, minWidth: 0, flex: "1 1 640px" }}>
        {leading ? <div style={{ flexShrink: 0 }}>{leading}</div> : null}
        <div style={{ minWidth: 0 }}>
          {directory ? <div style={{ marginBottom: T.space1 }}>{directory}</div> : null}
          <h1 style={{ color: T.heading, fontSize: T.text2xl, fontWeight: 700, margin: 0, lineHeight: 1.05, letterSpacing: "-0.02em" }}>{title}</h1>
        </div>
      </div>
      {children ? <div style={{ display: "flex", alignItems: "center", gap: T.space1, flexWrap: "wrap" }}>{children}</div> : null}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   FILTER BAR
   ══════════════════════════════════════════════════ */

export function FilterBar({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: T.space2,
        flexWrap: "wrap",
        padding: "10px 12px",
        borderRadius: T.radiusLg,
        border: `1px solid ${T.accentBorder}`,
        background: `linear-gradient(180deg, ${T.surfaceSoft} 0%, ${T.surface} 100%)`,
        boxShadow: T.shadow,
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          minHeight: T.controlMd,
          padding: "0 12px",
          borderRadius: "999px",
          border: `1px solid ${T.accentBorder}`,
          backgroundColor: T.accentBg,
          color: T.heading,
          fontSize: T.textXs,
          fontWeight: 700,
          whiteSpace: "nowrap",
        }}
      >
        <Funnel size={14} />
        Filters
      </span>
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   STICKY ACTION BAR
   ══════════════════════════════════════════════════ */

export function StickyActionBar({ children, visible }: { children: ReactNode; visible: boolean }) {
  if (!visible) return null;
  return (
    <div
      style={{
        position: "sticky",
        bottom: 0,
        left: 0,
        right: 0,
        minHeight: "52px",
        padding: `${T.space3} ${T.space5}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: T.space2,
        backgroundColor: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: T.radiusLg,
        zIndex: 20,
      }}
    >
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SECTION HEADERS & SURFACE
   ══════════════════════════════════════════════════ */

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h3 style={{ color: T.subtle, fontSize: T.textXs, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", margin: `0 0 ${T.space2} 0` }}>
      {children}
    </h3>
  );
}

export function SectionTitle({ eyebrow, title, detail, subdetail, titleStyle }: { eyebrow: string; title: string; detail?: string; subdetail?: string; titleStyle?: CSSProperties }) {
  return (
    <div style={{ display: "grid", gap: "2px", marginBottom: T.space2 }}>
      <p style={{ color: T.subtle, fontSize: T.textXs, fontWeight: 600, textTransform: "uppercase", margin: 0 }}>{eyebrow}</p>
      <h2 style={{ color: T.heading, fontSize: T.textLg, fontWeight: 600, margin: 0, lineHeight: 1.2, ...titleStyle }}>{title}</h2>
      {detail || subdetail ? <p style={{ color: T.muted, fontSize: T.textSm, lineHeight: 1.4, margin: 0 }}>{detail ?? subdetail}</p> : null}
    </div>
  );
}

export function Surface({ children, accent, style }: { children: ReactNode; accent?: boolean; style?: CSSProperties }) {
  return (
    <div style={{ backgroundColor: accent ? T.surfaceTint : T.surface, border: `1px solid ${accent ? T.accentBorder : T.border}`, borderRadius: T.radiusLg, position: "relative", overflow: "hidden", ...style }}>
      {children}
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: T.space3, padding: `${T.space6} ${T.space5}`, maxWidth: "360px", margin: "0 auto" }}>
      <span style={{ color: T.accent, width: "40px", height: "40px", borderRadius: T.radiusMd, display: "grid", placeItems: "center", background: T.accentBg, border: `1px solid ${T.accentBorder}` }}>{icon}</span>
      <p style={{ color: T.heading, fontSize: T.textLg, fontWeight: 700, margin: 0, textAlign: "center" }}>{title}</p>
      {description ? <p style={{ color: T.muted, fontSize: T.textBase, margin: 0, textAlign: "center", lineHeight: 1.55 }}>{description}</p> : null}
      {action}
    </div>
  );
}

export const nestedCardStyle: CSSProperties = {
  border: `1px solid ${T.borderSoft}`,
  backgroundColor: T.surface,
};
