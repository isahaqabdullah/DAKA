import { Router } from "express";
import { z } from "zod";

import { buildAuthLoginResponse, findDemoUserByIdentifier, toMe } from "../../data/mock-store.js";
import { requireAuth } from "../../lib/auth.js";
import { ApiError } from "../../lib/http/errors.js";

const loginRequestSchema = z.object({
  identifier: z.string().trim().min(1),
  password: z.string().min(1),
});

export function createAuthRouter() {
  const router = Router();

  router.post("/auth/login", (req, res, next) => {
    const parsedRequest = loginRequestSchema.safeParse(req.body);
    if (!parsedRequest.success) {
      next(
        new ApiError(400, "invalid_request_body", "The request body is invalid.", {
          fieldErrors: parsedRequest.error.flatten().fieldErrors,
        }),
      );
      return;
    }

    const user = findDemoUserByIdentifier(parsedRequest.data.identifier);
    if (!user || user.password !== parsedRequest.data.password) {
      next(new ApiError(401, "invalid_credentials", "The provided credentials are invalid."));
      return;
    }

    if (user.status === "suspended") {
      next(new ApiError(403, "user_suspended", "This user account is suspended."));
      return;
    }

    res.status(200).json(buildAuthLoginResponse(user));
  });

  router.get("/me", requireAuth(), (req, res) => {
    res.status(200).json(toMe(req.authUser!));
  });

  return router;
}
