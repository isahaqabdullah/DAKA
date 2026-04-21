import cors from "cors";
import express from "express";

import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./lib/http/errors.js";
import { requestContextMiddleware } from "./lib/http/middleware.js";
import { apiRouter } from "./routes/index.js";

function resolveCorsOrigin(origin: string) {
  if (origin === "*") return true;
  return origin.split(",").map((value) => value.trim()).filter(Boolean);
}

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(cors({ origin: resolveCorsOrigin(env.CORS_ORIGIN) }));
  app.use(express.json());
  app.use(requestContextMiddleware);

  app.get("/health", (req, res) => {
    res.json({
      status: "ok",
      service: "daka-backend",
      requestId: req.requestId,
    });
  });

  app.use("/api/v1", apiRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
