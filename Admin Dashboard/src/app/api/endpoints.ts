export const authApi = {
  login: () => "/auth/login",
  me: () => "/me",
};

export const adminApi = {
  cohorts: () => "/admin/cohorts",
  cohort: (cohortId: string) => `/admin/cohorts/${cohortId}`,
  archiveCohort: (cohortId: string) => `/admin/cohorts/${cohortId}/archive`,
  students: () => "/admin/students",
  student: (studentUserId: string) => `/admin/students/${studentUserId}`,
  cohortEnrollments: (cohortId: string) => `/admin/cohorts/${cohortId}/enrollments`,
  enrollment: (enrollmentId: string) => `/admin/enrollments/${enrollmentId}`,
  transferEnrollment: (enrollmentId: string) => `/admin/enrollments/${enrollmentId}/transfer`,
  cohortSessions: (cohortId: string) => `/admin/cohorts/${cohortId}/sessions`,
  session: (sessionId: string) => `/admin/sessions/${sessionId}`,
  cancelSession: (sessionId: string) => `/admin/sessions/${sessionId}/cancel`,
  sessionAttendance: (sessionId: string) => `/admin/sessions/${sessionId}/attendance`,
  submitSessionAttendance: (sessionId: string) => `/admin/sessions/${sessionId}/attendance/submit`,
  cohortProgress: (cohortId: string, syllabusWeekId: string) => `/admin/cohorts/${cohortId}/progress/${syllabusWeekId}`,
  publishCohortProgress: (cohortId: string, syllabusWeekId: string) => `/admin/cohorts/${cohortId}/progress/${syllabusWeekId}/publish`,
  announcements: () => "/admin/announcements",
  announcement: (announcementId: string) => `/admin/announcements/${announcementId}`,
  publishAnnouncement: (announcementId: string) => `/admin/announcements/${announcementId}/publish`,
  archiveAnnouncement: (announcementId: string) => `/admin/announcements/${announcementId}/archive`,
};

export const studentApi = {
  home: () => "/student/home",
  schedule: () => "/student/schedule",
  attendance: () => "/student/attendance",
  progress: () => "/student/progress",
  announcements: () => "/student/announcements",
  markAnnouncementRead: (announcementId: string) => `/student/announcements/${announcementId}/read`,
  notifications: () => "/student/notifications",
  markNotificationRead: (notificationId: string) => `/student/notifications/${notificationId}/read`,
};

export const deviceApi = {
  register: () => "/devices",
};
