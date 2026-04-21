import type { ChipTone } from "../../types";
import { CHIP_STYLES, T } from "../../theme";

export function StatusChip({ tone, label }: { tone: ChipTone; label: string }) {
  const s = CHIP_STYLES[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: T.space1,
        minHeight: "26px",
        padding: `0 ${T.space2}`,
        borderRadius: "999px",
        border: `1px solid ${s.border}`,
        backgroundColor: s.bg,
        color: s.color,
        fontSize: T.textSm,
        fontWeight: 600,
        whiteSpace: "nowrap",
        lineHeight: 1,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: s.dot, flexShrink: 0 }} />
      {label}
    </span>
  );
}
