import { Router } from "express";

import { scaffoldedRoute } from "../../lib/http/scaffold.js";

export function createAdminStudentsRouter() {
  const router = Router();

  router.get("/admin/students", scaffoldedRoute("admin_students_list_not_implemented", "GET /api/v1/admin/students"));
  router.post("/admin/students", scaffoldedRoute("admin_students_create_not_implemented", "POST /api/v1/admin/students"));
  router.patch("/admin/students/:studentUserId", scaffoldedRoute("admin_students_update_not_implemented", "PATCH /api/v1/admin/students/:studentUserId"));
  router.post("/admin/cohorts/:cohortId/enrollments", scaffoldedRoute("admin_enrollments_create_not_implemented", "POST /api/v1/admin/cohorts/:cohortId/enrollments"));
  router.patch("/admin/enrollments/:enrollmentId", scaffoldedRoute("admin_enrollments_update_not_implemented", "PATCH /api/v1/admin/enrollments/:enrollmentId"));
  router.post("/admin/enrollments/:enrollmentId/transfer", scaffoldedRoute("admin_enrollments_transfer_not_implemented", "POST /api/v1/admin/enrollments/:enrollmentId/transfer"));

  return router;
}
