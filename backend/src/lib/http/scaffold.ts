import type { RequestHandler } from "express";

import { ApiError } from "./errors.js";

export function scaffoldedRoute(code: string, summary: string): RequestHandler {
  return (req, _res, next) => {
    next(
      new ApiError(
        501,
        code,
        `${summary} is scaffolded but not implemented yet.`,
        {
          method: req.method,
          path: req.originalUrl,
          stage: "scaffold",
        },
      ),
    );
  };
}
