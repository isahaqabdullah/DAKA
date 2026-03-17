import { DriverProgressCard } from "./components/DriverProgressCard";
import { LearningPath } from "./components/LearningPath";
import { DAKAHeader } from "./components/DAKAHeader";
import type { LevelData } from "./components/LevelDetailSheet";
import headerImage from "../public/images/DAKA_Topper_1440x470.jpg";

const HERO_IMAGE = headerImage;

// ─── LEVEL 1 — BEGINNER COURSE ───────────────────────────────────────────────
const level1ThuSessions = [
  { date: "Thu 2 Apr",  track: "Indoor · Clockwise",      task: "Full Daily Maintenance Checklist", isPast: true },
  { date: "Thu 9 Apr",  track: "Indoor · Clockwise",      task: "Wheel Change & Tyre Pressure",     isPast: true },
  { date: "Thu 16 Apr", track: "Indoor · Clockwise",      task: "Brake Pads Check & Refit",         isPast: true },
  { date: "Thu 23 Apr", track: "Indoor · Clockwise",      task: "Spark Plugs & Gapping",            isPast: true },
  { date: "Thu 30 Apr", track: "Indoor · Anti-CW",        task: "Brake Fluid Bleed",                isPast: true },
  { date: "Thu 7 May",  track: "Indoor · Anti-CW",        task: "Carburetor Removal & Refit",       isPast: true },
  { date: "Thu 14 May", track: "Indoor · Clockwise",      task: "Oil Change",                       isPast: true },
  { date: "Thu 21 May", track: "Indoor · Clockwise",      task: "Air Filter Removal & Cleaning",    isPast: true },
  { date: "Thu 28 May", track: "—",                       task: "Eid Al Adha",                      isNoClass: true },
  { date: "Thu 4 Jun",  track: "Indoor · Race Day 🏁",   task: "Rear Sprocket Alignment",          isPast: true },
  { date: "Thu 11 Jun", track: "Outdoor · International", task: "Introduction to Outdoor Track",    isPast: true },
];

const level1WedSessions = [
  { date: "Wed 1 Apr",  track: "Indoor · Clockwise",      task: "Full Daily Maintenance Checklist", isPast: true },
  { date: "Wed 8 Apr",  track: "Indoor · Clockwise",      task: "Wheel Change & Tyre Pressure",     isPast: true },
  { date: "Wed 15 Apr", track: "Indoor · Clockwise",      task: "Brake Pads Check & Refit",         isPast: true },
  { date: "Wed 22 Apr", track: "Indoor · Clockwise",      task: "Spark Plugs & Gapping",            isPast: true },
  { date: "Wed 29 Apr", track: "Indoor · Anti-CW",        task: "Brake Fluid Bleed",                isPast: true },
  { date: "Wed 6 May",  track: "Indoor · Anti-CW",        task: "Carburetor Removal & Refit",       isPast: true },
  { date: "Wed 13 May", track: "Indoor · Clockwise",      task: "Oil Change",                       isPast: true },
  { date: "Wed 20 May", track: "Indoor · Clockwise",      task: "Air Filter Removal & Cleaning",    isPast: true },
  { date: "Wed 27 May", track: "—",                       task: "Eid Al Adha",                      isNoClass: true },
  { date: "Wed 3 Jun",  track: "Indoor · Race Day 🏁",   task: "Rear Sprocket Alignment",          isPast: true },
  { date: "Wed 10 Jun", track: "Outdoor · International", task: "Introduction to Outdoor Track",    isPast: true },
];

// ─── LEVEL 2 — ADVANCED COURSE ───────────────────────────────────────────────
const level2Sessions = [
  { date: "Tue 31 Mar", track: "Outdoor · Cadet",         task: "Carburetor Cleaning",                isPast: true },
  { date: "Tue 7 Apr",  track: "Outdoor · Cadet",         task: "Drive Belt Adjust, Remove, Replace", isPast: true },
  { date: "Tue 14 Apr", track: "Outdoor · Cadet",         task: "Steering Column Removal & Refit",    isPast: true },
  { date: "Tue 21 Apr", track: "Outdoor · Cadet",         task: "Stub Axel & Track Rod Removal",      isPast: true },
  { date: "Tue 28 Apr", track: "Outdoor · National",      task: "Front Wheel Alignment",              isPast: true },
  { date: "Tue 5 May",  track: "Outdoor · National",      task: "Rear Sprocket Refit & Alignment",    isNext: true },
  { date: "Tue 12 May", track: "Outdoor · National",      task: "Exhaust & Inlet Valve Clearance" },
  { date: "Tue 19 May", track: "Outdoor · National",      task: "Exhaust Removal & Refit" },
  { date: "Tue 26 May", track: "—",                       task: "Eid Al Adha / Arafat Day",            isNoClass: true },
  { date: "Tue 2 Jun",  track: "Outdoor · International", task: "Engine Removal" },
  { date: "Tue 9 Jun",  track: "Outdoor · International", task: "Race Day — SWS Format 🏁" },
];

// ─── LEVEL 3 — RACING CLUB ───────────────────────────────────────────────────
const level3Sessions = [
  { date: "Mon 30 Mar", track: "Outdoor International", task: "Checks IAME/Rotax · Sprocket & Chain Tension" },
  { date: "Mon 6 Apr",  track: "Outdoor International", task: "Race / Class Night (timetable by Week 2)" },
  { date: "Mon 13 Apr", track: "Outdoor International", task: "Race / Class Night" },
  { date: "Mon 20 Apr", track: "Outdoor International", task: "Race / Class Night" },
  { date: "Mon 27 Apr", track: "Outdoor International", task: "Starter Motor + Battery · Spark Check" },
  { date: "Mon 4 May",  track: "Outdoor International", task: "Race / Class Night" },
  { date: "Mon 11 May", track: "Outdoor International", task: "Clutch Change · Gear Oil · Radiator Water" },
  { date: "Mon 18 May", track: "Outdoor International", task: "Race / Class Night" },
  { date: "Mon 25 May", track: "—",                     task: "Eid Al Adha",                   isNoClass: true },
  { date: "Mon 1 Jun",  track: "Outdoor International", task: "Full Engine Removal & Installation" },
  { date: "Mon 8 Jun",  track: "Outdoor International", task: "Race / Class Night" },
];

// ─── Level data objects ───────────────────────────────────────────────────────
const LEVELS: LevelData[] = [
  {
    levelNumber: 1,
    levelTitle: "Beginner Course",
    subtitle: "Indoor Kartdrome · Junior Sodi LR4 (7–12) · Senior RX7/RX8 (13+)",
    price: "AED 4,250",
    priceLabel: "per term",
    schedule: "Thu 4:30–6:30pm (starts 2 Apr) · Wed 4:30–6:30pm (starts 1 Apr)",
    groupPrice: "AED 7,225 for two drivers",
    status: "completed",
    totalSessions: 11,
    completedSessions: 11,
    curriculum: [
      {
        title: "Driving Skills",
        items: ["Correct driving position", "Steering technique", "Racing lines & apexes", "Braking points", "CW & Anti-CW circuits", "Safety flags & rules", "Circuit memorisation"],
      },
      {
        title: "Mechanical",
        items: ["Daily maintenance checklist", "Wheel change & tyre pressure", "Brake pads check & refit", "Spark plugs & gapping", "Brake fluid bleed", "Carburetor removal & refit", "Oil change", "Air filter removal & cleaning", "Rear sprocket alignment"],
      },
    ],
    cohorts: [
      { label: "Thursday", sessions: level1ThuSessions },
      { label: "Wednesday", sessions: level1WedSessions },
    ],
    note: "🏆 Final session: Indoor Race Day + Bonus outdoor International track introduction",
  },
  {
    levelNumber: 2,
    levelTitle: "Advanced Course",
    subtitle: "Outdoor Kartdrome · Cadet → National → International",
    price: "AED 4,250",
    priceLabel: "per term",
    schedule: "Tuesdays 4:30–6:30pm · Starts Tue 31 Mar 2026",
    groupPrice: "AED 7,225 for two drivers",
    prerequisite: "Level 1 graduate · OR fast-track: 15+ indoor visits, 150+ laps, sub-33s (coordinator approval only)",
    status: "active",
    totalSessions: 11,
    completedSessions: 5,
    curriculum: [
      {
        title: "Driving Skills",
        items: ["Overtaking through designated corners", "Position defending", "Consistency & smoothness", "Progressive circuit mastery", "Race discipline & awareness"],
      },
      {
        title: "Mechanical",
        items: ["Carburetor cleaning", "Drive belt adjust & replace", "Steering column removal", "Stub axel & track rod", "Front wheel alignment", "Rear sprocket alignment", "Exhaust valve clearance", "Exhaust removal & refit", "Full engine removal"],
      },
    ],
    sessions: level2Sessions,
    note: "🏆 Final session: Race Day in SWS format on International Circuit. Both L1 cohorts merge.",
  },
  {
    levelNumber: 3,
    levelTitle: "Racing Club",
    subtitle: "Outdoor International · 5–6 Lesson nights + 4–5 SWS/Rookie Race Nights",
    price: "AED 4,500",
    priceLabel: "per term",
    schedule: "Mondays · Starts 30 Mar",
    groupPrice: "AED 8,000 for two drivers",
    prerequisite: "Level 2 graduate only. Race nights timetable issued by Week 2.",
    ageGroups: [
      { label: "Juniors", time: "4:30–6:30pm",   ages: "7–12 / 13 yrs" },
      { label: "Seniors", time: "7:30–10:00pm",  ages: "13/14–18 yrs" },
    ],
    status: "locked",
    totalSessions: 11,
    completedSessions: 0,
    curriculum: [
      {
        title: "Driving Skills",
        items: ["Race licence assessment prep", "SWS/Rookie race exposure", "2-stroke IAME/Rotax familiarisation", "Race start procedures", "Racing rules (book provided)"],
      },
      {
        title: "Mechanical",
        items: ["Pre-drive checks IAME/Rotax", "Sprocket change & chain tension", "Starter motor + battery check", "Clutch change & gear oil", "Radiator water change", "Race rules workshop", "Full engine removal & installation"],
      },
    ],
    sessions: level3Sessions,
    note: "⚠ Race nights cannot be replaced or substituted. SWS entries available at extra fee.",
  },
];

export default function App() {
  return (
    <div
      style={{
        backgroundColor: "#0C0C0C",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        fontFamily: "Barlow, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "375px",
          minHeight: "100vh",
          backgroundColor: "#0C0C0C",
          position: "relative",
          paddingBottom: "100px",
        }}
      >
        {/* Hero header */}
        <DAKAHeader heroImageUrl={HERO_IMAGE} />

        {/* Driver progress card */}
        <div style={{ padding: "18px 16px 0" }}>
          <DriverProgressCard
            name="Ahmed Al Karimi"
            level="LEVEL 2"
            levelLabel="Advanced"
            progressPercent={45}
            sessionsCompleted={5}
            totalSessions={11}
            nextSessionDate="5 May"
          />
        </div>

        {/* Section header */}
        <div style={{ padding: "22px 16px 4px", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "3px", height: "18px", backgroundColor: "#C8342E", borderRadius: "2px", flexShrink: 0 }} />
          <p style={{ color: "#FFFFFF", fontSize: "13px", fontFamily: "var(--font-heading)", fontStyle: "italic", fontWeight: 800, letterSpacing: "2.5px", textTransform: "uppercase", margin: 0 }}>
            Your Racing Journey
          </p>
          <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(255,255,255,0.06)" }} />
        </div>

        <p style={{ color: "#3A3A3A", fontSize: "11px", fontFamily: "Barlow, sans-serif", margin: "0 0 8px 0", padding: "0 16px" }}>
          Tap a level to view curriculum &amp; schedule
        </p>

        {/* ── Learning path ── */}
        <div style={{ padding: "0 16px" }}>
          <LearningPath levels={LEVELS} />
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "8px 16px 4px" }}>
          <p style={{ color: "#222222", fontSize: "10px", fontFamily: "Barlow, sans-serif", fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", margin: 0 }}>
            Dubai Autodrome Kartdrome · DAKA
          </p>
        </div>

        {/* Sticky CTA */}
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "100%",
            maxWidth: "375px",
            padding: "10px 16px 28px",
            background: "linear-gradient(to top, #0C0C0C 65%, transparent)",
            pointerEvents: "none",
          }}
        >
          <button
            style={{
              width: "100%",
              height: "52px",
              backgroundColor: "#C8342E",
              color: "#FFFFFF",
              fontSize: "14px",
              fontFamily: "Barlow Condensed, sans-serif",
              fontWeight: 800,
              letterSpacing: "2px",
              textTransform: "uppercase",
              border: "none",
              borderRadius: "12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              pointerEvents: "all",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#A82824"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#C8342E"; }}
          >
            Continue Training — Level 2
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 7h12M8 2l5 5-5 5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
