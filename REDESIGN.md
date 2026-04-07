# DAKA Admin Product Redesign

Senior SaaS Product Design Specification
Version 1.0 — April 2026

---

## A. Product-Level Redesign Direction

### UX Philosophy

This admin tool exists to help a small operations team run a youth racing academy. Every screen must answer one question instantly: **"What do I need to do right now?"**

The design philosophy is **operational clarity** — not dashboarding for the sake of dashboarding. Every pixel must either communicate status, enable an action, or provide navigation. If it does none of those, it gets removed.

Benchmarks for quality: Linear (density + keyboard feel), Vercel Dashboard (typography discipline), Stripe Dashboard (information hierarchy), Plane (operational workflows). We take cues from these, but the result is distinctly DAKA.

### Visual System

**Typography**
- Primary font: `Inter` — body, labels, data, navigation
- No display/serif fonts in the admin. IBM Plex Serif from the SKILL.md design system is reserved for the student-facing product only
- Heading weight: 600 (semibold). Never 800/900 in the admin — that creates visual noise
- Body weight: 400 (regular), 500 (medium for emphasis)
- Type scale (strict): 11px labels / 12px body-small / 13px body / 14px subheading / 16px page title / 20px section KPI values
- Line-height: 1.4 for body, 1.2 for headings, 1 for KPI numbers
- Letter-spacing: 0 everywhere. No expanded tracking on labels — it wastes horizontal space

**Color**
Keep the existing ADMIN_THEME palette — it's warm, professional, and distinct. Refine usage:
- `#16120E` (heading) — page titles, row primary text only
- `#201A15` (text) — body content
- `#6B5F55` (muted) — secondary labels, metadata
- `#918378` (subtle) — tertiary info, placeholder text
- `#C8342E` (accent) — primary actions, active states, alerts requiring attention
- Status colors unchanged: green for present/success, amber for late/warning, red for absent/danger, neutral beige for pending
- Surface hierarchy: `#FFFFFF` for cards/tables → `#F8F4EF` for page background → `#FBF8F4` for soft inset areas

**Borders & Shadows**
- Card borders: `1px solid rgba(43,31,22,0.08)` — lighter than current
- Table row dividers: `1px solid rgba(43,31,22,0.04)` — barely visible, just enough to guide the eye
- Card shadow: `0 1px 3px rgba(70,46,25,0.04)` — much subtler than current `shadow`. The current shadows are too dramatic for a data tool
- No `shadowStrong` usage anywhere in the admin. Remove it
- Border-radius: 8px for cards, 6px for inputs/buttons, 4px for chips/badges, 2px for table cells. The current 16px radius on cards is too soft — tighten everything

### Spacing Density Rules

The current UI has too much padding. Every container adds 14-28px of internal padding, which compounds into massive whitespace. New rules:

- Page-level horizontal padding: 0 (the sidebar + content grid handles this)
- Card internal padding: 12px
- Table cell padding: 8px 12px
- Form field spacing: 8px gap between fields
- Section gap (between cards/blocks on a page): 12px
- Filter bar height: 36px
- Button height: 32px (default), 28px (compact/table), 36px (primary page action)
- Input height: 32px
- Never more than 12px between a section title and its content
- Never more than 16px between page title and first content block

### Page Structure Rules

Every admin page follows this exact structure:

```
┌─────────────────────────────────────────────┐
│ Page Header Bar (sticky)                     │
│ [Page Title]  [Cohort Filter]  [Primary CTA] │
├─────────────────────────────────────────────┤
│ Filter/Tab Bar (if applicable)               │
├─────────────────────────────────────────────┤
│ KPI Strip (if applicable) — max 4 metrics    │
├─────────────────────────────────────────────┤
│ Main Content Area                            │
│ (table, card grid, or form)                  │
└─────────────────────────────────────────────┘
```

Rules:
- Page header is always a single row: title left, filters/actions right. Never a hero block.
- KPI strips are horizontal, compact (48px tall max), and only present when they add value
- The main content area is always ONE primary pattern — either a table OR a card grid OR a form. Never mix patterns in the same viewport
- No "section title" cards that just add nesting. Flat hierarchy wherever possible
- No eyebrow labels above titles. The page title is enough context
- Remove all `SectionTitle` components with eyebrow + title + detail. Replace with a single 14-16px semibold line

### Component Behavior Rules

- **Cohort switcher**: Always appears in the page header bar as a select/dropdown. It is a filter, not a section. It must look and behave like a filter control (compact, inline, with clear selected state). Never a "card-based" switcher
- **Status chips**: Always pill-shaped, always show a colored dot + text. Size: 24px height, 11px text. No icons inside chips
- **Action buttons**: Primary = filled accent. Secondary = ghost with border. Destructive = ghost with red text. All 32px height
- **Tables**: Default pattern for any list > 3 items. Rows are 40px height. Header row is 36px, uppercase 10px labels. Hover state on rows. Row actions appear on hover (not always visible)
- **Forms**: Always in a side drawer (right-aligned, 420px wide) or inline within a table. Never a dedicated page for a single form
- **Empty states**: Centered icon (24px, muted), single sentence, one CTA button. Total height under 160px

---

## B. Information Architecture

### Sidebar Navigation (Confirmed)

The grouped sidebar structure is correct. One refinement: add a **status indicator** to Attendance and Announcements nav items so the operator can see at a glance if there's work to do.

```
┌─────────────────────────┐
│ D  DAKA Admin           │
│    Control Desk          │
├─────────────────────────┤
│ OPERATIONS               │
│  ● Dashboard             │
│  ● Attendance      [3]   │  ← badge = sessions needing attendance
│  ● Schedule              │
├─────────────────────────┤
│ MANAGEMENT               │
│  ● Cohorts               │
│  ● Students              │
├─────────────────────────┤
│ INSIGHTS                 │
│  ● Reports               │
│  ● Announcements   [2]   │  ← badge = active announcements
└─────────────────────────┘
```

Changes:
- Remove the sub-navigation for cohort-specific views (cohort dashboard is now the Dashboard itself, filtered by cohort)
- Attendance is a full dedicated screen, not a sub-view
- "Website Reports" and "Cohort Reports" merge into a single "Reports" screen with a tab switcher
- Announcements becomes a dedicated screen (not just a composer overlay)

### Primary Workflow Paths

**Path 1: Daily attendance** (most frequent)
Sidebar → Attendance → [cohort auto-selected or filtered] → select session → mark students → save/submit

**Path 2: Check cohort status** (morning glance)
Sidebar → Dashboard → [cohort selected] → see KPIs + upcoming sessions + recent activity

**Path 3: Schedule a session**
Sidebar → Schedule → [cohort selected] → click "Add Session" → fill drawer form → save

**Path 4: Review student progress**
Sidebar → Reports → [cohort selected] → [student selected or "All"] → view/edit weekly grades

**Path 5: Send announcement**
Sidebar → Announcements → click "New Announcement" → select target cohorts → compose → send

**Path 6: Manage roster**
Sidebar → Students → [cohort filter or "All"] → view table → click row to edit → save in drawer

### Where Things Live

| Element | Location |
|---|---|
| Cohort filter | Page header bar (top-right area of every page) |
| Quick actions | Page header bar (rightmost, primary CTA) |
| Status summaries | KPI strip below page header |
| Filters (status, date, search) | Filter bar below KPI strip |
| Bulk actions | Sticky bottom bar (appears when rows are selected) |
| Form editing | Right-side drawer (420px) |

---

## C. Screen-by-Screen Redesign

### 1. Dashboard

**Primary job**: Give the admin a fast status overview of the selected cohort and surface anything that needs attention.

**Layout**:
```
Page Header:  "Dashboard"  |  [Cohort: Junior Cohort ▾]
─────────────────────────────────────────────────────
KPI Strip (4 cards, horizontal):
 [Active Students: 8]  [Attendance Rate: 87%]  [Pending Sessions: 3]  [Reports Due: 2]
─────────────────────────────────────────────────────
Two-column layout (60/40):

LEFT: Upcoming Sessions (table)
  Date/Time | Topic | Track | Status Chip | Action
  ─────────────────────────────────────────────
  Thu Apr 3, 4:30pm | Braking points | Indoor CW | ⚠ Needs Attendance | [Open]
  Thu Apr 10, 4:30pm | Steering reset | Indoor CW | — Not Started | —

RIGHT: Activity Feed (compact list)
  • Report filed: Ahmed – Week 02, Grade B — 2h ago
  • Attendance submitted: Session Apr 3 — yesterday
  • Announcement posted: "Track change notice" — 3d ago
```

**What to remove**:
- The current oversized "Manage Attendance By Session" hero block with eyebrow/title/detail
- The nested card-within-card pattern for sessions
- The separate landing page (merge into Dashboard)
- Announcement side panel on the landing page — move to Announcements screen

**Filters**: Cohort switcher only. No additional filters needed — this is a glance screen.

**Cards vs Tables**: KPI = cards (horizontal strip). Sessions = table. Activity = compact list (no cards).

**Sticky elements**: Page header with cohort switcher stays sticky on scroll.

---

### 2. Attendance

**Primary job**: Mark attendance for a specific session, with clear workflow state visibility.

**Layout**:
```
Page Header:  "Attendance"  |  [Cohort: Junior Cohort ▾]  |  [Session: Thu Apr 3 ▾]
─────────────────────────────────────────────────────
Workflow Status Bar:
  ● Needs Attendance → ○ Saved Draft → ○ Submitted
  [Save Draft]  [Submit Attendance]          Marked: 6/8
─────────────────────────────────────────────────────
Filter Bar:  [All ▾]  [Search student...]
─────────────────────────────────────────────────────
Student Table:
  # | Student Name | Status Toggle [P] [L] [A] | Marked At
  ──────────────────────────────────────────────────────
  1 | Ahmed Al-Rashid    | [●P] [ L] [ A] | —
  2 | Omar Hassan        | [ P] [ L] [●A] | 2 min ago
  3 | Fatima Khalil      | [ P] [●L] [ A] | 2 min ago
  4 | Sara Mahmoud       | [ P] [ L] [ A] | pending
  ...
```

**Critical changes**:
- **Cohort switcher must be an explicit filter** — a standard select dropdown in the page header, not a card-based switcher. Label it clearly: "Cohort:"
- **Session switcher** — second dropdown in the page header. Shows date + topic. Sorted chronologically with upcoming first
- **Workflow status bar** — a horizontal stepper showing the 3 states: Needs Attendance → Saved Draft → Submitted. The current state is highlighted. This replaces the vague badge system
- **Status toggles** — each student row has 3 toggle buttons: P / L / A. Clicking one sets it. Already-set button is filled with its status color. Unset buttons are ghost/muted
- **Sticky action bar** — Save Draft and Submit stay visible at all times, either in the workflow bar (if above fold) or as a sticky bottom bar on scroll
- **Progress indicator** — "Marked: 6/8" shown inline with the action buttons

**Filters**: Status filter dropdown (All / Present / Late / Absent / Pending) + text search for student name.

**What to remove**:
- The back arrow / breadcrumb navigation at the top — the sidebar handles this
- The oversized session detail card at the top of the current attendance page
- Any attendance summary cards — the workflow bar replaces them

**Actions**: Save Draft (secondary button), Submit Attendance (primary button, accent color). Submit should trigger a confirmation ("Submit attendance for 8 students?").

---

### 3. Schedule

**Primary job**: View and manage the session calendar for a cohort. Schedule new sessions. View syllabus progression.

**Layout**:
```
Page Header:  "Schedule"  |  [Cohort: Junior Cohort ▾]  |  [+ Add Session]
─────────────────────────────────────────────────────
Tab Bar:  [Sessions]  [Syllabus]
─────────────────────────────────────────────────────
(Sessions tab active):
Session Table:
  Date | Time | Topic | Track | Coach | Attendance Status
  ──────────────────────────────────────────────────────
  Apr 3  | 4:30pm | Braking points    | Indoor CW | Coach K | ✓ Submitted
  Apr 10 | 4:30pm | Steering reset    | Indoor CW | Coach K | ● Saved Draft
  Apr 17 | 4:30pm | —                 | Indoor CW | Coach K | ○ Not Started
  ...

(Syllabus tab active):
Syllabus Table:
  Week | Topic | Objective | Status
  ──────────────────────────────────────────────────────
  Week 01 | Kart control basics    | Build posture, braking... | ✓ Complete
  Week 02 | Tyre and wheel workshop| Hands-on wheel change...  | ● Live
  Week 03 | Track map memorisation | Learn racing lines...     | ○ Planned
```

**Key changes**:
- Merge the current "Teaching Operations" page into this unified Schedule screen
- Two tabs: Sessions (the actual calendar of classes) and Syllabus (the curriculum plan)
- "Add Session" opens a right-side drawer with the form (date, time, track, coach, topic)
- "Add Syllabus Week" also opens a drawer
- Session rows show attendance status as a chip so the admin can see gaps without switching to the Attendance screen
- Clicking a session row opens a detail drawer (not a new page)

**Filters**: Cohort switcher. Optional date range filter for sessions tab.

---

### 4. Cohorts

**Primary job**: View all cohorts, create new cohorts, edit cohort settings.

**Layout**:
```
Page Header:  "Cohorts"  |  [+ New Cohort]
─────────────────────────────────────────────────────
Cohort Table:
  Name | Program | Coach | Cadence | Students | Fill Rate | Status
  ──────────────────────────────────────────────────────
  Junior Cohort    | Beginner  | Coach Kareem | Weekly Thu | 8/10 | 80% | Active
  Advanced Cohort  | Advanced  | Coach Kareem | Weekly Wed | 5/10 | 50% | Active
  Racing Club      | Racing    | Coach Saeed  | Bi-weekly  | 3/8  | 38% | Active

  [Row hover] → [Edit] [Archive]
```

**Key changes**:
- This is a table, not a card grid. Cohorts are data — treat them as rows
- "New Cohort" opens a drawer form
- Clicking a cohort name navigates to the Dashboard filtered to that cohort
- Row actions on hover: Edit (drawer), Archive (confirmation dialog)
- Remove the current card-based cohort management layout
- Fill rate is a simple fraction + percentage, no progress bars

**Filters**: Status filter (Active / Archived / All). Search by name.

---

### 5. Students

**Primary job**: View and manage all students across cohorts or within a specific cohort.

**Layout**:
```
Page Header:  "Students"  |  [Cohort: All Cohorts ▾]  |  [+ Add Student]
─────────────────────────────────────────────────────
Filter Bar:  [Status: Active ▾]  [Pace: All ▾]  [Search...]
─────────────────────────────────────────────────────
Student Table:
  Name | Age | Cohort | Pace | Attendance | Reports | Status
  ──────────────────────────────────────────────────────
  Ahmed Al-Rashid  | 12 | Junior Cohort  | Steady     | 9/11 · 82% | 3 | Active
  Omar Hassan      | 14 | Advanced       | Fast Track | 7/8 · 88%  | 2 | Active
  Fatima Khalil    | 11 | Junior Cohort  | Needs Sup. | 8/11 · 73% | 3 | Active
  Sara Mahmoud     | 13 | —              | Steady     | —           | 0 | Unassigned

  [Row hover] → [View Profile] [Edit] [Move Cohort]
```

**Key changes**:
- Unified student table across all cohorts (with cohort filter)
- "All Cohorts" option in the cohort filter includes unassigned students
- Attendance shown as fraction + percentage inline — no separate column for each
- Pace shown as a colored chip (green = Fast Track, amber = Needs Support, neutral = Steady)
- Clicking a student name opens a profile drawer: personal info, guardian info, medical notes, attendance history, report history
- "Add Student" opens a drawer form with cohort assignment field
- "Move Cohort" action for reassigning students

**Filters**: Cohort (with "All" and "Unassigned" options), Status (Active/Withdrawn), Pace, text search.

---

### 6. Reports

**Primary job**: View student progress reports, file weekly grades, and see cohort-wide analytics.

**Layout**:
```
Page Header:  "Reports"  |  [Cohort: Junior Cohort ▾]
─────────────────────────────────────────────────────
Tab Bar:  [Weekly Reports]  [Analytics]
─────────────────────────────────────────────────────
(Weekly Reports tab):
Sub-filter:  [Week: Week 02 ▾]  [Student: All ▾]
─────────────────────────────────────────────────────
Report Grid (spreadsheet-style):
  Student | Grade | Remark | Last Updated
  ──────────────────────────────────────────────────
  Ahmed Al-Rashid  | [B ▾] | [Great improvement in...] | Apr 2
  Omar Hassan      | [A ▾] | [Consistently strong...]   | Apr 2
  Fatima Khalil    | [— ▾] | [                       ]  | —
  ...
  ─────────────────────────────────────────────────
  [Save All]

(Analytics tab):
KPI Strip:  [Avg Attendance: 84%]  [Report Coverage: 75%]  [Grade Distribution: A:3 B:4 C:1]
─────────────────────────────────────────────────────
Attention List (table):
  Student | Attendance | Latest Grade | Flag
  ──────────────────────────────────────────────────
  Fatima Khalil | 73% | C | ⚠ Needs Support
  ...
```

**Key changes**:
- Merge "Cohort Reports" and "Website Reports" into one Reports screen with tabs
- Weekly Reports tab: inline editable grid — grade dropdown + remark text field per student per week. This is the fastest way to file reports (no modal per student)
- Analytics tab: replaces the current Website Reports page. Shows attention-needing students, grade distribution, attendance trends
- "Save All" button saves all edited grades/remarks in one action (sticky bottom bar)

**What to remove**:
- Per-student report filing modals — replace with inline editing
- The complex analytics card layout — simplify to KPI strip + attention table

---

### 7. Announcements

**Primary job**: Compose, view, and manage announcements across cohorts.

**Layout**:
```
Page Header:  "Announcements"  |  [+ New Announcement]
─────────────────────────────────────────────────────
Filter Bar:  [Cohort: All ▾]  [Status: Active ▾]  [Search...]
─────────────────────────────────────────────────────
Announcement Table:
  Title | Target | Created | Expires | Pinned | Status
  ──────────────────────────────────────────────────────
  Track change notice    | Junior Cohort  | Apr 1  | Apr 10 | 📌 | Active
  Schedule update        | All Cohorts    | Mar 28 | —      |    | Active
  Holiday notice         | All Cohorts    | Mar 15 | Mar 20 |    | Expired

  [Row hover] → [Edit] [Pin/Unpin] [Delete]
```

**Key changes**:
- Announcements is now a full screen, not an overlay/composer
- Table-based list of all announcements with clear status
- "New Announcement" opens a right-side drawer: title, message, target cohorts (multi-select checkboxes), expiry date, pin toggle
- Active/Expired status chip on each row
- Remove the inline announcement composer from the current CohortDashboard page

**Filters**: Cohort target filter, Status (Active/Expired/All), text search.

---

## D. Workflow Design

### Taking Attendance

```
1. Navigate: Sidebar → Attendance
2. Filter: Cohort dropdown auto-selects most recent cohort. Session dropdown auto-selects the nearest upcoming session
3. Scan: Workflow bar shows "Needs Attendance" state. Student table loads with all students in "Pending" state
4. Mark: Click P/L/A toggle per student. The toggle fills with color. Counter updates: "Marked: 1/8"
5. Save: Click "Save Draft" → status bar moves to "Saved Draft" state. All marks are persisted
6. Resume later (optional): Return to Attendance → same session → picks up where you left off. Status shows "Saved Draft" with "Resume" context
7. Submit: When all students marked, click "Submit Attendance" → confirmation dialog → status moves to "Submitted" → action buttons disable
```

Total clicks for 8 students: 8 (one per student toggle) + 1 (save/submit) = 9 clicks. No page navigation needed.

### Saving Attendance as Draft

```
1. Mark some students (not all)
2. Click "Save Draft"
3. Status bar updates to "Saved Draft". Timestamp shown: "Saved at 4:35 PM"
4. Safe to navigate away. Data is persisted to localStorage
5. Return later → session auto-loads with saved state
```

### Submitting Attendance

```
1. All students must be marked (enforced — Submit button disabled until 100% marked)
2. Click "Submit Attendance"
3. Confirmation dialog: "Submit attendance for Session Apr 3? This marks it as final."
4. Confirm → status moves to "Submitted"
5. Post-submission: read-only view. "Edit" link available to revert to draft if needed
```

### Reviewing Cohort Performance

```
1. Sidebar → Reports → Analytics tab
2. Cohort filter → select cohort
3. KPI strip shows: avg attendance, report coverage, grade distribution
4. Attention table highlights students needing support (low attendance, poor grades, missing reports)
5. Click student name → opens profile drawer with full history
```

### Managing Students

```
1. Sidebar → Students
2. Cohort filter → select cohort (or "All")
3. Scan table for student
4. Click row → profile drawer opens with all info
5. Edit fields inline in drawer → Save
6. To add: click "+ Add Student" → blank drawer form → fill → Save
7. To reassign: row action "Move Cohort" → select new cohort → Confirm
```

### Scheduling Sessions

```
1. Sidebar → Schedule → Sessions tab
2. Cohort filter → select cohort
3. Click "+ Add Session"
4. Drawer opens: date (pre-filled +7 days from last), time, track, coach, topic
5. Fill topic → Save
6. New session appears in table
```

### Sending Announcements

```
1. Sidebar → Announcements
2. Click "+ New Announcement"
3. Drawer opens: title, message, target cohorts (checkboxes), expiry date, pin toggle
4. Select targets → write message → Save
5. Announcement appears in table as "Active"
```

---

## E. Component System

### App Header (Top Bar)
- Height: 48px
- Content: Logo left, view switcher (Admin/Student/Mobile) right
- Background: white with subtle bottom border
- Sticky at top, z-index 50
- The view switcher is a segmented control, 32px height, rounded

### Page Header
- Height: 44px
- Content: Page title (16px, semibold) left. Filters + primary CTA right
- No background — it's just a flex row at the top of the content area
- Sticky below the app header on scroll (offset: 60px)

### Section Header
- A single line: 13px semibold text, muted color
- 8px margin below
- No eyebrow, no subtitle, no divider line. Just text

### Filter Bar
- Height: 36px
- Horizontal row of filter controls: dropdowns (32px height), search input (32px height)
- Separated from page header by 8px gap
- Each filter is a compact select with label inside: "Status: Active"
- Search input has a magnifying glass icon inside, no border until focused

### Status Chip System
Standardized across all screens:

| Status | Dot Color | Text | Background |
|---|---|---|---|
| Active | `#247A44` | "Active" | `rgba(34,197,94,0.10)` |
| Present | `#247A44` | "Present" | `rgba(34,197,94,0.10)` |
| Submitted | `#247A44` | "Submitted" | `rgba(34,197,94,0.10)` |
| Complete | `#247A44` | "Complete" | `rgba(34,197,94,0.10)` |
| Late | `#9D6100` | "Late" | `rgba(245,158,11,0.12)` |
| Saved Draft | `#9D6100` | "Saved Draft" | `rgba(245,158,11,0.12)` |
| Live | `#9D6100` | "Live" | `rgba(245,158,11,0.12)` |
| Needs Support | `#9D6100` | "Needs Support" | `rgba(245,158,11,0.12)` |
| Absent | `#B6332C` | "Absent" | `rgba(200,52,46,0.10)` |
| Withdrawn | `#B6332C` | "Withdrawn" | `rgba(200,52,46,0.10)` |
| Pending | `#7E7063` | "Pending" | `#F3EEE8` |
| Planned | `#7E7063` | "Planned" | `#F3EEE8` |
| Not Started | `#7E7063` | "Not Started" | `#F3EEE8` |
| Expired | `#7E7063` | "Expired" | `#F3EEE8` |

Chip anatomy: 4px colored dot + 4px gap + text. Height 24px. Padding 4px 8px. Border-radius 4px. Font: 11px, weight 500.

### KPI Cards
- Used in horizontal strips only (max 4 per row)
- Anatomy: label (11px, muted, uppercase) on top, value (20px, semibold, heading color) below, optional delta/note (11px, muted) below that
- Height: ~64px including padding
- Background: white card with standard border
- No icons, no gradient backgrounds, no heavy shadows

### Tables
The default pattern for lists. Anatomy:

- **Header row**: 36px height. Background: `#F8F4EF`. Text: 10px, uppercase, 600 weight, muted color. Sticky if table scrolls
- **Data rows**: 40px height. Background: alternating white / `#FCFAF7` (very subtle). Border-bottom: `1px solid rgba(43,31,22,0.04)`
- **Row hover**: background shifts to `rgba(200,52,46,0.03)` — barely visible warm tint
- **Row actions**: appear on hover at the right edge. Small ghost buttons (28px height): Edit, Delete, etc.
- **Selected row**: left border accent (`3px solid #C8342E`), slightly elevated background
- **Empty table**: centered empty state component (see below)
- **Cell alignment**: text left, numbers right, status chips center
- **Sortable columns**: header text + subtle chevron icon. Active sort shows filled chevron

### Row Actions
- Appear on hover (hidden by default to reduce clutter)
- Small ghost buttons: icon + label, 28px height
- Max 2-3 visible actions per row. Overflow goes into a "..." menu
- Destructive actions (Delete, Archive) are always in the overflow menu, never primary

### Empty States
- Container: centered, max-width 280px
- Icon: 24px, muted color, related to the content type
- Title: 14px, semibold, heading color. One line
- Description: 12px, muted. One sentence max
- CTA: One primary button (32px height)
- Total component height: ~140px
- Example: 📋 "No sessions scheduled" / "Create your first session to get started." / [+ Add Session]

### Drawers (Side Panels)
- Width: 420px
- Slides in from the right edge
- Overlay: `rgba(22,18,14,0.3)` backdrop
- Header: title (16px semibold) + close X button. 48px height
- Content: scrollable, 16px padding
- Footer: sticky at bottom, 12px padding, contains Save/Cancel buttons
- Forms inside drawers use the standard field system: label above, input below, 8px gap

### Modals (Confirmation Dialogs)
- Width: 380px, centered
- For confirmations only — never for forms (use drawers for forms)
- Anatomy: title + description + two buttons (Cancel secondary, Confirm primary)
- Destructive confirmations: Confirm button uses red/danger style

### Tabs
- Height: 36px
- Underline style: active tab has a 2px bottom border in accent color
- Text: 13px, semibold when active, regular when inactive
- Muted color when inactive, heading color when active
- No background change, no pill/card style tabs
- Used for: Schedule (Sessions/Syllabus), Reports (Weekly/Analytics)

### Sticky Action Bars
- Appears at the bottom of the viewport when there are unsaved changes
- Height: 52px
- Background: white, top border, subtle shadow upward
- Content: status text left ("3 unsaved changes"), action buttons right
- Used in: Attendance (Save/Submit), Reports weekly grid (Save All)

### Search
- Input: 32px height, ghost border (only visible on focus), search icon inside left
- Placeholder: "Search students...", "Search announcements..."
- Filters results in real-time as you type
- Position: always in the filter bar, never floating or in a separate row

### Sort
- Column headers are clickable for sort
- Active sort column shows a filled arrow (▲ or ▼)
- Default sort: chronological for sessions, alphabetical for students, newest-first for announcements/reports

---

## F. Final Recommendation

### The Single Best Direction

**Build a flat, table-driven admin tool with drawer-based editing.**

Every screen is a table (or table-like grid). Every edit action opens a drawer. Every filter is inline in the page header. Every status is a chip. Every page follows the same header → filter → content structure.

This is the fastest, most learnable pattern for a small team running daily operations. It eliminates:
- Page-to-page navigation for simple edits (drawers keep you in context)
- Visual hierarchy confusion (flat structure, one pattern per page)
- Workflow ambiguity (the status bar on Attendance makes the 3-step process explicit)
- Wasted space (compact tables, tight spacing, no hero blocks)

### Implementation Priority

1. **Attendance screen** — highest daily frequency, biggest UX pain point. Implement first with the workflow bar, session filter, and status toggles
2. **Page header + filter bar pattern** — establish the shared layout. Once this works, every page inherits it
3. **Drawer component** — single reusable drawer for all editing (students, sessions, cohorts, announcements, reports)
4. **Dashboard** — rebuild as KPI strip + session table + activity feed
5. **Students** — unified cross-cohort table with filters
6. **Schedule** — tabbed table (sessions + syllabus)
7. **Reports** — inline editable grid for weekly reports + analytics tab
8. **Cohorts** — simple table with drawer editing
9. **Announcements** — table with drawer composer

### What Gets Deleted

- `AdminLandingPage.tsx` — merged into Dashboard
- `SectionTitle` component with eyebrow pattern — replaced by simple text headers
- All `nestedCardStyle` usage — no more cards-within-cards
- `shadowStrong` — never used in the admin
- Hero/splash blocks at the top of any page
- Card-based cohort switcher — replaced by dropdown filter
- Inline announcement composer overlay — replaced by Announcements screen + drawer
- Per-student report modals — replaced by inline grid editing

### Design System Alignment

This redesign aligns with the SKILL.md "Modern" design system in spirit:
- Clean, minimal, editorial tone
- Semantic tokens for status colors
- Consistent spacing rhythm (4/8/12/16/24/32 scale)
- WCAG 2.2 AA compliance (all status chip colors pass contrast on their backgrounds)
- Keyboard-accessible tables, drawers, and form controls

The one intentional deviation: **we use Inter, not IBM Plex Serif, for the admin**. Serif typography signals editorial/consumer — the admin is an operations tool and needs the density and neutrality of a sans-serif system font. IBM Plex Serif remains the student-facing brand font.

---

*This document is the implementation blueprint. Every screen, component, and workflow is defined. Build exactly this.*
