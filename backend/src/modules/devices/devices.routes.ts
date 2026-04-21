import { Router } from "express";

import { scaffoldedRoute } from "../../lib/http/scaffold.js";

export function createDevicesRouter() {
  const router = Router();

  router.post("/devices", scaffoldedRoute("devices_register_not_implemented", "POST /api/v1/devices"));

  return router;
}
