# DAKA Production Backend Schema

## 1. Purpose

This document replaces the prototype-shaped backend draft with a production-ready PostgreSQL design.

It preserves the current product behavior visible in the admin dashboard prototype:

- coaches manage cohorts, students, sessions, attendance, progress, and announcements
- students read only their own schedule, attendance, published progress, and targeted announcements
- attendance supports staged workflow behavior
- weekly progress is skill-by-skill
- announcements can target a cohort, a session, or a specific student
- notifications and auditability exist from day one

It does **not** preserve prototype persistence details such as `localStorage`, nested cohort blobs, seed arrays, or duplicated announcement payloads.

The backend is the source of truth.

## 2. Core Design Decisions

### Identity and profile separation

Use three tables:

- `users`: authentication and common identity only
- `student_profiles`: student-specific operational data
- `coach_profiles`: coach-specific operational data

This keeps `users` small and stable while avoiding a second identity system.

### Enrollment is the historical anchor

`cohort_enrollments` is the anchor for student operational history.

Use `cohort_enrollment_id` directly on:

- `attendance_records`
- `student_weekly_progress`
- `announcement_deliveries` when the delivery was resolved through a cohort or session target

Do **not** anchor those records only to `student_user_id`, because that loses cohort-history context when a student changes cohorts or re-enrolls later.

### Weekly progress uniqueness is enrollment-scoped

The correct uniqueness rule is:

```sql
unique (cohort_enrollment_id, syllabus_week_id)
```

This gives one weekly progress record per student enrollment per week, which is the real business scope.

### Teaching responsibility is explicit

Use:

- `cohort_coaches` for who is assigned to a cohort
- `session_coaches` for who actually teaches a given session

The UI can still display one visible coach name by reading the `lead` assignment, but the database should not assume a session always has exactly one coach.

### Attendance mark state and attendance workflow are separate

Use:

- `attendance_records.state` for the per-student mark
- `attendance_registers.workflow_status` and `attendance_registers.visible_to_students_at` for the session-level workflow and student visibility

This avoids the current ambiguity where `pending` can mean either "not yet marked" or "not yet published".

### Canonical write model, projected read model

The normalized schema is the only write model.

Student reads should come from:

- API DTOs assembled from canonical tables
- SQL views if useful
- delivery tables such as `announcement_deliveries` where read-state or publish-time resolution matters

Do **not** create a second duplicated mobile schema.

### Scope discipline

The design intentionally does **not** add:

- a separate `programs` table
- guardian entities
- template libraries for syllabus content
- generic polymorphic workflow tables

Those are not necessary for the current product.

## 3. PostgreSQL Conventions

- Primary keys: `uuid primary key default gen_random_uuid()`
- Timestamps: `timestamptz`
- Case-insensitive email/username: `citext`
- Explicit foreign keys and named constraints
- Soft lifecycle markers preferred over deletes: `archived_at`, `cancelled_at`, `ended_at`, `published_at`, `visible_to_students_at`

Recommended extensions:

```sql
create extension if not exists pgcrypto;
create extension if not exists citext;
```

Recommended enum domains:

- `user_role`: `coach | student`
- `user_status`: `invited | active | suspended | archived`
- `student_pace`: `steady | fast_track | needs_support`
- `cohort_coach_role`: `lead | assistant`
- `session_coach_role`: `lead | assistant | substitute`
- `cohort_enrollment_status`: `active | paused | withdrawn | completed | cancelled`
- `session_status`: `scheduled | completed | cancelled`
- `syllabus_week_status`: `planned | live | complete`
- `attendance_mark_state`: `unmarked | present | late | absent`
- `attendance_capture_status`: `not_started | draft | submitted`
- `progress_status`: `draft | published`
- `announcement_status`: `draft | published | archived`
- `announcement_target_type`: `cohort | session | student`
- `notification_type`: `attendance_visible | progress_published | announcement_published | session_reminder | enrollment_changed`
- `notification_delivery_status`: `queued | sent | failed`
- `audit_surface`: `admin_dashboard | mobile_app | system_worker | api`

## 4. Revised Canonical Schema

### `users`

Purpose:
- Authentication, identity, and common lifecycle.

Key columns:
- `id uuid primary key`
- `role user_role not null`
- `email citext unique null`
- `username citext unique null`
- `password_hash text null`
- `full_name text not null`
- `phone text null`
- `status user_status not null default 'invited'`
- `last_login_at timestamptz null`
- `invited_at timestamptz null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`
- `archived_at timestamptz null`

Important constraints:
- `check (email is not null or username is not null)`
- `check (archived_at is null or status = 'archived')`

Important indexes:
- unique index on `email`
- unique index on `username`
- btree on `(role, status)`

### `student_profiles`

Purpose:
- Student-only business and operational data.

Key columns:
- `user_id uuid primary key references users(id)`
- `date_of_birth date null`
- `gender text null`
- `primary_contact_name text null`
- `primary_contact_phone text null`
- `primary_contact_email citext null`
- `emergency_contact_name text null`
- `emergency_contact_phone text null`
- `medical_notes text null`
- `experience_notes text null`
- `pace student_pace null`
- `internal_notes text null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`
- `archived_at timestamptz null`

Important constraints:
- FK should point to a `users` row whose `role = 'student'`
  Practical choice: enforce this in service code, or with a trigger if the DB must enforce it.

Important indexes:
- btree on `(pace)`
- btree on `(archived_at)`

### `coach_profiles`

Purpose:
- Coach-only operational metadata and authorization flags.

Key columns:
- `user_id uuid primary key references users(id)`
- `display_name text null`
- `bio text null`
- `is_platform_admin boolean not null default false`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`
- `archived_at timestamptz null`

Important constraints:
- FK should point to a `users` row whose `role = 'coach'`

Important indexes:
- btree on `(is_platform_admin)`
- btree on `(archived_at)`

### `cohorts`

Purpose:
- Operational cohort container used by coaches and students.

Key columns:
- `id uuid primary key`
- `slug text unique not null`
- `name text not null`
- `year_label text null`
- `program_name text null`
- `cadence_label text null`
- `capacity integer null`
- `location_name text null`
- `starts_on date null`
- `ends_on date null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`
- `archived_at timestamptz null`

Important constraints:
- `check (capacity is null or capacity > 0)`
- `check (ends_on is null or starts_on is null or ends_on >= starts_on)`

Important indexes:
- unique index on `slug`
- btree on `(archived_at, starts_on)`
- btree on `(year_label, archived_at)`

### `cohort_coaches`

Purpose:
- Historical coach assignment to cohorts.

Key columns:
- `id uuid primary key`
- `cohort_id uuid not null references cohorts(id)`
- `coach_user_id uuid not null references coach_profiles(user_id)`
- `role cohort_coach_role not null`
- `assigned_at timestamptz not null`
- `ended_at timestamptz null`
- `created_at timestamptz not null`

Important constraints:
- one active assignment per `(cohort_id, coach_user_id)`
- at most one active `lead` coach per cohort
- `check (ended_at is null or ended_at >= assigned_at)`

Important indexes:
- btree on `(coach_user_id, ended_at)`
- btree on `(cohort_id, ended_at)`

### `cohort_enrollments`

Purpose:
- Historical membership of a student in a cohort.

Key columns:
- `id uuid primary key`
- `cohort_id uuid not null references cohorts(id)`
- `student_user_id uuid not null references student_profiles(user_id)`
- `status cohort_enrollment_status not null`
- `enrolled_at timestamptz not null`
- `ended_at timestamptz null`
- `exit_reason text null`
- `notes text null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

Important constraints:
- one active enrollment per student per cohort
- `check ((status in ('withdrawn','completed','cancelled') and ended_at is not null) or (status in ('active','paused') and ended_at is null))`
- add `unique (id, cohort_id)` to support same-cohort composite FKs from child tables

Important indexes:
- btree on `(student_user_id, enrolled_at desc)`
- btree on `(cohort_id, status, enrolled_at desc)`
- partial unique index for active enrollment per cohort/student

### `syllabus_weeks`

Purpose:
- The weekly learning structure for a cohort.

Key columns:
- `id uuid primary key`
- `cohort_id uuid not null references cohorts(id)`
- `week_number integer not null`
- `week_label text not null`
- `title text not null`
- `objective text null`
- `status syllabus_week_status not null default 'planned'`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

Important constraints:
- `unique (cohort_id, week_number)`
- add `unique (id, cohort_id)` for composite child FKs
- `check (week_number > 0)`

Important indexes:
- btree on `(cohort_id, week_number)`
- btree on `(cohort_id, status)`

### `syllabus_skills`

Purpose:
- The skill checklist definitions for one syllabus week.

Key columns:
- `id uuid primary key`
- `syllabus_week_id uuid not null references syllabus_weeks(id)`
- `category text not null`
- `label text not null`
- `description text null`
- `sort_order integer not null default 0`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

Important constraints:
- `check (sort_order >= 0)`

Important indexes:
- btree on `(syllabus_week_id, sort_order, id)`

### `sessions`

Purpose:
- Scheduled teaching sessions for a cohort.

Key columns:
- `id uuid primary key`
- `cohort_id uuid not null references cohorts(id)`
- `syllabus_week_id uuid null references syllabus_weeks(id)`
- `topic text not null`
- `track text null`
- `location_name text null`
- `starts_at timestamptz not null`
- `ends_at timestamptz null`
- `status session_status not null default 'scheduled'`
- `cancelled_at timestamptz null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

Important constraints:
- `check (ends_at is null or ends_at > starts_at)`
- `check (cancelled_at is null or status = 'cancelled')`
- add `unique (id, cohort_id)` for composite FKs from attendance and progress tables

Important indexes:
- btree on `(cohort_id, starts_at)`
- btree on `(cohort_id, status, starts_at)`
- btree on `(syllabus_week_id)`

### `session_coaches`

Purpose:
- Actual teaching responsibility for a specific session.

Key columns:
- `id uuid primary key`
- `session_id uuid not null references sessions(id)`
- `coach_user_id uuid not null references coach_profiles(user_id)`
- `role session_coach_role not null`
- `created_at timestamptz not null`

Important constraints:
- `unique (session_id, coach_user_id)`
- at most one `lead` coach per session

Important indexes:
- btree on `(coach_user_id, session_id)`
- btree on `(session_id, role)`

Notes:
- Persist `session_coaches` rows even for a single-coach session.
- The write path should default the first `lead` session coach from the active cohort lead coach, but the source of truth for the session is still `session_coaches`.

### `attendance_registers`

Purpose:
- The session-level attendance workflow object.

Key columns:
- `id uuid primary key`
- `session_id uuid not null unique references sessions(id)`
- `workflow_status attendance_capture_status not null default 'not_started'`
- `saved_at timestamptz null`
- `submitted_at timestamptz null`
- `visible_to_students_at timestamptz null`
- `last_saved_by_coach_user_id uuid null references coach_profiles(user_id)`
- `submitted_by_coach_user_id uuid null references coach_profiles(user_id)`
- `released_by_coach_user_id uuid null references coach_profiles(user_id)`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

Important constraints:
- `check (submitted_at is null or workflow_status = 'submitted')`
- `check (visible_to_students_at is null or workflow_status = 'submitted')`

Important indexes:
- unique index on `session_id`
- btree on `(workflow_status, submitted_at)`
- btree on `(visible_to_students_at)`

Notes:
- Prototype UI labels can still be `pending / saved / submitted`.
- Backend naming should be clearer:
  - prototype `pending` -> `not_started`
  - prototype `saved` -> `draft`
  - prototype `submitted` -> `submitted`

### `attendance_records`

Purpose:
- One attendance mark per session per enrolled student.

Key columns:
- `id uuid primary key`
- `session_id uuid not null`
- `cohort_id uuid not null`
- `cohort_enrollment_id uuid not null`
- `state attendance_mark_state not null default 'unmarked'`
- `marked_at timestamptz null`
- `marked_by_coach_user_id uuid null references coach_profiles(user_id)`
- `note text null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

Important constraints:
- `unique (session_id, cohort_enrollment_id)`
- FK `(session_id, cohort_id)` -> `sessions(id, cohort_id)`
- FK `(cohort_enrollment_id, cohort_id)` -> `cohort_enrollments(id, cohort_id)`

Important indexes:
- btree on `(session_id, state)`
- btree on `(cohort_enrollment_id, session_id)`

Notes:
- `cohort_id` is intentionally repeated here so PostgreSQL can enforce same-cohort integrity without a trigger.
- Service-layer validation should also ensure the session time falls inside the enrollment period.

### `student_weekly_progress`

Purpose:
- One weekly progress record per enrolled student per syllabus week.

Key columns:
- `id uuid primary key`
- `cohort_id uuid not null`
- `cohort_enrollment_id uuid not null`
- `syllabus_week_id uuid not null`
- `session_id uuid null`
- `author_coach_user_id uuid not null references coach_profiles(user_id)`
- `summary text null`
- `recommendation text null`
- `grade text null`
- `coach_remark text null`
- `status progress_status not null default 'draft'`
- `saved_at timestamptz null`
- `published_at timestamptz null`
- `published_by_coach_user_id uuid null references coach_profiles(user_id)`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

Important constraints:
- `unique (cohort_enrollment_id, syllabus_week_id)`
- FK `(cohort_enrollment_id, cohort_id)` -> `cohort_enrollments(id, cohort_id)`
- FK `(syllabus_week_id, cohort_id)` -> `syllabus_weeks(id, cohort_id)`
- FK `(session_id, cohort_id)` -> `sessions(id, cohort_id)` when `session_id` is present
- `check (published_at is null or status = 'published')`

Important indexes:
- btree on `(cohort_enrollment_id, created_at desc)`
- btree on `(cohort_id, syllabus_week_id)`
- btree on `(status, published_at)`

Notes:
- Do not store `title` just to mirror the prototype.
- `Week 01 progress` is a presentation concern, not a canonical data field.

### `student_weekly_progress_checks`

Purpose:
- Per-skill completion state for one weekly progress record.

Key columns:
- `id uuid primary key`
- `progress_id uuid not null references student_weekly_progress(id)`
- `syllabus_skill_id uuid not null references syllabus_skills(id)`
- `is_checked boolean not null default false`
- `note text null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

Important constraints:
- `unique (progress_id, syllabus_skill_id)`

Important indexes:
- btree on `(progress_id, syllabus_skill_id)`
- btree on `(syllabus_skill_id)`

Notes:
- Service code should validate that the chosen skill belongs to the same `syllabus_week_id` as the parent progress row.

### `announcements`

Purpose:
- Canonical announcement content, authored once.

Key columns:
- `id uuid primary key`
- `author_user_id uuid not null references users(id)`
- `title text not null`
- `message text not null`
- `pinned boolean not null default false`
- `status announcement_status not null default 'draft'`
- `published_at timestamptz null`
- `expires_at timestamptz null`
- `archived_at timestamptz null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

Important constraints:
- `check (published_at is null or status in ('published','archived'))`
- `check (archived_at is null or status = 'archived')`

Important indexes:
- btree on `(status, published_at desc)`
- btree on `(expires_at)`
- btree on `(pinned, published_at desc)`

### `announcement_targets`

Purpose:
- Explicit targeting rows for cohort, session, or direct-student delivery.

Key columns:
- `id uuid primary key`
- `announcement_id uuid not null references announcements(id)`
- `target_type announcement_target_type not null`
- `target_cohort_id uuid null references cohorts(id)`
- `target_session_id uuid null references sessions(id)`
- `target_student_user_id uuid null references student_profiles(user_id)`
- `created_at timestamptz not null`

Important constraints:
- exactly one target column must be populated
- `target_type` must match the populated target column
- partial unique indexes should prevent duplicate targeting of the same announcement to the same cohort/session/student

Important indexes:
- btree on `(announcement_id)`
- partial unique index on `(announcement_id, target_cohort_id)` where `target_cohort_id is not null`
- partial unique index on `(announcement_id, target_session_id)` where `target_session_id is not null`
- partial unique index on `(announcement_id, target_student_user_id)` where `target_student_user_id is not null`

### `announcement_deliveries`

Purpose:
- Publish-time resolved student recipient rows, plus read state.

Key columns:
- `id uuid primary key`
- `announcement_id uuid not null references announcements(id)`
- `announcement_target_id uuid not null references announcement_targets(id)`
- `student_user_id uuid not null references student_profiles(user_id)`
- `cohort_enrollment_id uuid null references cohort_enrollments(id)`
- `visible_at timestamptz not null`
- `read_at timestamptz null`
- `dismissed_at timestamptz null`
- `created_at timestamptz not null`

Important constraints:
- `unique (announcement_id, student_user_id)`

Important indexes:
- btree on `(student_user_id, visible_at desc)`
- btree on `(announcement_id)`
- btree on `(cohort_enrollment_id)`

Notes:
- This is not a second write model.
- It is an intentional delivery/read-state table required for notifications, unread counts, and stable student visibility after publish-time audience resolution.

### `device_installations`

Purpose:
- Push delivery endpoints per device/app installation.

Key columns:
- `id uuid primary key`
- `user_id uuid not null references users(id)`
- `platform text not null`
- `push_token text not null`
- `app_version text null`
- `last_seen_at timestamptz null`
- `revoked_at timestamptz null`
- `created_at timestamptz not null`

Important constraints:
- `unique (push_token)`

Important indexes:
- unique index on `push_token`
- btree on `(user_id, revoked_at)`

### `notifications`

Purpose:
- In-app and push notification log.

Key columns:
- `id uuid primary key`
- `user_id uuid not null references users(id)`
- `type notification_type not null`
- `title text not null`
- `body text not null`
- `resource_type text not null`
- `resource_id uuid null`
- `delivery_status notification_delivery_status not null default 'queued'`
- `queued_at timestamptz not null`
- `sent_at timestamptz null`
- `failed_at timestamptz null`
- `read_at timestamptz null`
- `error_message text null`
- `created_at timestamptz not null`

Important constraints:
- `check (failed_at is null or delivery_status = 'failed')`
- `check (sent_at is null or delivery_status = 'sent')`

Important indexes:
- btree on `(user_id, created_at desc)`
- btree on `(delivery_status, queued_at)`
- btree on `(resource_type, resource_id)`

### `audit_logs`

Purpose:
- Production traceability for writes, publishes, and side effects.

Key columns:
- `id uuid primary key`
- `request_id uuid null`
- `actor_user_id uuid null references users(id)`
- `source_surface audit_surface not null`
- `action text not null`
- `resource_type text not null`
- `resource_id uuid null`
- `cohort_id uuid null references cohorts(id)`
- `student_user_id uuid null references student_profiles(user_id)`
- `before_json jsonb null`
- `after_json jsonb null`
- `metadata_json jsonb not null default '{}'::jsonb`
- `ip_address inet null`
- `user_agent text null`
- `occurred_at timestamptz not null`

Important constraints:
- none beyond FKs; keep this table append-only

Important indexes:
- btree on `(resource_type, resource_id, occurred_at desc)`
- btree on `(actor_user_id, occurred_at desc)`
- btree on `(request_id)`
- btree on `(cohort_id, occurred_at desc)`

Audit events that should always be logged:

- enrollment created, transferred, withdrawn, completed
- session created, updated, cancelled
- attendance register saved, submitted, released
- attendance mark changed after submission
- progress saved, published, unpublished if supported later
- announcement created, published, retargeted, archived
- notification send failure

## 5. Critical Integrity Snippets

### Active enrollment uniqueness

```sql
create unique index uq_cohort_enrollments_active
  on cohort_enrollments (cohort_id, student_user_id)
  where ended_at is null;
```

### One lead coach per cohort and per session

```sql
create unique index uq_cohort_coaches_one_active_lead
  on cohort_coaches (cohort_id)
  where role = 'lead' and ended_at is null;

create unique index uq_session_coaches_one_lead
  on session_coaches (session_id)
  where role = 'lead';
```

### Progress scoped to the correct cohort and enrollment

```sql
alter table cohort_enrollments
  add constraint uq_cohort_enrollments_id_cohort unique (id, cohort_id);

alter table syllabus_weeks
  add constraint uq_syllabus_weeks_id_cohort unique (id, cohort_id);

alter table sessions
  add constraint uq_sessions_id_cohort unique (id, cohort_id);

alter table student_weekly_progress
  add constraint fk_progress_enrollment_scope
    foreign key (cohort_enrollment_id, cohort_id)
    references cohort_enrollments (id, cohort_id),
  add constraint fk_progress_week_scope
    foreign key (syllabus_week_id, cohort_id)
    references syllabus_weeks (id, cohort_id),
  add constraint fk_progress_session_scope
    foreign key (session_id, cohort_id)
    references sessions (id, cohort_id),
  add constraint uq_progress_enrollment_week
    unique (cohort_enrollment_id, syllabus_week_id);
```

### Exactly one announcement target per row

```sql
alter table announcement_targets
  add constraint ck_announcement_targets_exactly_one
    check (num_nonnulls(target_cohort_id, target_session_id, target_student_user_id) = 1),
  add constraint ck_announcement_targets_type_match
    check (
      (target_type = 'cohort'  and target_cohort_id is not null and target_session_id is null and target_student_user_id is null) or
      (target_type = 'session' and target_session_id is not null and target_cohort_id is null and target_student_user_id is null) or
      (target_type = 'student' and target_student_user_id is not null and target_cohort_id is null and target_session_id is null)
    );
```

### Attendance visibility only after submission

```sql
alter table attendance_registers
  add constraint ck_attendance_registers_visible_after_submit
    check (visible_to_students_at is null or workflow_status = 'submitted');
```

## 6. Relationship Summary

- One `users` row may have one `student_profiles` row.
- One `users` row may have one `coach_profiles` row.
- One `cohorts` row has many `cohort_coaches`.
- One `cohorts` row has many `cohort_enrollments`.
- One `cohorts` row has many `syllabus_weeks`.
- One `cohorts` row has many `sessions`.
- One `sessions` row has many `session_coaches`.
- One `sessions` row has one `attendance_registers` row.
- One `sessions` row has many `attendance_records`.
- One `cohort_enrollments` row has many `attendance_records`.
- One `cohort_enrollments` row has many `student_weekly_progress` rows.
- One `student_weekly_progress` row has many `student_weekly_progress_checks`.
- One `announcements` row has many `announcement_targets`.
- One `announcements` row has many `announcement_deliveries`.
- One `users` row has many `device_installations`.
- One `users` row has many `notifications`.

## 7. Most Important Design Changes

### 1. `users` is no longer overloaded

The previous draft kept student operational fields directly on `users`.

That was weak because:

- student business data changes more often than auth identity
- coach and student fields were mixed together
- it makes future auth or staff changes harder

The new design keeps `users` small and moves student/coach-specific fields to profile tables.

### 2. Enrollment now owns historical student context

Attendance and progress are now tied to `cohort_enrollment_id`, not just the student identity.

That is better because:

- moving cohorts does not rewrite history
- re-enrollment is safe
- the same student can have distinct historical records in the same cohort across different terms

### 3. Progress uniqueness is now correct

The old uniqueness rule:

```sql
unique (student_user_id, syllabus_week_id)
```

was too weak because it ignored the enrollment and cohort context.

The new rule:

```sql
unique (cohort_enrollment_id, syllabus_week_id)
```

matches the actual business scope.

### 4. Session teaching responsibility is normalized

The old draft had cohort-level coaches and a possible single session coach.

The new model uses:

- `cohort_coaches` for default ownership
- `session_coaches` for actual delivery

This is internally consistent and supports multi-coach sessions without hacks.

### 5. Attendance workflow is separated from attendance marks

The old draft mixed session workflow state into `sessions` and used `pending` ambiguously.

The new design separates:

- `attendance_records.state`
- `attendance_registers.workflow_status`
- `attendance_registers.visible_to_students_at`

That makes visibility, submission, and editing rules much easier to reason about.

### 6. Announcement targeting and student delivery are production-safe

The old draft had the right idea with `announcement_targets`, but it did not fully define integrity or recipient resolution.

The new design adds:

- exact-one-target DB constraints
- partial unique indexes to prevent duplicate target rows
- `announcement_deliveries` for publish-time recipient resolution and read state

## 8. Recommended Permission Model

### Coach permissions

- A coach must authenticate through `users` with `role = 'coach'`.
- Standard coach scope is limited to cohorts where they have an active `cohort_coaches` assignment.
- Session-specific actions may also be allowed when the coach is assigned in `session_coaches`.
- `coach_profiles.is_platform_admin = true` can bypass cohort scoping for platform-wide administration.
- Coaches can write:
  - cohorts in scope
  - enrollments in scope
  - sessions in scope
  - attendance registers and attendance marks for sessions in scope
  - weekly progress for enrollments in scope
  - announcements targeted only to cohorts, sessions, or students within scope

### Student permissions

- A student must authenticate through `users` with `role = 'student'`.
- Students have no access to admin write modules.
- Students can read:
  - their own user/profile record
  - their own active enrollment context
  - their own schedule
  - their own visible attendance
  - their own published progress
  - their own delivered announcements
  - their own notifications

### Enforcement recommendation

- If the database is private behind an API, enforce scope in the service layer.
- If the client can query Postgres directly, enable row-level security on student-scoped views and tables.

## 9. Student Visibility Rules

### Attendance

Students can see attendance only when:

- the record belongs to one of their enrollments
- the session attendance register has `visible_to_students_at <= now()`

Recommended MVP behavior:

- set `visible_to_students_at` automatically when the register is submitted

That preserves current prototype behavior while keeping the option to delay visibility later.

### Progress

Students can see weekly progress only when:

- `student_weekly_progress.status = 'published'`
- `published_at <= now()`
- the progress row belongs to one of their enrollments

### Announcements

Students can see announcements only when:

- the announcement has `status = 'published'`
- `published_at <= now()`
- it is not expired
- a corresponding `announcement_deliveries` row exists for that student

Recommended publish behavior:

- resolve cohort and session targets to concrete students at publish time
- create `announcement_deliveries`
- create `notifications` from those deliveries

## 10. Canonical Write Model vs Student Read Model

The normalized schema above is the canonical write model.

The mobile app should read through projections or DTOs, not through direct table mirroring.

Recommended student-facing projections:

- `student_current_enrollment_v`
  - joins `cohort_enrollments`, `cohorts`, and lead coach/session summary
- `student_schedule_v`
  - joins active enrollment to `sessions` and `session_coaches`
- `student_attendance_v`
  - joins `attendance_records`, `sessions`, and `attendance_registers`
  - filters on `visible_to_students_at`
- `student_progress_v`
  - joins `student_weekly_progress`, `student_weekly_progress_checks`, `syllabus_weeks`, and `syllabus_skills`
  - filters on `status = 'published'`
- `student_announcements_v`
  - joins `announcement_deliveries` to `announcements`
- `student_notifications_v`
  - joins `notifications`

Why this is the right split:

- write-path normalization stays clean
- student reads stay fast and safe
- there is no duplicated second source of truth
- mobile API contracts can stay stable even if internal write tables evolve

## 11. Suggested API Module Grouping

### Admin write modules

- `auth`
- `admin.cohorts`
- `admin.cohort-coaches`
- `admin.enrollments`
- `admin.sessions`
- `admin.attendance`
- `admin.progress`
- `admin.announcements`
- `admin.notifications`
- `admin.audit`

### Student read modules

- `me`
- `student.home`
- `student.schedule`
- `student.attendance`
- `student.progress`
- `student.announcements`
- `student.notifications`
- `devices`

Recommended boundary:

- mobile app should call student-focused endpoints only
- admin dashboard should call admin-focused endpoints only
- do not expose generic table CRUD to either surface

## 12. MVP Build Order

### Phase 1. Identity and cohort backbone

- `users`
- `student_profiles`
- `coach_profiles`
- `cohorts`
- `cohort_coaches`
- `cohort_enrollments`

### Phase 2. Teaching structure

- `syllabus_weeks`
- `syllabus_skills`
- `sessions`
- `session_coaches`

### Phase 3. Attendance

- `attendance_registers`
- `attendance_records`
- admin attendance APIs
- student attendance read projection

### Phase 4. Weekly progress

- `student_weekly_progress`
- `student_weekly_progress_checks`
- publish workflow
- student progress read projection

### Phase 5. Announcements and notifications

- `announcements`
- `announcement_targets`
- `announcement_deliveries`
- `device_installations`
- `notifications`

### Phase 6. Audit and operational hardening

- `audit_logs`
- request correlation IDs
- notification retry/failure handling
- soft-delete/archive tooling

## 13. Changes From Previous Draft

### Split `users` into identity plus profiles

Changed:
- moved student business fields out of `users`
- replaced `coaches` with `coach_profiles` to match the same pattern

Why:
- cleaner separation of auth vs operational data
- simpler long-term maintenance

### Removed `programs`

Changed:
- dropped the optional `programs` table
- kept `program_name` on `cohorts`

Why:
- the current product only needs a label, not a reusable program domain
- avoids premature modeling

### Moved student cohort status to `cohort_enrollments`

Changed:
- student cohort lifecycle is now modeled on the enrollment row, not the student identity row

Why:
- `withdrawn` or `completed` is usually cohort-specific, not globally true for the student

### Added `session_coaches`

Changed:
- removed the assumption that `sessions` should carry a single coach field

Why:
- sessions may have multiple coaches
- keeps cohort-level and session-level teaching responsibility consistent

### Added `attendance_registers`

Changed:
- removed attendance workflow ownership from `sessions`
- introduced a separate session-level attendance workflow table

Why:
- separates workflow state from per-student marks
- makes student visibility explicit

### Renamed ambiguous attendance state semantics

Changed:
- prototype-style attendance mark `pending` becomes canonical DB state `unmarked`
- session workflow uses `not_started | draft | submitted`

Why:
- avoids ambiguity between "not marked yet" and "not yet visible/submitted"

### Tightened progress uniqueness

Changed:
- replaced `unique (student_user_id, syllabus_week_id)` with `unique (cohort_enrollment_id, syllabus_week_id)`

Why:
- fixes ambiguity across cohort moves and re-enrollments

### Tightened announcement target integrity

Changed:
- formalized exact-one-target-column constraint
- added duplicate-prevention indexes

Why:
- removes invalid mixed-target rows
- prevents repeated targeting of the same audience

### Added `announcement_deliveries`

Changed:
- introduced a delivery/read-state table between target definition and student consumption

Why:
- supports publish-time audience resolution
- supports unread counts, notifications, and auditability

### Expanded auditability

Changed:
- audit logs now include request/source metadata, cohort/student filters, and append-only guidance

Why:
- production debugging is much easier when you can trace who changed what, from which surface, in which request

## 14. Bottom Line

This revised schema keeps the product behavior of the current admin prototype, but removes the prototype storage shape.

The most important production choices are:

- keep `users` small
- anchor student operational history to `cohort_enrollment_id`
- separate attendance marks from attendance workflow
- use `session_coaches` instead of a single coach field on sessions
- publish announcements once and resolve recipients explicitly
- serve the mobile app from read projections over the canonical model, not from a second schema
