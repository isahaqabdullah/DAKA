import type { Cohort, ScheduledClass, SyllabusItem } from "./types";

/* ══════════════════════════════════════════════════
   SESSION FACTORIES
   ══════════════════════════════════════════════════ */

function seedSession(id: string, date: string, track: string, coach: string, topic: string): ScheduledClass {
  return { id, date, time: "16:30", track, coach, topic };
}

export function createPdfJuniorThursdayClasses(coach: string): ScheduledClass[] {
  return [
    seedSession("junior-class-1", "2026-04-02", "Indoor Clockwise", coach, "Full Daily Maintenance Checklist"),
    seedSession("junior-class-2", "2026-04-09", "Indoor Clockwise", coach, "Wheel Change & Tyre Pressure"),
    seedSession("junior-class-3", "2026-04-16", "Indoor Clockwise", coach, "Brake Pads Check & Refit"),
    seedSession("junior-class-4", "2026-04-23", "Indoor Clockwise", coach, "Spark Plugs & Gapping"),
    seedSession("junior-class-5", "2026-04-30", "Indoor Anti-CW", coach, "Brake Fluid Bleed"),
    seedSession("junior-class-6", "2026-05-07", "Indoor Anti-CW", coach, "Carburetor Removal & Refit"),
    seedSession("junior-class-7", "2026-05-14", "Indoor Clockwise", coach, "Oil Change"),
    seedSession("junior-class-8", "2026-05-21", "Indoor Clockwise", coach, "Air Filter Removal & Cleaning"),
    seedSession("junior-class-9", "2026-06-04", "Indoor Race Day", coach, "Rear Sprocket Alignment"),
    seedSession("junior-class-10", "2026-06-11", "Outdoor International", coach, "Introduction to Outdoor Track"),
  ];
}

export function createPdfAdvancedTuesdayClasses(coach: string): ScheduledClass[] {
  return [
    seedSession("advanced-class-1", "2026-03-31", "Outdoor Cadet", coach, "Carburetor Cleaning"),
    seedSession("advanced-class-2", "2026-04-07", "Outdoor Cadet", coach, "Drive Belt Adjust, Remove, Replace"),
    seedSession("advanced-class-3", "2026-04-14", "Outdoor Cadet", coach, "Steering Column Removal & Refit"),
    seedSession("advanced-class-4", "2026-04-21", "Outdoor Cadet", coach, "Stub Axel & Track Rod Removal"),
    seedSession("advanced-class-5", "2026-04-28", "Outdoor National", coach, "Front Wheel Alignment"),
    seedSession("advanced-class-6", "2026-05-05", "Outdoor National", coach, "Rear Sprocket Refit & Alignment"),
    seedSession("advanced-class-7", "2026-05-12", "Outdoor National", coach, "Exhaust & Inlet Valve Clearance"),
    seedSession("advanced-class-8", "2026-05-19", "Outdoor National", coach, "Exhaust Removal & Refit"),
    seedSession("advanced-class-9", "2026-06-02", "Outdoor International", coach, "Engine Removal"),
    seedSession("advanced-class-10", "2026-06-09", "Outdoor International", coach, "Race Day — SWS Format"),
  ];
}

/* ══════════════════════════════════════════════════
   SYLLABUS FACTORIES
   ══════════════════════════════════════════════════ */

export function createPdfJuniorThursdaySyllabus(): SyllabusItem[] {
  return [
    { id: "junior-syllabus-1", weekLabel: "Week 01", title: "Introduction to karting", objective: "Learn correct driving position, steering technique, and the full daily maintenance checklist on the Indoor Clockwise layout.", status: "complete" },
    { id: "junior-syllabus-2", weekLabel: "Week 02", title: "Wheel change and tyre pressure", objective: "Build braking-point awareness while practicing safe wheel changes and tyre-pressure checks.", status: "live" },
    { id: "junior-syllabus-3", weekLabel: "Week 03", title: "Brake pads workshop", objective: "Reinforce racing lines and complete a full brake pads check and refit routine.", status: "planned" },
    { id: "junior-syllabus-4", weekLabel: "Week 04", title: "Spark plug basics", objective: "Improve apex consistency and learn spark plug inspection and gapping.", status: "planned" },
    { id: "junior-syllabus-5", weekLabel: "Week 05", title: "Anti-clockwise brake control", objective: "Adapt to the Indoor Anti-CW layout and complete a brake fluid bleed safely.", status: "planned" },
    { id: "junior-syllabus-6", weekLabel: "Week 06", title: "Carburetor removal and refit", objective: "Grow workshop confidence while linking track-map recall to clean mechanical sequencing.", status: "planned" },
    { id: "junior-syllabus-7", weekLabel: "Week 07", title: "Oil change routine", objective: "Repeat lap routines confidently and carry out a clean oil-change process.", status: "planned" },
    { id: "junior-syllabus-8", weekLabel: "Week 08", title: "Air filter care", objective: "Use pace awareness and line memory while removing and cleaning the air filter.", status: "planned" },
    { id: "junior-syllabus-9", weekLabel: "Week 09", title: "Indoor race day", objective: "Apply race-day awareness on the indoor circuit and complete rear sprocket alignment.", status: "planned" },
    { id: "junior-syllabus-10", weekLabel: "Week 10", title: "Outdoor track introduction", objective: "Transfer indoor habits to the Outdoor International layout with a calm first-lap orientation.", status: "planned" },
  ];
}

export function createPdfAdvancedTuesdaySyllabus(): SyllabusItem[] {
  return [
    { id: "advanced-syllabus-1", weekLabel: "Week 01", title: "Cadet mechanical foundation", objective: "Clean the carburetor and establish overtaking, consistency, and race discipline on the Outdoor Cadet layout.", status: "complete" },
    { id: "advanced-syllabus-2", weekLabel: "Week 02", title: "Drive belt service", objective: "Adjust, remove, and replace the drive belt while sharpening defensive positioning on Cadet.", status: "live" },
    { id: "advanced-syllabus-3", weekLabel: "Week 03", title: "Steering column service", objective: "Remove and refit the steering column while strengthening braking-map recall and workshop control.", status: "planned" },
    { id: "advanced-syllabus-4", weekLabel: "Week 04", title: "Stub axle and track rod removal", objective: "Build repeatable fast lines on the Cadet layout while handling precision front-end work.", status: "planned" },
    { id: "advanced-syllabus-5", weekLabel: "Week 05", title: "National circuit alignment", objective: "Move to Outdoor National and complete front wheel alignment with better recovery-line choices.", status: "planned" },
    { id: "advanced-syllabus-6", weekLabel: "Week 06", title: "Rear sprocket refit and alignment", objective: "Improve national-circuit consistency while refitting, aligning, and cleaning the rear sprocket.", status: "planned" },
    { id: "advanced-syllabus-7", weekLabel: "Week 07", title: "Valve clearance", objective: "Work through exhaust and inlet valve clearance with stronger race-discipline awareness.", status: "planned" },
    { id: "advanced-syllabus-8", weekLabel: "Week 08", title: "Exhaust removal and refit", objective: "Adapt line choice under pressure and complete a clean exhaust removal and refit.", status: "planned" },
    { id: "advanced-syllabus-9", weekLabel: "Week 09", title: "International engine removal", objective: "Progress onto Outdoor International and prepare for engine removal with focused start procedure work.", status: "planned" },
    { id: "advanced-syllabus-10", weekLabel: "Week 10", title: "International race day", objective: "Execute a race-day simulation in SWS format on the International circuit after full term progression.", status: "planned" },
  ];
}

/* ══════════════════════════════════════════════════
   INITIAL COHORT DATA
   ══════════════════════════════════════════════════ */

export function createInitialCohorts(): Cohort[] {
  const juniorClass1 = "junior-class-1";
  const juniorClass2 = "junior-class-2";
  const juniorClass3 = "junior-class-3";
  const advancedClass1 = "advanced-class-1";
  const advancedClass2 = "advanced-class-2";
  const advancedClass3 = "advanced-class-3";

  return [
    {
      id: "junior-thursday",
      name: "Juniors · Thursday",
      year: "2026",
      program: "Beginner Course (Level One)",
      coach: "Coach Kareem",
      cadence: "Thursday · 4:30 PM to 6:30 PM · Starts 2 Apr 2026",
      capacity: 10,
      room: "Indoor Kartdrome",
      classes: createPdfJuniorThursdayClasses("Coach Kareem"),
      students: [
        { id: "student-sara", name: "Sara Al Mansoori", age: "10", dateOfBirth: "2016-03-14", gender: "Female", guardian: "Noora Al Mansoori", guardianPhone: "+971 50 123 4567", guardianEmail: "noora.m@email.com", emergencyContact: "Khalid Al Mansoori", emergencyPhone: "+971 55 987 6543", medicalNotes: "Mild asthma — carries inhaler in kit bag.", experience: "6 months indoor karting, 2 rental sessions.", pace: "Fast Track", notes: "Confident through sector two, still braking early into turn four.", attendance: { [juniorClass1]: "present", [juniorClass2]: "pending", [juniorClass3]: "pending" }, enrolledAt: "2026-02-10T09:00:00.000Z" },
        { id: "student-omar", name: "Omar Al Suwaidi", age: "11", dateOfBirth: "2015-07-22", gender: "Male", guardian: "Hamad Al Suwaidi", guardianPhone: "+971 50 234 5678", guardianEmail: "hamad.s@email.com", emergencyContact: "Fatima Al Suwaidi", emergencyPhone: "+971 56 345 6789", experience: "Complete beginner — first structured programme.", pace: "Steady", notes: "Needs reminders on smooth steering inputs.", attendance: { [juniorClass1]: "late", [juniorClass2]: "pending", [juniorClass3]: "pending" }, enrolledAt: "2026-02-10T09:00:00.000Z" },
        { id: "student-mia", name: "Mia Fernandes", age: "9", dateOfBirth: "2017-01-05", gender: "Female", guardian: "Carla Fernandes", guardianPhone: "+971 52 456 7890", guardianEmail: "carla.f@email.com", emergencyContact: "David Fernandes", emergencyPhone: "+971 54 567 8901", medicalNotes: "No known conditions.", experience: "None — first time on track.", pace: "Needs Support", notes: "Focus on braking confidence and exit vision.", attendance: { [juniorClass1]: "present", [juniorClass2]: "pending", [juniorClass3]: "pending" }, enrolledAt: "2026-03-01T09:00:00.000Z" },
      ],
      syllabus: createPdfJuniorThursdaySyllabus(),
      reports: [
        { id: "junior-report-1", studentId: "student-sara", title: "Week 1 progression report", summary: "Sara stayed composed in traffic and consistently hit the first apex without correction.", recommendation: "Push her into a faster reference group next week and add one overtaking drill.", weekLabel: "Week 01", grade: "A", remark: "Sara stayed composed in traffic and consistently hit the first apex without correction.", skillChecks: { "correct-driving-position": true, "steering-technique": true, "racing-line-basics": true, "full-daily-maintenance-checklist": false }, createdAt: "2026-03-21T17:45:00.000Z" },
      ],
      announcements: [
        { id: "junior-announcement-1", title: "Term 3 Thursday schedule", message: "No class on Thu 28 May for Eid Al Adha / Arafat Day. Indoor Race Day follows on Thu 4 Jun, then Outdoor International on Thu 11 Jun.", classId: juniorClass2, createdAt: "2026-03-25T12:00:00.000Z" },
      ],
    },
    {
      id: "advanced-tuesday",
      name: "Advanced · Tuesday",
      year: "2026",
      program: "Advanced Course (Level Two)",
      coach: "Coach Yousuf",
      cadence: "Tuesday · 4:30 PM to 6:30 PM · Starts 31 Mar 2026",
      capacity: 12,
      room: "Outdoor Kartdrome",
      classes: createPdfAdvancedTuesdayClasses("Coach Yousuf"),
      students: [
        { id: "student-ahmed", name: "Ahmed Al Karimi", age: "14", dateOfBirth: "2012-05-18", gender: "Male", guardian: "Rashed Al Karimi", guardianPhone: "+971 50 678 9012", guardianEmail: "rashed.k@email.com", emergencyContact: "Fatima Al Karimi", emergencyPhone: "+971 55 789 0123", experience: "2 years cadet karting, 4 regional podiums.", pace: "Fast Track", notes: "Already ready for national-layout consistency targets.", attendance: { [advancedClass1]: "pending", [advancedClass2]: "pending", [advancedClass3]: "pending" }, enrolledAt: "2025-11-15T09:00:00.000Z" },
        { id: "student-lina", name: "Lina Haddad", age: "15", dateOfBirth: "2011-09-03", gender: "Female", guardian: "Mazen Haddad", guardianPhone: "+971 50 890 1234", guardianEmail: "mazen.h@email.com", emergencyContact: "Hana Haddad", emergencyPhone: "+971 56 901 2345", medicalNotes: "Wears corrective lenses under visor.", experience: "1 year academy training, strong racecraft.", pace: "Steady", notes: "Strong exits, needs cleaner defensive line discipline.", attendance: { [advancedClass1]: "pending", [advancedClass2]: "pending", [advancedClass3]: "pending" }, enrolledAt: "2026-01-08T09:00:00.000Z" },
        { id: "student-zayd", name: "Zayd Khan", age: "13", dateOfBirth: "2013-11-27", gender: "Male", guardian: "Amina Khan", guardianPhone: "+971 52 012 3456", guardianEmail: "amina.k@email.com", emergencyContact: "Tariq Khan", emergencyPhone: "+971 54 123 4567", medicalNotes: "Prone to motion sensitivity — monitor during long stints.", experience: "6 months rental karting, transitioning to owner kart.", pace: "Needs Support", notes: "Confidence drops in high-speed sweepers.", attendance: { [advancedClass1]: "pending", [advancedClass2]: "pending", [advancedClass3]: "pending" }, enrolledAt: "2026-02-20T09:00:00.000Z" },
      ],
      syllabus: createPdfAdvancedTuesdaySyllabus(),
      reports: [],
      announcements: [
        { id: "advanced-announcement-1", title: "Term 3 Tuesday schedule", message: "No class on Tue 26 May for Eid Al Adha / Arafat Day. International work begins on Tue 2 Jun, followed by the SWS-format race day on Tue 9 Jun.", classId: advancedClass2, createdAt: "2026-03-24T11:15:00.000Z" },
      ],
    },
  ];
}
