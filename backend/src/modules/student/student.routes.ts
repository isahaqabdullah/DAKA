import { Router } from "express";

import { buildStudentHome } from "../../data/mock-store.js";
import { requireAuth } from "../../lib/auth.js";
import { scaffoldedRoute } from "../../lib/http/scaffold.js";

export function createStudentRouter() {
  const router = Router();

  router.get("/student/home", requireAuth("student"), (req, res) => {
    res.status(200).json(buildStudentHome(req.authUser!));
  });
  router.get("/student/schedule", scaffoldedRoute("student_schedule_not_implemented", "GET /api/v1/student/schedule"));
  router.get("/student/attendance", scaffoldedRoute("student_attendance_not_implemented", "GET /api/v1/student/attendance"));
  router.get("/student/progress", scaffoldedRoute("student_progress_not_implemented", "GET /api/v1/student/progress"));
  router.get("/student/announcements", scaffoldedRoute("student_announcements_not_implemented", "GET /api/v1/student/announcements"));
  router.post("/student/announcements/:announcementId/read", scaffoldedRoute("student_announcements_read_not_implemented", "POST /api/v1/student/announcements/:announcementId/read"));
  router.get("/student/notifications", scaffoldedRoute("student_notifications_not_implemented", "GET /api/v1/student/notifications"));
  router.post("/student/notifications/:notificationId/read", scaffoldedRoute("student_notifications_read_not_implemented", "POST /api/v1/student/notifications/:notificationId/read"));

  return router;
}
