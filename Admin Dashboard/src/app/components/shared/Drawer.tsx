import type { ReactNode } from "react";
import { X } from "lucide-react";
import { T } from "../../theme";

export function Drawer({ open, title, onClose, children, footer }: { open: boolean; title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  if (!open) return null;
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: T.backdrop,
          zIndex: 100,
        }}
      />
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "grid",
          placeItems: "center",
          padding: T.space4,
          zIndex: 101,
        }}
      >
        <div
          onClick={(event) => event.stopPropagation()}
          style={{
            width: "min(680px, calc(100vw - 32px))",
            maxHeight: "calc(100vh - 32px)",
            backgroundColor: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: T.radiusLg,
            boxShadow: T.shadowLg,
            zIndex: 101,
            display: "grid",
            gridTemplateRows: "auto minmax(0, 1fr) auto",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: "60px", padding: `${T.space4} ${T.space5}`, borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
            <div style={{ display: "grid", gap: "2px" }}>
              <p style={{ color: T.subtle, fontSize: T.textXs, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>Editor</p>
              <h2 style={{ color: T.heading, fontSize: T.textXl, fontWeight: 700, margin: 0, lineHeight: 1.15 }}>{title}</h2>
            </div>
            <button type="button" onClick={onClose} aria-label="Close" style={{ display: "grid", placeItems: "center", width: "32px", height: "32px", borderRadius: T.radiusSm, border: `1px solid ${T.border}`, background: T.surface, color: T.muted, cursor: "pointer" }}>
              <X size={16} />
            </button>
          </div>
          <div style={{ overflow: "auto", padding: T.space5 }}>
            {children}
          </div>
          {footer ? (
            <div style={{ padding: `${T.space4} ${T.space5}`, borderTop: `1px solid ${T.border}`, display: "flex", gap: T.space2, justifyContent: "flex-end", flexShrink: 0 }}>
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
