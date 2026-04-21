import type { AuthLoginResponse, AuthToken, Me, Notification, StudentHome } from "../contracts/dto.js";

const ACCESS_TOKEN_PREFIX = "daka_demo_";
const ACCESS_TOKEN_TTL_MS = 8 * 60 * 60 * 1000;

type DemoCoachProfile = NonNullable<Me["coachProfile"]>;
type DemoStudentProfile = NonNullable<Me["studentProfile"]>;

export type DemoUser = {
  userId: string;
  role: Me["role"];
  fullName: string;
  email: string | null;
  username: string | null;
  phone: string | null;
  status: Me["status"];
  password: string;
  coachProfile?: DemoCoachProfile;
  studentProfile?: DemoStudentProfile;
};

type DemoEnrollment = NonNullable<StudentHome["activeEnrollment"]> & {
  studentUserId: string;
};

type DemoSession = NonNullable<StudentHome["nextSession"]> & {
  cohortId: string;
};

type DemoAttendanceRecord = {
  enrollmentId: string;
  state: "unmarked" | "present" | "late" | "absent";
};

type DemoProgressRecord = {
  enrollmentId: string;
  status: "draft" | "published";
  publishedAt: string | null;
  skillChecks: Record<string, boolean>;
};

type DemoAnnouncementDelivery = {
  announcementId: string;
  studentUserId: string;
  cohortId: string | null;
  cohortName: string | null;
  status: "draft" | "published" | "archived";
  publishedAt: string | null;
  expiresAt: string | null;
  archivedAt: string | null;
  readAt: string | null;
  deliveredAt: string;
  pinned: boolean;
};

type DemoNotificationItem = Notification & {
  studentUserId: string;
  visibleInFeed: boolean;
  cohortId: string | null;
  cohortName: string | null;
};

const demoUsers: DemoUser[] = [
  {
    userId: "c2f322b4-72d7-4022-9d20-f7015be6e25a",
    role: "coach",
    fullName: "Coach Kareem",
    email: "coach@daka.app",
    username: "coach.kareem",
    phone: null,
    status: "active",
    password: "secret",
    coachProfile: {
      displayName: "Coach Kareem",
      isPlatformAdmin: false,
    },
  },
  {
    userId: "4f852574-9f3a-4f62-9656-e6ea929236be",
    role: "student",
    fullName: "Sara Al Mansoori",
    email: null,
    username: "sara.almansoori",
    phone: null,
    status: "active",
    password: "secret",
    studentProfile: {
      pace: "fast_track",
      dateOfBirth: "2016-03-14",
    },
  },
  {
    userId: "a8d6af4f-4c2a-4b4a-a871-d14386f63837",
    role: "student",
    fullName: "Mariam Al Falasi",
    email: null,
    username: "mariam.alfalasi",
    phone: null,
    status: "active",
    password: "secret",
    studentProfile: {
      pace: "steady",
      dateOfBirth: "2015-11-02",
    },
  },
  {
    userId: "df60d464-b2f9-49cb-a9a1-c8507b85bfb5",
    role: "coach",
    fullName: "Coach Noor",
    email: "suspended@daka.app",
    username: "coach.noor",
    phone: null,
    status: "suspended",
    password: "secret",
    coachProfile: {
      displayName: "Coach Noor",
      isPlatformAdmin: false,
    },
  },
];

const demoEnrollments: DemoEnrollment[] = [
  {
    enrollmentId: "3d0bba02-b347-4ad6-ba55-b2f4cdaa90d5",
    cohortId: "2db19644-e0e5-4c7d-89f7-c32297770836",
    cohortName: "Juniors · Thursday",
    studentUserId: "4f852574-9f3a-4f62-9656-e6ea929236be",
    status: "active",
    enrolledAt: "2026-04-02T12:00:00Z",
    endedAt: null,
  },
  {
    enrollmentId: "ad853c83-8d15-41cb-b405-1e474e45b5af",
    cohortId: "9e9cb13e-2db4-49ea-bb0f-a357035cc3e7",
    cohortName: "Juniors · Winter",
    studentUserId: "a8d6af4f-4c2a-4b4a-a871-d14386f63837",
    status: "completed",
    enrolledAt: "2025-01-09T12:00:00Z",
    endedAt: "2025-03-18T12:00:00Z",
  },
];

const demoSessions: DemoSession[] = [
  {
    sessionId: "472bf31d-7194-4500-83d4-b527068f8ba4",
    cohortId: "2db19644-e0e5-4c7d-89f7-c32297770836",
    topic: "Wheel Change & Tyre Pressure",
    startsAt: "2026-05-01T12:30:00Z",
    locationName: "Indoor Kartdrome",
  },
  {
    sessionId: "daf0e087-c7d8-4f22-b87b-480d2fca29be",
    cohortId: "2db19644-e0e5-4c7d-89f7-c32297770836",
    topic: "Starts, Braking & Apexes",
    startsAt: "2026-05-08T12:30:00Z",
    locationName: "Indoor Kartdrome",
  },
];

const demoAttendanceRecords: DemoAttendanceRecord[] = [
  { enrollmentId: "3d0bba02-b347-4ad6-ba55-b2f4cdaa90d5", state: "present" },
  { enrollmentId: "3d0bba02-b347-4ad6-ba55-b2f4cdaa90d5", state: "present" },
  { enrollmentId: "3d0bba02-b347-4ad6-ba55-b2f4cdaa90d5", state: "present" },
  { enrollmentId: "3d0bba02-b347-4ad6-ba55-b2f4cdaa90d5", state: "present" },
  { enrollmentId: "3d0bba02-b347-4ad6-ba55-b2f4cdaa90d5", state: "late" },
];

const demoProgressRecords: DemoProgressRecord[] = [
  {
    enrollmentId: "3d0bba02-b347-4ad6-ba55-b2f4cdaa90d5",
    status: "published",
    publishedAt: "2026-04-05T09:00:00Z",
    skillChecks: {
      braking: true,
      steering: true,
      racingLine: true,
      safetyFlags: true,
      kartControl: false,
    },
  },
  {
    enrollmentId: "3d0bba02-b347-4ad6-ba55-b2f4cdaa90d5",
    status: "published",
    publishedAt: "2026-04-12T09:00:00Z",
    skillChecks: {
      starts: true,
      apexes: true,
      consistency: true,
      racecraft: false,
      tyrePressure: false,
    },
  },
  {
    enrollmentId: "3d0bba02-b347-4ad6-ba55-b2f4cdaa90d5",
    status: "draft",
    publishedAt: null,
    skillChecks: {
      wetLine: false,
      overtaking: false,
    },
  },
];

const demoAnnouncementDeliveries: DemoAnnouncementDelivery[] = [
  {
    announcementId: "1d975785-6280-43c8-a7c0-8c50be6c9b10",
    studentUserId: "4f852574-9f3a-4f62-9656-e6ea929236be",
    cohortId: "2db19644-e0e5-4c7d-89f7-c32297770836",
    cohortName: "Juniors · Thursday",
    status: "published",
    publishedAt: "2026-04-20T08:00:00Z",
    expiresAt: "2026-05-03T00:00:00Z",
    archivedAt: null,
    readAt: null,
    deliveredAt: "2026-04-20T08:00:00Z",
    pinned: true,
  },
  {
    announcementId: "89945171-78d2-4a26-9ef8-32bfcac9c1f5",
    studentUserId: "4f852574-9f3a-4f62-9656-e6ea929236be",
    cohortId: "2db19644-e0e5-4c7d-89f7-c32297770836",
    cohortName: "Juniors · Thursday",
    status: "published",
    publishedAt: "2026-04-10T08:00:00Z",
    expiresAt: "2026-04-17T00:00:00Z",
    archivedAt: null,
    readAt: null,
    deliveredAt: "2026-04-10T08:00:00Z",
    pinned: false,
  },
  {
    announcementId: "eaeeb180-4096-479c-ba0a-e1b3421f4a1f",
    studentUserId: "a8d6af4f-4c2a-4b4a-a871-d14386f63837",
    cohortId: "9e9cb13e-2db4-49ea-bb0f-a357035cc3e7",
    cohortName: "Juniors · Winter",
    status: "published",
    publishedAt: "2026-04-18T08:00:00Z",
    expiresAt: null,
    archivedAt: null,
    readAt: null,
    deliveredAt: "2026-04-18T08:00:00Z",
    pinned: false,
  },
];

const demoNotifications: DemoNotificationItem[] = [
  {
    notificationId: "0df7b650-a115-4e0f-bd49-1e1dc1980c7a",
    studentUserId: "4f852574-9f3a-4f62-9656-e6ea929236be",
    type: "attendance_visible",
    title: "Attendance Updated",
    body: "Your attendance register for Week 2 is now visible.",
    readAt: null,
    createdAt: "2026-04-18T09:00:00Z",
    visibleInFeed: true,
    cohortId: "2db19644-e0e5-4c7d-89f7-c32297770836",
    cohortName: "Juniors · Thursday",
  },
  {
    notificationId: "9e7a6ef9-9910-489a-9287-056cc4bf5837",
    studentUserId: "4f852574-9f3a-4f62-9656-e6ea929236be",
    type: "announcement_published",
    title: "New Announcement",
    body: "A new update has been posted for your cohort.",
    readAt: null,
    createdAt: "2026-04-20T08:01:00Z",
    visibleInFeed: true,
    cohortId: "2db19644-e0e5-4c7d-89f7-c32297770836",
    cohortName: "Juniors · Thursday",
  },
  {
    notificationId: "bb84389f-b8c0-4f2a-bb47-23a4a28af6ce",
    studentUserId: "4f852574-9f3a-4f62-9656-e6ea929236be",
    type: "progress_published",
    title: "Progress Published",
    body: "Your Week 2 progress has been published.",
    readAt: "2026-04-13T12:00:00Z",
    createdAt: "2026-04-12T09:01:00Z",
    visibleInFeed: true,
    cohortId: "2db19644-e0e5-4c7d-89f7-c32297770836",
    cohortName: "Juniors · Thursday",
  },
  {
    notificationId: "683b53b0-959e-4cb7-a7ad-625646dd5d5d",
    studentUserId: "4f852574-9f3a-4f62-9656-e6ea929236be",
    type: "session_reminder",
    title: "Reminder Queued",
    body: "This record exists for delivery debugging only.",
    readAt: null,
    createdAt: "2026-04-21T09:00:00Z",
    visibleInFeed: false,
    cohortId: "2db19644-e0e5-4c7d-89f7-c32297770836",
    cohortName: "Juniors · Thursday",
  },
  {
    notificationId: "d5e056e5-65ef-45dd-8590-d4041d5d7d1d",
    studentUserId: "a8d6af4f-4c2a-4b4a-a871-d14386f63837",
    type: "enrollment_changed",
    title: "Enrollment Updated",
    body: "Your cohort enrollment status changed.",
    readAt: null,
    createdAt: "2026-04-18T09:00:00Z",
    visibleInFeed: true,
    cohortId: "9e9cb13e-2db4-49ea-bb0f-a357035cc3e7",
    cohortName: "Juniors · Winter",
  },
];

export function findDemoUserByIdentifier(identifier: string) {
  const normalizedIdentifier = identifier.trim().toLowerCase();

  return (
    demoUsers.find((user) =>
      [user.email, user.username, user.phone].some((value) => value?.trim().toLowerCase() === normalizedIdentifier),
    ) ?? null
  );
}

export function findDemoUserById(userId: string) {
  return demoUsers.find((user) => user.userId === userId) ?? null;
}

export function findDemoUserByAccessToken(accessToken: string) {
  if (!accessToken.startsWith(ACCESS_TOKEN_PREFIX)) {
    return null;
  }

  return findDemoUserById(accessToken.slice(ACCESS_TOKEN_PREFIX.length));
}

export function issueDemoAuthToken(user: DemoUser, issuedAt = new Date()): AuthToken {
  return {
    accessToken: `${ACCESS_TOKEN_PREFIX}${user.userId}`,
    tokenType: "Bearer",
    expiresAt: new Date(issuedAt.getTime() + ACCESS_TOKEN_TTL_MS).toISOString(),
  };
}

export function buildAuthLoginResponse(user: DemoUser, issuedAt = new Date()): AuthLoginResponse {
  return {
    token: issueDemoAuthToken(user, issuedAt),
    me: toMe(user),
  };
}

export function toMe(user: DemoUser): Me {
  return {
    userId: user.userId,
    role: user.role,
    fullName: user.fullName,
    email: user.email,
    username: user.username,
    phone: user.phone,
    status: user.status,
    ...(user.coachProfile ? { coachProfile: user.coachProfile } : {}),
    ...(user.studentProfile ? { studentProfile: user.studentProfile } : {}),
  };
}

export function buildStudentHome(user: DemoUser, currentTime = new Date()): StudentHome {
  const activeEnrollmentRecord =
    demoEnrollments.find((enrollment) => enrollment.studentUserId === user.userId && enrollment.status === "active") ?? null;

  const nextSessionRecord = activeEnrollmentRecord
    ? [...demoSessions]
        .filter(
          (session) => session.cohortId === activeEnrollmentRecord.cohortId && new Date(session.startsAt).getTime() >= currentTime.getTime(),
        )
        .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime())[0] ?? null
    : null;

  const attendanceSummary = activeEnrollmentRecord
    ? demoAttendanceRecords
        .filter((record) => record.enrollmentId === activeEnrollmentRecord.enrollmentId)
        .reduce(
          (summary, record) => {
            if (record.state === "present") summary.present += 1;
            if (record.state === "late") summary.late += 1;
            if (record.state === "absent") summary.absent += 1;
            return summary;
          },
          { present: 0, late: 0, absent: 0 },
        )
    : { present: 0, late: 0, absent: 0 };

  const publishedProgressRows = activeEnrollmentRecord
    ? demoProgressRecords.filter(
        (record) =>
          record.enrollmentId === activeEnrollmentRecord.enrollmentId &&
          record.status === "published" &&
          record.publishedAt !== null &&
          new Date(record.publishedAt).getTime() <= currentTime.getTime(),
      )
    : [];

  const completedSkillCount = publishedProgressRows.reduce(
    (count, record) => count + Object.values(record.skillChecks).filter(Boolean).length,
    0,
  );
  const totalSkillCount = publishedProgressRows.reduce((count, record) => count + Object.keys(record.skillChecks).length, 0);

  return {
    me: toMe(user),
    activeEnrollment: activeEnrollmentRecord
      ? {
          enrollmentId: activeEnrollmentRecord.enrollmentId,
          cohortId: activeEnrollmentRecord.cohortId,
          cohortName: activeEnrollmentRecord.cohortName,
          status: activeEnrollmentRecord.status,
          enrolledAt: activeEnrollmentRecord.enrolledAt,
          endedAt: activeEnrollmentRecord.endedAt,
        }
      : null,
    nextSession: nextSessionRecord
      ? {
          sessionId: nextSessionRecord.sessionId,
          topic: nextSessionRecord.topic,
          startsAt: nextSessionRecord.startsAt,
          locationName: nextSessionRecord.locationName,
        }
      : null,
    attendanceSummary,
    progressSummary: {
      publishedWeekCount: publishedProgressRows.length,
      completedSkillCount,
      totalSkillCount,
      completionPercent: totalSkillCount === 0 ? 0 : Math.round((completedSkillCount / totalSkillCount) * 100),
    },
    unreadAnnouncementCount: demoAnnouncementDeliveries.filter(
      (announcement) => announcement.studentUserId === user.userId && isVisibleAnnouncement(announcement, currentTime) && announcement.readAt === null,
    ).length,
    unreadNotificationCount: demoNotifications.filter(
      (notification) => notification.studentUserId === user.userId && notification.visibleInFeed && notification.readAt === null,
    ).length,
  };
}

function isVisibleAnnouncement(announcement: DemoAnnouncementDelivery, currentTime: Date) {
  if (announcement.status !== "published" || announcement.archivedAt !== null || announcement.publishedAt === null) {
    return false;
  }

  if (new Date(announcement.publishedAt).getTime() > currentTime.getTime()) {
    return false;
  }

  if (announcement.expiresAt !== null && new Date(announcement.expiresAt).getTime() <= currentTime.getTime()) {
    return false;
  }

  return true;
}
