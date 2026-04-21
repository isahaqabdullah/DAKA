# DAKA API Contracts

## 1. Purpose

This document defines the first production API contract for DAKA.

It is derived from:

- the normalized backend model in [BACKEND_SCHEMA.md](./BACKEND_SCHEMA.md)
- the current admin dashboard prototype workflows

This contract is intentionally opinionated:

- REST over JSON
- canonical backend write model
- student mobile app reads from scoped projections
- camelCase JSON at the API boundary
- snake_case remains a database concern only

## 2. API Style

### Base path

```text
/api/v1
```

### Content type

```http
Content-Type: application/json
Accept: application/json
```

### Authentication

- Bearer access token for authenticated endpoints
- `POST /auth/login` returns access token plus current user context
- refresh flow can be added later, but is not required to start backend implementation

### Authorization

- `coach` users can access admin modules only within assigned scope
- `student` users can access student modules only for their own data
- `coach_profiles.is_platform_admin = true` bypasses cohort scoping for admin endpoints

### JSON naming

- API uses `camelCase`
- UUIDs are strings
- timestamps are ISO 8601 strings in UTC

### Success shape

Single-resource endpoints return the resource directly:

```json
{
  "id": "4a95d811-2f32-4716-bd39-4d6e633a1778"
}
```

List endpoints return:

```json
{
  "items": [],
  "total": 0,
  "nextCursor": null
}
```

### Error shape

All non-2xx responses return:

```json
{
  "error": {
    "code": "attendance_register_incomplete",
    "message": "Attendance cannot be submitted while active students remain unmarked.",
    "details": {
      "sessionId": "2eb685d6-7d38-4518-8e7f-0e7f7d6ece85",
      "unmarkedCount": 2
    },
    "requestId": "067f5cfc-c2be-4ca7-aa46-f65ed0452cb0"
  }
}
```

### Standard status codes

- `200 OK` read or update success
- `201 Created` create success
- `204 No Content` no body success
- `400 Bad Request` malformed input
- `401 Unauthorized` missing or invalid token
- `403 Forbidden` authenticated but outside scope
- `404 Not Found` resource not found in scope
- `409 Conflict` uniqueness or lifecycle conflict
- `422 Unprocessable Entity` valid JSON, invalid business transition

### Idempotency

Use `Idempotency-Key` on side-effecting POST endpoints that create or fan out records:

- `POST /auth/login` optional
- `POST /admin/cohorts`
- `POST /admin/cohorts/:cohortId/sessions`
- `POST /admin/sessions/:sessionId/attendance/submit`
- `POST /admin/cohorts/:cohortId/progress/:syllabusWeekId/publish`
- `POST /admin/announcements`
- `POST /admin/announcements/:announcementId/publish`

## 3. Shared DTOs

## `AuthToken`

```ts
type AuthToken = {
  accessToken: string;
  tokenType: "Bearer";
  expiresAt: string;
};
```

## `Me`

```ts
type Me = {
  userId: string;
  role: "coach" | "student";
  fullName: string;
  email: string | null;
  username: string | null;
  phone: string | null;
  status: "invited" | "active" | "suspended" | "archived";
  coachProfile?: {
    displayName: string | null;
    isPlatformAdmin: boolean;
  };
  studentProfile?: {
    pace: "steady" | "fast_track" | "needs_support" | null;
    dateOfBirth: string | null;
  };
};
```

## `CohortSummary`

```ts
type CohortSummary = {
  cohortId: string;
  slug: string;
  name: string;
  yearLabel: string | null;
  programName: string | null;
  cadenceLabel: string | null;
  capacity: number | null;
  locationName: string | null;
  startsOn: string | null;
  endsOn: string | null;
  archivedAt: string | null;
  leadCoachName: string | null;
  activeStudentCount: number;
  pendingAttendanceSessionCount: number;
  liveAnnouncementCount: number;
};
```

## `EnrollmentSummary`

```ts
type EnrollmentSummary = {
  enrollmentId: string;
  cohortId: string;
  cohortName: string;
  studentUserId: string;
  studentName: string;
  status: "active" | "paused" | "withdrawn" | "completed" | "cancelled";
  enrolledAt: string;
  endedAt: string | null;
  pace: "steady" | "fast_track" | "needs_support" | null;
};
```

## `SessionSummary`

```ts
type SessionSummary = {
  sessionId: string;
  cohortId: string;
  syllabusWeekId: string | null;
  topic: string;
  track: string | null;
  locationName: string | null;
  startsAt: string;
  endsAt: string | null;
  status: "scheduled" | "completed" | "cancelled";
  coachAssignments: Array<{
    coachUserId: string;
    coachName: string;
    role: "lead" | "assistant" | "substitute";
  }>;
  attendanceRegister: {
    workflowStatus: "not_started" | "draft" | "submitted";
    savedAt: string | null;
    submittedAt: string | null;
    visibleToStudentsAt: string | null;
  };
};
```

## `AttendanceRow`

```ts
type AttendanceRow = {
  attendanceRecordId: string;
  enrollmentId: string;
  studentUserId: string;
  studentName: string;
  studentStatus: "active" | "paused" | "withdrawn" | "completed" | "cancelled";
  state: "unmarked" | "present" | "late" | "absent";
  markedAt: string | null;
  note: string | null;
};
```

## `WeeklyProgressRow`

```ts
type WeeklyProgressRow = {
  progressId: string | null;
  enrollmentId: string;
  studentUserId: string;
  studentName: string;
  status: "draft" | "published" | null;
  publishedAt: string | null;
  summary: string | null;
  recommendation: string | null;
  grade: "A" | "B" | "C" | "D" | null;
  coachRemark: string | null;
  checks: Array<{
    syllabusSkillId: string;
    label: string;
    category: string;
    isChecked: boolean;
  }>;
};
```

## `AnnouncementTarget`

```ts
type AnnouncementTarget =
  | { type: "cohort"; cohortId: string; cohortName: string }
  | { type: "session"; sessionId: string; sessionLabel: string }
  | { type: "student"; studentUserId: string; studentName: string };
```

## `Announcement`

```ts
type Announcement = {
  announcementId: string;
  title: string;
  message: string;
  pinned: boolean;
  status: "draft" | "published" | "archived";
  publishedAt: string | null;
  expiresAt: string | null;
  archivedAt: string | null;
  audienceMode: "resolved_targets" | "all_active_cohorts";
  targets: AnnouncementTarget[];
  deliveredStudentCount: number;
  createdAt: string;
  updatedAt: string;
};
```

## `Notification`

```ts
type Notification = {
  notificationId: string;
  type:
    | "attendance_visible"
    | "progress_published"
    | "announcement_published"
    | "session_reminder"
    | "enrollment_changed";
  title: string;
  body: string;
  resourceType: string;
  resourceId: string | null;
  deliveryStatus: "queued" | "sent" | "failed";
  queuedAt: string;
  sentAt: string | null;
  readAt: string | null;
};
```

### Student read conventions

- A student with no active enrollment is still a valid authenticated user state.
- In that state, student read endpoints return `200 OK` with null-safe or empty-state payloads instead of `403` or `404`.
- `GET /api/v1/student/home` and `GET /api/v1/student/schedule` are scoped to the active enrollment only.
- `GET /api/v1/student/attendance`, `GET /api/v1/student/progress`, `GET /api/v1/student/announcements`, and `GET /api/v1/student/notifications` may include visible history across all of the authenticated student's enrollments.

### Student pagination conventions

- All student list endpoints use cursor pagination.
- Supported query parameters are:
  - `limit=<integer>`
  - `cursor=<opaque>`
- `cursor` is opaque to the client.
- Ordering is stable within each endpoint so clients can paginate without duplicate or missing rows.

## 4. Auth Module

## `POST /api/v1/auth/login`

Purpose:
- authenticate coach or student

Request:

```json
{
  "identifier": "coach@daka.app",
  "password": "secret"
}
```

Response `200`:

```json
{
  "token": {
    "accessToken": "jwt",
    "tokenType": "Bearer",
    "expiresAt": "2026-04-08T10:00:00Z"
  },
  "me": {
    "userId": "c2f322b4-72d7-4022-9d20-f7015be6e25a",
    "role": "coach",
    "fullName": "Coach Kareem",
    "email": "coach@daka.app",
    "username": null,
    "phone": null,
    "status": "active",
    "coachProfile": {
      "displayName": "Coach Kareem",
      "isPlatformAdmin": false
    }
  }
}
```

Errors:
- `invalid_credentials`
- `user_suspended`

## `GET /api/v1/me`

Purpose:
- return the authenticated user context used by both admin and student clients

Response `200`:
- `Me`

## 5. Admin Cohorts and Students

## `GET /api/v1/admin/cohorts`

Purpose:
- list cohorts visible to the coach

Query:

- `status=active|archived|all`
- `yearLabel=2026`
- `programName=Beginner Course (Level One)`
- `search=junior`
- `limit=50`
- `cursor=<opaque>`

Response `200`:

```json
{
  "items": [
    {
      "cohortId": "2db19644-e0e5-4c7d-89f7-c32297770836",
      "slug": "junior-thursday",
      "name": "Juniors · Thursday",
      "yearLabel": "2026",
      "programName": "Beginner Course (Level One)",
      "cadenceLabel": "Thursday · 4:30 PM to 6:30 PM",
      "capacity": 10,
      "locationName": "Indoor Kartdrome",
      "startsOn": "2026-04-02",
      "endsOn": null,
      "archivedAt": null,
      "leadCoachName": "Coach Kareem",
      "activeStudentCount": 8,
      "pendingAttendanceSessionCount": 1,
      "liveAnnouncementCount": 2
    }
  ],
  "total": 1,
  "nextCursor": null
}
```

## `POST /api/v1/admin/cohorts`

Purpose:
- create a cohort

Request:

```json
{
  "slug": "junior-thursday",
  "name": "Juniors · Thursday",
  "yearLabel": "2026",
  "programName": "Beginner Course (Level One)",
  "cadenceLabel": "Thursday · 4:30 PM to 6:30 PM · Starts 2 Apr 2026",
  "capacity": 10,
  "locationName": "Indoor Kartdrome",
  "startsOn": "2026-04-02",
  "leadCoachUserId": "8f81b641-6742-4030-8d0e-f7d64dc17d52"
}
```

Response `201`:
- `CohortSummary`

Errors:
- `cohort_slug_taken`
- `coach_out_of_scope`

## `PATCH /api/v1/admin/cohorts/:cohortId`

Purpose:
- update editable cohort metadata

Allowed fields:

```json
{
  "name": "Juniors · Thursday",
  "yearLabel": "2026",
  "programName": "Beginner Course (Level One)",
  "cadenceLabel": "Thursday · 4:30 PM to 6:30 PM · Starts 2 Apr 2026",
  "capacity": 12,
  "locationName": "Indoor Kartdrome",
  "startsOn": "2026-04-02",
  "endsOn": null
}
```

Response `200`:
- `CohortSummary`

## `POST /api/v1/admin/cohorts/:cohortId/archive`

Purpose:
- archive a cohort instead of deleting it

Request:

```json
{
  "reason": "Completed term"
}
```

Response `200`:
- `CohortSummary`

## `GET /api/v1/admin/students`

Purpose:
- list students in coach scope, optionally including unassigned students for platform admins

Query:

- `cohortId=<uuid>`
- `assignment=cohort|unassigned|all`
- `status=active|withdrawn|all`
- `pace=steady|fast_track|needs_support`
- `search=sara`

Response `200`:

```json
{
  "items": [
    {
      "studentUserId": "4f852574-9f3a-4f62-9656-e6ea929236be",
      "fullName": "Sara Al Mansoori",
      "pace": "fast_track",
      "activeEnrollment": {
        "enrollmentId": "3d0bba02-b347-4ad6-ba55-b2f4cdaa90d5",
        "cohortId": "2db19644-e0e5-4c7d-89f7-c32297770836",
        "cohortName": "Juniors · Thursday",
        "status": "active"
      }
    }
  ],
  "total": 1,
  "nextCursor": null
}
```

## `POST /api/v1/admin/students`

Purpose:
- create a student identity and profile

Request:

```json
{
  "fullName": "Sara Al Mansoori",
  "email": null,
  "username": "sara.almansoori",
  "phone": null,
  "dateOfBirth": "2016-03-14",
  "gender": "female",
  "primaryContactName": "Noora Al Mansoori",
  "primaryContactPhone": "+971501234567",
  "primaryContactEmail": "noora@example.com",
  "emergencyContactName": "Khalid Al Mansoori",
  "emergencyContactPhone": "+971559876543",
  "medicalNotes": "Mild asthma",
  "experienceNotes": "6 months indoor karting",
  "pace": "fast_track",
  "internalNotes": "Confident through sector two"
}
```

Response `201`:

```json
{
  "studentUserId": "4f852574-9f3a-4f62-9656-e6ea929236be"
}
```

## `PATCH /api/v1/admin/students/:studentUserId`

Purpose:
- update student identity or profile fields

Allowed fields:
- same fields as create, except immutable identity ids

Response `200`:

```json
{
  "studentUserId": "4f852574-9f3a-4f62-9656-e6ea929236be",
  "fullName": "Sara Al Mansoori"
}
```

## `POST /api/v1/admin/cohorts/:cohortId/enrollments`

Purpose:
- enroll a student into a cohort

Request:

```json
{
  "studentUserId": "4f852574-9f3a-4f62-9656-e6ea929236be",
  "enrolledAt": "2026-04-02T12:00:00Z",
  "notes": "Late joiner"
}
```

Response `201`:
- `EnrollmentSummary`

Errors:
- `student_already_has_active_enrollment_in_cohort`

## `PATCH /api/v1/admin/enrollments/:enrollmentId`

Purpose:
- update enrollment lifecycle state without transferring

Request:

```json
{
  "status": "paused",
  "notes": "Medical break"
}
```

or

```json
{
  "status": "withdrawn",
  "endedAt": "2026-05-15T17:00:00Z",
  "exitReason": "Family moved"
}
```

Response `200`:
- `EnrollmentSummary`

## `POST /api/v1/admin/enrollments/:enrollmentId/transfer`

Purpose:
- close the current enrollment and open a new enrollment in another cohort

Request:

```json
{
  "targetCohortId": "cbe52336-1ff3-4c45-b8f6-e92c4a6c1f60",
  "effectiveAt": "2026-05-20T12:00:00Z",
  "reason": "Moved to advanced cohort"
}
```

Response `201`:

```json
{
  "previousEnrollmentId": "3d0bba02-b347-4ad6-ba55-b2f4cdaa90d5",
  "newEnrollment": {
    "enrollmentId": "79687d6f-b9ee-41d1-9658-d9050c36cc1d",
    "cohortId": "cbe52336-1ff3-4c45-b8f6-e92c4a6c1f60",
    "cohortName": "Advanced · Tuesday",
    "studentUserId": "4f852574-9f3a-4f62-9656-e6ea929236be",
    "studentName": "Sara Al Mansoori",
    "status": "active",
    "enrolledAt": "2026-05-20T12:00:00Z",
    "endedAt": null,
    "pace": "fast_track"
  }
}
```

## 6. Admin Sessions and Teaching

## `GET /api/v1/admin/cohorts/:cohortId/sessions`

Purpose:
- list sessions for a cohort

Query:

- `status=scheduled|completed|cancelled|all`
- `attendanceWorkflow=not_started|draft|submitted|all`
- `from=2026-04-01T00:00:00Z`
- `to=2026-06-30T23:59:59Z`
- `search=wheel`

Response `200`:

```json
{
  "items": [
    {
      "sessionId": "472bf31d-7194-4500-83d4-b527068f8ba4",
      "cohortId": "2db19644-e0e5-4c7d-89f7-c32297770836",
      "syllabusWeekId": "53d5e090-ab11-4d1d-93a1-7d709af31093",
      "topic": "Wheel Change & Tyre Pressure",
      "track": "Indoor Clockwise",
      "locationName": "Indoor Kartdrome",
      "startsAt": "2026-04-09T12:30:00Z",
      "endsAt": "2026-04-09T14:30:00Z",
      "status": "scheduled",
      "coachAssignments": [
        {
          "coachUserId": "8f81b641-6742-4030-8d0e-f7d64dc17d52",
          "coachName": "Coach Kareem",
          "role": "lead"
        }
      ],
      "attendanceRegister": {
        "workflowStatus": "not_started",
        "savedAt": null,
        "submittedAt": null,
        "visibleToStudentsAt": null
      }
    }
  ],
  "total": 1,
  "nextCursor": null
}
```

## `POST /api/v1/admin/cohorts/:cohortId/sessions`

Purpose:
- create one session or a series

Request:

```json
{
  "mode": "single",
  "session": {
    "syllabusWeekId": "53d5e090-ab11-4d1d-93a1-7d709af31093",
    "topic": "Wheel Change & Tyre Pressure",
    "track": "Indoor Clockwise",
    "locationName": "Indoor Kartdrome",
    "startsAt": "2026-04-09T12:30:00Z",
    "endsAt": "2026-04-09T14:30:00Z",
    "coachAssignments": [
      {
        "coachUserId": "8f81b641-6742-4030-8d0e-f7d64dc17d52",
        "role": "lead"
      }
    ]
  }
}
```

Series request:

```json
{
  "mode": "series",
  "series": {
    "baseTopic": "Workshop Series",
    "count": 6,
    "intervalWeeks": 1,
    "firstStartsAt": "2026-04-09T12:30:00Z",
    "durationMinutes": 120,
    "track": "Indoor Clockwise",
    "locationName": "Indoor Kartdrome",
    "coachAssignments": [
      {
        "coachUserId": "8f81b641-6742-4030-8d0e-f7d64dc17d52",
        "role": "lead"
      }
    ]
  }
}
```

Response `201`:

```json
{
  "items": [
    {
      "sessionId": "472bf31d-7194-4500-83d4-b527068f8ba4",
      "cohortId": "2db19644-e0e5-4c7d-89f7-c32297770836",
      "syllabusWeekId": null,
      "topic": "Workshop Series · Session 01",
      "track": "Indoor Clockwise",
      "locationName": "Indoor Kartdrome",
      "startsAt": "2026-04-09T12:30:00Z",
      "endsAt": "2026-04-09T14:30:00Z",
      "status": "scheduled",
      "coachAssignments": [],
      "attendanceRegister": {
        "workflowStatus": "not_started",
        "savedAt": null,
        "submittedAt": null,
        "visibleToStudentsAt": null
      }
    }
  ]
}
```

## `PATCH /api/v1/admin/sessions/:sessionId`

Purpose:
- update a scheduled session

Request:

```json
{
  "syllabusWeekId": "53d5e090-ab11-4d1d-93a1-7d709af31093",
  "topic": "Wheel Change & Tyre Pressure",
  "track": "Indoor Clockwise",
  "locationName": "Indoor Kartdrome",
  "startsAt": "2026-04-09T12:30:00Z",
  "endsAt": "2026-04-09T14:30:00Z",
  "coachAssignments": [
    {
      "coachUserId": "8f81b641-6742-4030-8d0e-f7d64dc17d52",
      "role": "lead"
    }
  ]
}
```

Response `200`:
- `SessionSummary`

## `POST /api/v1/admin/sessions/:sessionId/cancel`

Purpose:
- cancel a session without deleting history

Request:

```json
{
  "reason": "Public holiday"
}
```

Response `200`:
- `SessionSummary`

## 7. Admin Attendance

## `GET /api/v1/admin/sessions/:sessionId/attendance`

Purpose:
- fetch the attendance register and rows for one session

Response `200`:

```json
{
  "session": {
    "sessionId": "472bf31d-7194-4500-83d4-b527068f8ba4",
    "cohortId": "2db19644-e0e5-4c7d-89f7-c32297770836",
    "syllabusWeekId": "53d5e090-ab11-4d1d-93a1-7d709af31093",
    "topic": "Wheel Change & Tyre Pressure",
    "track": "Indoor Clockwise",
    "locationName": "Indoor Kartdrome",
    "startsAt": "2026-04-09T12:30:00Z",
    "endsAt": "2026-04-09T14:30:00Z",
    "status": "scheduled",
    "coachAssignments": [],
    "attendanceRegister": {
      "workflowStatus": "draft",
      "savedAt": "2026-04-09T14:45:00Z",
      "submittedAt": null,
      "visibleToStudentsAt": null
    }
  },
  "counts": {
    "unmarked": 1,
    "present": 6,
    "late": 1,
    "absent": 0,
    "activeStudents": 8
  },
  "items": [
    {
      "attendanceRecordId": "f0235fd8-c2d9-4e8d-982c-5ed8bc7cbf6f",
      "enrollmentId": "3d0bba02-b347-4ad6-ba55-b2f4cdaa90d5",
      "studentUserId": "4f852574-9f3a-4f62-9656-e6ea929236be",
      "studentName": "Sara Al Mansoori",
      "studentStatus": "active",
      "state": "present",
      "markedAt": "2026-04-09T14:40:00Z",
      "note": null
    }
  ]
}
```

## `PUT /api/v1/admin/sessions/:sessionId/attendance`

Purpose:
- save attendance marks as a draft

Behavior:
- creates or updates `attendance_records`
- updates `attendance_registers.workflow_status` to `draft` unless all active rows are `unmarked`
- does not need all rows in one request; omitted rows remain unchanged

Request:

```json
{
  "rows": [
    {
      "enrollmentId": "3d0bba02-b347-4ad6-ba55-b2f4cdaa90d5",
      "state": "present",
      "note": null
    },
    {
      "enrollmentId": "a32eec99-83ba-4fd9-a6d9-06a58dcceb4d",
      "state": "late",
      "note": "Arrived after briefing"
    }
  ]
}
```

Response `200`:

```json
{
  "workflowStatus": "draft",
  "savedAt": "2026-04-09T14:45:00Z",
  "counts": {
    "unmarked": 1,
    "present": 6,
    "late": 1,
    "absent": 0,
    "activeStudents": 8
  }
}
```

Errors:
- `session_cancelled`
- `enrollment_not_in_session_cohort`

## `POST /api/v1/admin/sessions/:sessionId/attendance/submit`

Purpose:
- finalize the register and make it visible to students in MVP

Behavior:
- rejects if any active student remains `unmarked`
- sets register `workflowStatus = submitted`
- sets `submittedAt`
- sets `visibleToStudentsAt = submittedAt` in MVP
- enqueues `attendance_visible` notifications if enabled

Request:

```json
{}
```

Response `200`:

```json
{
  "workflowStatus": "submitted",
  "submittedAt": "2026-04-09T14:50:00Z",
  "visibleToStudentsAt": "2026-04-09T14:50:00Z"
}
```

Errors:
- `attendance_register_incomplete`
- `session_cancelled`

## 8. Admin Weekly Progress

## `GET /api/v1/admin/cohorts/:cohortId/progress/:syllabusWeekId`

Purpose:
- fetch the weekly progress grid for one cohort week

Response `200`:

```json
{
  "cohortId": "2db19644-e0e5-4c7d-89f7-c32297770836",
  "syllabusWeek": {
    "syllabusWeekId": "53d5e090-ab11-4d1d-93a1-7d709af31093",
    "weekNumber": 2,
    "weekLabel": "Week 02",
    "title": "Wheel Change and Tyre Pressure",
    "objective": "Build braking-point awareness while practicing safe wheel changes and tyre-pressure checks.",
    "status": "live"
  },
  "skills": [
    {
      "syllabusSkillId": "da418061-68be-40f3-8034-d30330bfd425",
      "label": "Braking points",
      "category": "driving"
    }
  ],
  "items": [
    {
      "progressId": "9138c648-6534-40a9-9d63-b3c25f263726",
      "enrollmentId": "3d0bba02-b347-4ad6-ba55-b2f4cdaa90d5",
      "studentUserId": "4f852574-9f3a-4f62-9656-e6ea929236be",
      "studentName": "Sara Al Mansoori",
      "status": "draft",
      "publishedAt": null,
      "summary": "3/4 skills checked",
      "recommendation": null,
      "grade": "B",
      "coachRemark": "3/4 skills checked",
      "checks": [
        {
          "syllabusSkillId": "da418061-68be-40f3-8034-d30330bfd425",
          "label": "Braking points",
          "category": "driving",
          "isChecked": true
        }
      ]
    }
  ]
}
```

## `PUT /api/v1/admin/cohorts/:cohortId/progress/:syllabusWeekId`

Purpose:
- bulk upsert weekly progress rows for a cohort week

Behavior:
- upserts one `student_weekly_progress` row per `(enrollmentId, syllabusWeekId)`
- omitted students remain unchanged
- if a row has no checked skills and no text fields, backend may keep it absent instead of storing an empty draft

Request:

```json
{
  "rows": [
    {
      "enrollmentId": "3d0bba02-b347-4ad6-ba55-b2f4cdaa90d5",
      "summary": "3/4 skills checked",
      "recommendation": "",
      "grade": "B",
      "coachRemark": "3/4 skills checked",
      "checks": [
        {
          "syllabusSkillId": "da418061-68be-40f3-8034-d30330bfd425",
          "isChecked": true
        },
        {
          "syllabusSkillId": "fddc6af4-1680-4465-b402-2cded536f6fe",
          "isChecked": false
        }
      ]
    }
  ]
}
```

Response `200`:

```json
{
  "savedAt": "2026-04-09T15:10:00Z",
  "updatedCount": 1
}
```

Errors:
- `syllabus_week_not_in_cohort`
- `progress_skill_scope_mismatch`

## `POST /api/v1/admin/cohorts/:cohortId/progress/:syllabusWeekId/publish`

Purpose:
- publish weekly progress to students

Behavior:
- publishes either all active rows for the week or only requested enrollments
- sets `publishedAt`
- creates `progress_published` notifications if enabled

Request:

```json
{
  "enrollmentIds": [
    "3d0bba02-b347-4ad6-ba55-b2f4cdaa90d5"
  ]
}
```

If `enrollmentIds` is omitted, publish all draft rows for the week.

Response `200`:

```json
{
  "publishedCount": 1,
  "publishedAt": "2026-04-09T15:15:00Z"
}
```

Errors:
- `no_progress_rows_to_publish`

## 9. Admin Announcements

## `GET /api/v1/admin/announcements`

Purpose:
- list announcements in coach scope

Query:

- `cohortId=<uuid>`
- `status=draft|published|archived|live|expired|all`
- `search=holiday`
- `limit=50`
- `cursor=<opaque>`

Notes:
- `live` and `expired` are API view filters, not stored DB statuses

Response `200`:

```json
{
  "items": [
    {
      "announcementId": "f52fc882-b7f4-4324-b80f-ea99d19808dc",
      "title": "Term 3 Thursday schedule",
      "message": "No class on Thu 28 May for Eid Al Adha.",
      "pinned": true,
      "status": "published",
      "publishedAt": "2026-03-25T12:00:00Z",
      "expiresAt": "2026-06-12T00:00:00Z",
      "archivedAt": null,
      "audienceMode": "resolved_targets",
      "targets": [
        {
          "type": "cohort",
          "cohortId": "2db19644-e0e5-4c7d-89f7-c32297770836",
          "cohortName": "Juniors · Thursday"
        }
      ],
      "deliveredStudentCount": 8,
      "createdAt": "2026-03-25T12:00:00Z",
      "updatedAt": "2026-03-25T12:00:00Z"
    }
  ],
  "total": 1,
  "nextCursor": null
}
```

## `POST /api/v1/admin/announcements`

Purpose:
- create an announcement, optionally publishing immediately

Request:

```json
{
  "title": "Term 3 Thursday schedule",
  "message": "No class on Thu 28 May for Eid Al Adha.",
  "pinned": true,
  "expiresAt": "2026-06-12T00:00:00Z",
  "publishNow": true,
  "audience": {
    "mode": "targets",
    "targets": [
      {
        "type": "cohort",
        "cohortId": "2db19644-e0e5-4c7d-89f7-c32297770836"
      }
    ]
  }
}
```

To mirror the admin prototype “send to all active cohorts” flow:

```json
{
  "title": "Important term notice",
  "message": "Please review the revised term dates.",
  "pinned": false,
  "expiresAt": null,
  "publishNow": true,
  "audience": {
    "mode": "allActiveCohorts"
  }
}
```

Behavior:
- `mode = allActiveCohorts` expands to explicit cohort targets on the backend
- if `publishNow = true`, backend creates `announcement_deliveries` immediately

Response `201`:
- `Announcement`

Errors:
- `announcement_has_no_targets`
- `announcement_target_out_of_scope`

## `PATCH /api/v1/admin/announcements/:announcementId`

Purpose:
- edit an announcement

Behavior:
- allowed for both draft and published announcements
- if the announcement is already published, the backend must recompute targets and `announcement_deliveries`
- old deliveries no longer in audience are archived or deleted according to implementation policy, but the student-facing result must match the new audience

Request:

```json
{
  "title": "Updated term schedule",
  "message": "No class on Thu 28 May. Race day follows on Thu 4 Jun.",
  "pinned": true,
  "expiresAt": "2026-06-12T00:00:00Z",
  "audience": {
    "mode": "targets",
    "targets": [
      {
        "type": "cohort",
        "cohortId": "2db19644-e0e5-4c7d-89f7-c32297770836"
      }
    ]
  }
}
```

Response `200`:
- `Announcement`

## `POST /api/v1/admin/announcements/:announcementId/publish`

Purpose:
- publish a draft announcement

Request:

```json
{}
```

Response `200`:

```json
{
  "announcementId": "f52fc882-b7f4-4324-b80f-ea99d19808dc",
  "status": "published",
  "publishedAt": "2026-03-25T12:00:00Z",
  "deliveredStudentCount": 8
}
```

## `POST /api/v1/admin/announcements/:announcementId/archive`

Purpose:
- archive an announcement without hard deleting it

Request:

```json
{
  "reason": "Replaced by corrected announcement"
}
```

Response `200`:

```json
{
  "announcementId": "f52fc882-b7f4-4324-b80f-ea99d19808dc",
  "status": "archived",
  "archivedAt": "2026-03-26T10:00:00Z"
}
```

## 10. Student Read APIs

## `GET /api/v1/student/home`

Purpose:
- mobile home payload
- uses the active enrollment context only
- if no active enrollment exists, return `200` with `activeEnrollment: null` and `nextSession: null`
- `attendanceSummary` and `progressSummary` are active-enrollment scoped
- `unreadAnnouncementCount` counts only currently visible unread announcements
- `unreadNotificationCount` counts only unread notifications that can appear in `GET /api/v1/student/notifications`

Response `200`:

```json
{
  "me": {
    "userId": "4f852574-9f3a-4f62-9656-e6ea929236be",
    "role": "student",
    "fullName": "Sara Al Mansoori",
    "email": null,
    "username": "sara.almansoori",
    "phone": null,
    "status": "active",
    "studentProfile": {
      "pace": "fast_track",
      "dateOfBirth": "2016-03-14"
    }
  },
  "activeEnrollment": {
    "enrollmentId": "3d0bba02-b347-4ad6-ba55-b2f4cdaa90d5",
    "cohortId": "2db19644-e0e5-4c7d-89f7-c32297770836",
    "cohortName": "Juniors · Thursday",
    "status": "active",
    "enrolledAt": "2026-04-02T12:00:00Z",
    "endedAt": null
  },
  "nextSession": {
    "sessionId": "472bf31d-7194-4500-83d4-b527068f8ba4",
    "topic": "Wheel Change & Tyre Pressure",
    "startsAt": "2026-04-09T12:30:00Z",
    "locationName": "Indoor Kartdrome"
  },
  "attendanceSummary": {
    "present": 4,
    "late": 1,
    "absent": 0
  },
  "progressSummary": {
    "publishedWeekCount": 2,
    "completedSkillCount": 7,
    "totalSkillCount": 10,
    "completionPercent": 70
  },
  "unreadAnnouncementCount": 1,
  "unreadNotificationCount": 2
}
```

If the student has no active enrollment:

```json
{
  "me": {
    "userId": "4f852574-9f3a-4f62-9656-e6ea929236be",
    "role": "student",
    "fullName": "Sara Al Mansoori",
    "email": null,
    "username": "sara.almansoori",
    "phone": null,
    "status": "active",
    "studentProfile": {
      "pace": "fast_track",
      "dateOfBirth": "2016-03-14"
    }
  },
  "activeEnrollment": null,
  "nextSession": null,
  "attendanceSummary": {
    "present": 0,
    "late": 0,
    "absent": 0
  },
  "progressSummary": {
    "publishedWeekCount": 0,
    "completedSkillCount": 0,
    "totalSkillCount": 0,
    "completionPercent": 0
  },
  "unreadAnnouncementCount": 1,
  "unreadNotificationCount": 2
}
```

Notes:
- unread counts still reflect the visible unread items from the student announcement and notification feeds
- absence of an active enrollment is not an error condition

## `GET /api/v1/student/schedule`

Purpose:
- return the student’s schedule for the active enrollment
- if no active enrollment exists, return `200` with an empty list
- ordering: upcoming sessions first by `startsAt ASC`

Query:

- `from=2026-04-01T00:00:00Z`
- `to=2026-06-30T23:59:59Z`
- `limit=50`
- `cursor=<opaque>`

Response `200`:

```json
{
  "items": [
    {
      "sessionId": "472bf31d-7194-4500-83d4-b527068f8ba4",
      "syllabusWeekId": "53d5e090-ab11-4d1d-93a1-7d709af31093",
      "weekLabel": "Week 02",
      "topic": "Wheel Change & Tyre Pressure",
      "track": "Indoor Clockwise",
      "locationName": "Indoor Kartdrome",
      "startsAt": "2026-04-09T12:30:00Z",
      "endsAt": "2026-04-09T14:30:00Z",
      "coachNames": [
        "Coach Kareem"
      ],
      "status": "scheduled"
    }
  ],
  "total": 1,
  "nextCursor": null
}
```

## `GET /api/v1/student/attendance`

Purpose:
- return only attendance visible to the authenticated student
- may include visible history across all of the student's enrollments
- ordering: newest visible attendance item first

Query:

- `limit=50`
- `cursor=<opaque>`

Response `200`:

```json
{
  "items": [
    {
      "cohortId": "2db19644-e0e5-4c7d-89f7-c32297770836",
      "cohortName": "Juniors · Thursday",
      "sessionId": "472bf31d-7194-4500-83d4-b527068f8ba4",
      "weekLabel": "Week 02",
      "topic": "Wheel Change & Tyre Pressure",
      "startsAt": "2026-04-09T12:30:00Z",
      "state": "present",
      "visibleAt": "2026-04-09T14:50:00Z"
    }
  ],
  "total": 1,
  "nextCursor": null
}
```

Visibility rule:
- only rows whose session register `visibleToStudentsAt <= now()`
- rows must belong to one of the authenticated student's enrollments
- if no visible rows exist, return `200` with `items: []`

## `GET /api/v1/student/progress`

Purpose:
- return published weekly progress only
- may include visible history across all of the student's enrollments
- ordering: newest published item first by `publishedAt DESC`

Query:

- `limit=50`
- `cursor=<opaque>`

Response `200`:

```json
{
  "items": [
    {
      "progressId": "9138c648-6534-40a9-9d63-b3c25f263726",
      "cohortId": "2db19644-e0e5-4c7d-89f7-c32297770836",
      "cohortName": "Juniors · Thursday",
      "syllabusWeekId": "53d5e090-ab11-4d1d-93a1-7d709af31093",
      "weekLabel": "Week 02",
      "title": "Wheel Change and Tyre Pressure",
      "status": "published",
      "publishedAt": "2026-04-09T15:15:00Z",
      "summary": "3/4 skills checked",
      "recommendation": "",
      "grade": "B",
      "coachRemark": "3/4 skills checked",
      "checks": [
        {
          "syllabusSkillId": "da418061-68be-40f3-8034-d30330bfd425",
          "label": "Braking points",
          "category": "driving",
          "isChecked": true
        }
      ]
    }
  ],
  "total": 1,
  "nextCursor": null
}
```

Visibility rule:
- only `student_weekly_progress.status = published`
- only rows where `publishedAt <= now()`
- rows must belong to one of the authenticated student's enrollments
- if no visible rows exist, return `200` with `items: []`

## `GET /api/v1/student/announcements`

Purpose:
- return announcements already resolved to this student
- may include visible history across all of the student's enrollments
- ordering: pinned announcements first, then newest visible item first

Query:

- `limit=50`
- `cursor=<opaque>`

Response `200`:

```json
{
  "items": [
    {
      "announcementId": "f52fc882-b7f4-4324-b80f-ea99d19808dc",
      "cohortId": "2db19644-e0e5-4c7d-89f7-c32297770836",
      "cohortName": "Juniors · Thursday",
      "title": "Term 3 Thursday schedule",
      "message": "No class on Thu 28 May for Eid Al Adha.",
      "pinned": true,
      "publishedAt": "2026-03-25T12:00:00Z",
      "expiresAt": "2026-06-12T00:00:00Z",
      "visibleAt": "2026-03-25T12:00:00Z",
      "readAt": null
    }
  ],
  "total": 1,
  "nextCursor": null
}
```

Visibility rule:
- read from `announcement_deliveries`
- include only announcements with `status = published`
- include only announcements where `publishedAt <= now()`
- exclude expired or archived announcements
- if no visible rows exist, return `200` with `items: []`

## `POST /api/v1/student/announcements/:announcementId/read`

Purpose:
- mark an announcement delivery as read

Request:

```json
{}
```

Response `204`

## `GET /api/v1/student/notifications`

Purpose:
- return notifications for the authenticated student
- may include visible history across all of the student's enrollments
- ordering: newest visible notification first by `sentAt DESC`

Query:

- `limit=50`
- `cursor=<opaque>`

Response `200`:

```json
{
  "items": [
    {
      "notificationId": "b03c7f35-fcab-4f38-8582-d5d7d9161550",
      "type": "announcement_published",
      "title": "New announcement",
      "body": "Term 3 Thursday schedule",
      "resourceType": "announcement",
      "resourceId": "f52fc882-b7f4-4324-b80f-ea99d19808dc",
      "deliveryStatus": "sent",
      "queuedAt": "2026-03-25T12:00:00Z",
      "sentAt": "2026-03-25T12:00:02Z",
      "readAt": null
    }
  ],
  "total": 1,
  "nextCursor": null
}
```

Visibility rule:
- return only user-visible in-app notifications intended for the student feed
- exclude transport-only or debug-only rows that should not render in the mobile app
- unread counts on `student/home` must reconcile with this list exactly
- if no visible rows exist, return `200` with `items: []`

## `POST /api/v1/student/notifications/:notificationId/read`

Purpose:
- mark an in-app notification as read

Request:

```json
{}
```

Response `204`

## 11. Device Registration

## `POST /api/v1/devices`

Purpose:
- register or refresh a device installation for push notifications

Request:

```json
{
  "platform": "ios",
  "pushToken": "apns-token",
  "appVersion": "1.0.0"
}
```

Response `201`:

```json
{
  "deviceInstallationId": "c7b728d7-2f96-4109-8fb9-90db88a15e46"
}
```

## 12. Business Rules That The API Must Enforce

### Attendance

- coach must be in scope for the session’s cohort
- only enrollments belonging to the session cohort can be marked
- submitted attendance cannot be resubmitted if the session is cancelled
- students do not see attendance until `visibleToStudentsAt`
- student attendance reads may include visible history across all of the student's enrollments

### Progress

- `syllabusWeekId` must belong to the path cohort
- `enrollmentId` must belong to the path cohort
- `checks[].syllabusSkillId` must belong to the path `syllabusWeekId`
- one progress row per `(enrollmentId, syllabusWeekId)`
- students only see published rows
- students only see progress rows where `publishedAt <= now()`
- student progress reads may include visible history across all of the student's enrollments

### Announcements

- coach can only target cohorts, sessions, or students in scope
- exactly one target type per target row
- publish creates or refreshes `announcement_deliveries`
- student reads come from deliveries, not from target resolution at request time
- students only see announcements that are published, not expired, not archived, and already visible

### Student read behavior

- a student with no active enrollment receives `200 OK` with null-safe or empty-state payloads
- `student/home` and `student/schedule` are active-enrollment scoped
- `student/attendance`, `student/progress`, `student/announcements`, and `student/notifications` may include visible history across all enrollments
- student list endpoints use opaque cursor pagination with stable ordering
- unread counters on `student/home` count only the items that are currently visible in their corresponding student feeds

## 13. Recommended Implementation Order

1. `POST /auth/login`
2. `GET /me`
3. `GET /admin/cohorts`
4. `POST /admin/students`
5. `POST /admin/cohorts/:cohortId/enrollments`
6. `GET /admin/cohorts/:cohortId/sessions`
7. `POST /admin/cohorts/:cohortId/sessions`
8. `GET /admin/sessions/:sessionId/attendance`
9. `PUT /admin/sessions/:sessionId/attendance`
10. `POST /admin/sessions/:sessionId/attendance/submit`
11. `GET /admin/cohorts/:cohortId/progress/:syllabusWeekId`
12. `PUT /admin/cohorts/:cohortId/progress/:syllabusWeekId`
13. `POST /admin/cohorts/:cohortId/progress/:syllabusWeekId/publish`
14. `POST /admin/announcements`
15. `GET /student/home`
16. `GET /student/schedule`
17. `GET /student/attendance`
18. `GET /student/progress`
19. `GET /student/announcements`
20. `GET /student/notifications`

## 14. Non-Goals For MVP

- generic public CRUD endpoints
- direct mobile writes to operational tables
- hard-delete endpoints for cohorts, sessions, announcements, or progress
- client-side target resolution for announcements
- returning raw database row shapes to the frontend

## 15. Bottom Line

This contract is enough to start implementing the backend application layer on top of the schema:

- auth
- scope enforcement
- admin writes
- student reads
- notification fan-out
- audit logging hooks

If you want the next step, the clean follow-on is:

1. generate PostgreSQL DDL from the schema
2. generate TypeScript request/response types from this contract
3. scaffold route handlers by module
