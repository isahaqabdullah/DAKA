import { Router } from "express";

import { scaffoldedRoute } from "../../lib/http/scaffold.js";

export function createAdminProgressRouter() {
  const router = Router();

  router.get("/admin/cohorts/:cohortId/progress/:syllabusWeekId", scaffoldedRoute("admin_progress_get_not_implemented", "GET /api/v1/admin/cohorts/:cohortId/progress/:syllabusWeekId"));
  router.put("/admin/cohorts/:cohortId/progress/:syllabusWeekId", scaffoldedRoute("admin_progress_put_not_implemented", "PUT /api/v1/admin/cohorts/:cohortId/progress/:syllabusWeekId"));
  router.post("/admin/cohorts/:cohortId/progress/:syllabusWeekId/publish", scaffoldedRoute("admin_progress_publish_not_implemented", "POST /api/v1/admin/cohorts/:cohortId/progress/:syllabusWeekId/publish"));

  return router;
}
