import type { ErrorRequestHandler, RequestHandler } from "express";

type ErrorEnvelope = {
  error: {
    code: string;
    message: string;
    requestId: string;
    details?: Record<string, unknown>;
  };
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: Record<string, unknown>;

  constructor(status: number, code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function formatErrorResponse(error: unknown, requestId: string): { status: number; body: ErrorEnvelope } {
  if (error instanceof ApiError) {
    return {
      status: error.status,
      body: {
        error: {
          code: error.code,
          message: error.message,
          requestId,
          ...(error.details ? { details: error.details } : {}),
        },
      },
    };
  }

  return {
    status: 500,
    body: {
      error: {
        code: "internal_error",
        message: "An unexpected error occurred.",
        requestId,
      },
    },
  };
}

export const notFoundHandler: RequestHandler = (req, res) => {
  const payload = formatErrorResponse(
    new ApiError(404, "not_found", `No route matches ${req.method} ${req.originalUrl}`),
    req.requestId,
  );

  res.status(payload.status).json(payload.body);
};

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const payload = formatErrorResponse(error, req.requestId ?? "unknown");
  res.status(payload.status).json(payload.body);
};
