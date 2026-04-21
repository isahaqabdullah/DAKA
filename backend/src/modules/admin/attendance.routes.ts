import { Router } from "express";

import { scaffoldedRoute } from "../../lib/http/scaffold.js";

export function createAdminAttendanceRouter() {
  const router = Router();

  router.get("/admin/sessions/:sessionId/attendance", scaffoldedRoute("admin_attendance_get_not_implemented", "GET /api/v1/admin/sessions/:sessionId/attendance"));
  router.put("/admin/sessions/:sessionId/attendance", scaffoldedRoute("admin_attendance_put_not_implemented", "PUT /api/v1/admin/sessions/:sessionId/attendance"));
  router.post("/admin/sessions/:sessionId/attendance/submit", scaffoldedRoute("admin_attendance_submit_not_implemented", "POST /api/v1/admin/sessions/:sessionId/attendance/submit"));

  return router;
}
