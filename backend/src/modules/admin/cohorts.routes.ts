import { Router } from "express";

import { scaffoldedRoute } from "../../lib/http/scaffold.js";

export function createAdminCohortsRouter() {
  const router = Router();

  router.get("/admin/cohorts", scaffoldedRoute("admin_cohorts_list_not_implemented", "GET /api/v1/admin/cohorts"));
  router.post("/admin/cohorts", scaffoldedRoute("admin_cohorts_create_not_implemented", "POST /api/v1/admin/cohorts"));
  router.patch("/admin/cohorts/:cohortId", scaffoldedRoute("admin_cohorts_update_not_implemented", "PATCH /api/v1/admin/cohorts/:cohortId"));
  router.post("/admin/cohorts/:cohortId/archive", scaffoldedRoute("admin_cohorts_archive_not_implemented", "POST /api/v1/admin/cohorts/:cohortId/archive"));

  return router;
}
