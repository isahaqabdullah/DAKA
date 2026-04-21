import { Children, type CSSProperties, type ChangeEvent, type ReactNode, type SelectHTMLAttributes } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { T } from "../../theme";
import type { Cohort } from "../../types";

/* ══════════════════════════════════════════════════
   INPUT / TEXTAREA STYLES
   ══════════════════════════════════════════════════ */

export const inputStyle: CSSProperties = {
  width: "100%",
  height: T.controlMd,
  background: "transparent",
  border: "none",
  outline: "none",
  color: T.heading,
  fontSize: T.textMd,
  fontFamily: "var(--font-body)",
};

export const textareaStyle: CSSProperties = {
  width: "100%",
  minHeight: "72px",
  padding: `${T.space2} 0`,
  resize: "vertical",
  background: "transparent",
  border: "none",
  outline: "none",
  color: T.heading,
  fontSize: T.textMd,
  fontFamily: "var(--font-body)",
};

/* ══════════════════════════════════════════════════
   FORM PRIMITIVES
   ══════════════════════════════════════════════════ */

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label style={{ display: "block", color: T.subtle, fontSize: T.textSm, fontWeight: 600, textTransform: "uppercase", marginBottom: T.space1 }}>
      {children}
    </label>
  );
}

export function FieldShell({ children }: { children: ReactNode }) {
  return (
    <div style={{ backgroundColor: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius: T.radiusMd, padding: `0 ${T.space3}` }}>
      {children}
    </div>
  );
}

export function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <FieldShell>{children}</FieldShell>
    </div>
  );
}

export function FormGrid({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: T.space2 }}>
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   TAB BAR
   ══════════════════════════════════════════════════ */

export function TabBar({ tabs, active, onChange }: { tabs: { id: string; label: string }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div style={{ display: "flex", gap: "0", borderBottom: `1px solid ${T.border}` }}>
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            style={{
              height: "40px",
              padding: `0 ${T.space3}`,
              border: "none",
              borderBottom: isActive ? `2px solid ${T.accent}` : "2px solid transparent",
              background: "transparent",
              color: isActive ? T.heading : T.muted,
              fontSize: T.textMd,
              fontWeight: isActive ? 600 : 400,
              cursor: "pointer",
              transition: "color 0.1s ease",
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SEARCH INPUT
   ══════════════════════════════════════════════════ */

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div style={{ height: T.controlMd, borderRadius: T.radiusMd, border: `1px solid ${T.border}`, backgroundColor: T.surface, display: "flex", alignItems: "center", gap: T.space2, padding: `0 ${T.space3}`, minWidth: "236px" }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.subtle} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Search..."}
        style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: T.heading, fontSize: T.textMd, fontFamily: "var(--font-body)" }}
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════
   INLINE SELECT
   ══════════════════════════════════════════════════ */

export function InlineSelect({ value, onChange, children, style: extraStyle }: { value: string; onChange: (v: string) => void; children: ReactNode; style?: CSSProperties }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        height: T.controlMd,
        borderRadius: T.radiusMd,
        border: `1px solid ${T.border}`,
        backgroundColor: T.surface,
        color: T.heading,
        fontSize: T.textMd,
        fontFamily: "var(--font-body)",
        fontWeight: 600,
        padding: `0 ${T.space6} 0 ${T.space3}`,
        cursor: "pointer",
        appearance: "auto",
        outline: "none",
        ...extraStyle,
      }}
    >
      {children}
    </select>
  );
}

/* ══════════════════════════════════════════════════
   NATIVE SELECT (Radix-based)
   ══════════════════════════════════════════════════ */

const ADMIN_SELECT_EMPTY_VALUE = "__admin-select-empty__";

function flattenSelectLabel(children: ReactNode): string {
  return Children.toArray(children)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") return String(child);
      if (child && typeof child === "object" && "props" in child) return flattenSelectLabel((child as { props?: { children?: ReactNode } }).props?.children);
      return "";
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractSelectOptions(children: ReactNode) {
  return Children.toArray(children).flatMap((child) => {
    if (!child || typeof child !== "object" || !("type" in child) || child.type !== "option") return [];
    const props = (child as { props?: { value?: string | number; children?: ReactNode; disabled?: boolean } }).props ?? {};
    const label = flattenSelectLabel(props.children);
    return [{ value: String(props.value ?? label), label, disabled: props.disabled ?? false }];
  });
}

function encodeAdminSelectValue(value: string) {
  return value === "" ? ADMIN_SELECT_EMPTY_VALUE : value;
}

function decodeAdminSelectValue(value: string) {
  return value === ADMIN_SELECT_EMPTY_VALUE ? "" : value;
}

export function NativeSelectField({
  children,
  containerStyle,
  selectStyle,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  children: ReactNode;
  containerStyle?: CSSProperties;
  selectStyle?: CSSProperties;
}) {
  const { value, onChange, disabled, name, required, id } = props;
  const options = extractSelectOptions(children);
  const currentValue = value == null ? undefined : encodeAdminSelectValue(String(value));

  return (
    <Select
      value={currentValue}
      onValueChange={(nextValue) => {
        const normalizedValue = decodeAdminSelectValue(nextValue);
        onChange?.({ target: { value: normalizedValue }, currentTarget: { value: normalizedValue } } as ChangeEvent<HTMLSelectElement>);
      }}
      disabled={disabled}
      name={name}
      required={required}
    >
      <SelectTrigger
        id={id}
        style={{
          minHeight: T.controlLg,
          height: T.controlLg,
          borderRadius: T.radiusMd,
          borderColor: T.inputBorder,
          background: T.surface,
          padding: `0 ${T.space3}`,
          color: T.heading,
          fontSize: T.textBase,
          fontFamily: "var(--font-body)",
          fontWeight: 600,
          ...selectStyle,
          ...containerStyle,
        }}
        aria-label={props["aria-label"]}
      >
        <SelectValue placeholder="Select an option" />
      </SelectTrigger>
      <SelectContent
        position="popper"
        style={{ width: "var(--radix-select-trigger-width)", minWidth: "var(--radix-select-trigger-width)", borderColor: T.border, background: T.surface }}
      >
        {options.map((option) => (
          <SelectItem key={`${option.value || "empty"}-${option.label}`} value={encodeAdminSelectValue(option.value)} disabled={option.disabled} style={{ color: T.heading, fontSize: T.textSm }}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/* ══════════════════════════════════════════════════
   COHORT SWITCHER
   ══════════════════════════════════════════════════ */

export function CohortSwitcher({ cohorts, selectedCohortId, onSelect }: { cohorts: Cohort[]; selectedCohortId: string; onSelect: (cohortId: string) => void }) {
  const activeCohorts = cohorts.filter((c) => !c.archived);

  return (
    <NativeSelectField value={selectedCohortId} onChange={(e) => onSelect((e as unknown as { target: { value: string } }).target.value)}>
      {activeCohorts.map((c) => (
        <option key={c.id} value={c.id}>{c.name}</option>
      ))}
    </NativeSelectField>
  );
}
