import type { RequestHandler } from "express";

import { findDemoUserByAccessToken, type DemoUser } from "../data/mock-store.js";
import { ApiError } from "./http/errors.js";

export type AuthenticatedUser = DemoUser;

export function requireAuth(expectedRole?: DemoUser["role"]): RequestHandler {
  return (req, _res, next) => {
    const accessToken = extractBearerAccessToken(req.header("authorization"));
    if (!accessToken) {
      next(new ApiError(401, "authentication_required", "A valid Bearer access token is required."));
      return;
    }

    const user = findDemoUserByAccessToken(accessToken);
    if (!user) {
      next(new ApiError(401, "invalid_access_token", "The provided access token is invalid."));
      return;
    }

    if (user.status === "suspended") {
      next(new ApiError(403, "user_suspended", "This user account is suspended."));
      return;
    }

    if (expectedRole && user.role !== expectedRole) {
      next(new ApiError(403, "forbidden", "You do not have access to this resource."));
      return;
    }

    req.authUser = user;
    next();
  };
}

function extractBearerAccessToken(authorizationHeader: string | undefined) {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.trim().split(/\s+/, 2);
  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}
