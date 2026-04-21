export type ApiListResponse<T> = {
  items: T[];
  total: number;
  nextCursor: string | null;
};

export type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
    requestId: string;
    details?: Record<string, unknown>;
  };
};
