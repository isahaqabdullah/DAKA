import type { ReactNode } from "react";
import { T } from "../../theme";

export function KpiCard({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div
      style={{
        padding: `${T.space4} ${T.space4}`,
        borderRadius: T.radiusMd,
        border: `1px solid ${T.border}`,
        backgroundColor: T.surface,
        display: "grid",
        gap: "8px",
        minHeight: "96px",
        alignContent: "start",
      }}
    >
      <p style={{ color: T.subtle, fontSize: T.textSm, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0, lineHeight: 1 }}>{label}</p>
      <p style={{ color: T.heading, fontSize: T.text3xl, fontWeight: 700, margin: 0, lineHeight: 1.05, letterSpacing: "-0.03em" }}>{value}</p>
      {note ? <p style={{ color: T.muted, fontSize: T.textBase, margin: 0, lineHeight: 1.45 }}>{note}</p> : null}
    </div>
  );
}

export function MetricCard({ label, value, note }: { icon?: ReactNode; label: string; value: string; note: string }) {
  return <KpiCard label={label} value={value} note={note} />;
}
