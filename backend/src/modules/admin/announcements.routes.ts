import { Router } from "express";

import { scaffoldedRoute } from "../../lib/http/scaffold.js";

export function createAdminAnnouncementsRouter() {
  const router = Router();

  router.get("/admin/announcements", scaffoldedRoute("admin_announcements_list_not_implemented", "GET /api/v1/admin/announcements"));
  router.post("/admin/announcements", scaffoldedRoute("admin_announcements_create_not_implemented", "POST /api/v1/admin/announcements"));
  router.patch("/admin/announcements/:announcementId", scaffoldedRoute("admin_announcements_update_not_implemented", "PATCH /api/v1/admin/announcements/:announcementId"));
  router.post("/admin/announcements/:announcementId/publish", scaffoldedRoute("admin_announcements_publish_not_implemented", "POST /api/v1/admin/announcements/:announcementId/publish"));
  router.post("/admin/announcements/:announcementId/archive", scaffoldedRoute("admin_announcements_archive_not_implemented", "POST /api/v1/admin/announcements/:announcementId/archive"));

  return router;
}
