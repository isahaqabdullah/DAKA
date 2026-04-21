import type { AuthenticatedUser } from "../lib/auth.js";

export {};

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      authUser?: AuthenticatedUser;
    }
  }
}
