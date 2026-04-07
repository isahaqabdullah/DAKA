import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface CurriculumSection {
  title: string;
  items: string[];
}

interface CurriculumAccordionProps {
  sections: CurriculumSection[];
}

export function CurriculumAccordion({ sections }: CurriculumAccordionProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggle = (title: string) => {
    setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <p
        style={{
          color: "#5A5A5A",
          fontSize: "9px",
          fontFamily: "var(--font-heading)",
          fontStyle: "normal",
          fontWeight: 900,
          letterSpacing: "0px",
          textTransform: "uppercase",
          margin: "0 0 6px 0",
        }}
      >
        Curriculum
      </p>

      {sections.map((section) => {
        const isOpen = openSections[section.title];
        return (
          <div
            key={section.title}
            style={{
              backgroundColor: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "10px",
              overflow: "hidden",
            }}
          >
            <button
              onClick={() => toggle(section.title)}
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "11px 14px",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  color: "#CCCCCC",
                  fontSize: "13px",
                  fontFamily: "var(--font-heading)",
                  fontStyle: "normal",
                  fontWeight: 900,
                  letterSpacing: "0px",
                }}
              >
                {section.title}
              </span>
              {isOpen ? (
                <ChevronUp size={15} color="#5A5A5A" />
              ) : (
                <ChevronDown size={15} color="#5A5A5A" />
              )}
            </button>

            {isOpen && (
              <div
                style={{
                  padding: "4px 14px 12px 14px",
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {section.items.map((item) => (
                  <div
                    key={item}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "6px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <div
                      style={{
                        width: "3px",
                        height: "3px",
                        borderRadius: "50%",
                        backgroundColor: "#C8342E",
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        color: "#8D8D8D",
                        fontSize: "12px",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
