import { Router } from "express";

import { createAdminAnnouncementsRouter } from "../modules/admin/announcements.routes.js";
import { createAdminAttendanceRouter } from "../modules/admin/attendance.routes.js";
import { createAdminCohortsRouter } from "../modules/admin/cohorts.routes.js";
import { createAdminProgressRouter } from "../modules/admin/progress.routes.js";
import { createAdminSessionsRouter } from "../modules/admin/sessions.routes.js";
import { createAdminStudentsRouter } from "../modules/admin/students.routes.js";
import { createAuthRouter } from "../modules/auth/auth.routes.js";
import { createDevicesRouter } from "../modules/devices/devices.routes.js";
import { createStudentRouter } from "../modules/student/student.routes.js";

export const apiRouter = Router();

apiRouter.get("/", (_req, res) => {
  res.json({
    service: "daka-backend",
    status: "scaffolded",
    basePath: "/api/v1",
    routeGroups: [
      "auth",
      "admin/cohorts",
      "admin/students",
      "admin/sessions",
      "admin/attendance",
      "admin/progress",
      "admin/announcements",
      "student",
      "devices",
    ],
  });
});

apiRouter.use(createAuthRouter());
apiRouter.use(createAdminCohortsRouter());
apiRouter.use(createAdminStudentsRouter());
apiRouter.use(createAdminSessionsRouter());
apiRouter.use(createAdminAttendanceRouter());
apiRouter.use(createAdminProgressRouter());
apiRouter.use(createAdminAnnouncementsRouter());
apiRouter.use(createStudentRouter());
apiRouter.use(createDevicesRouter());
