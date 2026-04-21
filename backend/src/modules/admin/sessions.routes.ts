import { Router } from "express";

import { scaffoldedRoute } from "../../lib/http/scaffold.js";

export function createAdminSessionsRouter() {
  const router = Router();

  router.get("/admin/cohorts/:cohortId/sessions", scaffoldedRoute("admin_sessions_list_not_implemented", "GET /api/v1/admin/cohorts/:cohortId/sessions"));
  router.post("/admin/cohorts/:cohortId/sessions", scaffoldedRoute("admin_sessions_create_not_implemented", "POST /api/v1/admin/cohorts/:cohortId/sessions"));
  router.patch("/admin/sessions/:sessionId", scaffoldedRoute("admin_sessions_update_not_implemented", "PATCH /api/v1/admin/sessions/:sessionId"));
  router.post("/admin/sessions/:sessionId/cancel", scaffoldedRoute("admin_sessions_cancel_not_implemented", "POST /api/v1/admin/sessions/:sessionId/cancel"));

  return router;
}
