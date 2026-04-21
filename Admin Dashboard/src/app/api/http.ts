import type { ApiErrorResponse } from "./contracts";

const DEFAULT_API_BASE_URL = "http://localhost:4000/api/v1";

export class ApiClient {
  constructor(private readonly baseUrl = import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL) {}

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");

    const hasBody = init.body != null && !headers.has("Content-Type");
    if (hasBody) headers.set("Content-Type", "application/json");

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers,
    });

    if (!response.ok) {
      const errorBody = (await response.json().catch(() => null)) as ApiErrorResponse | null;
      const message = errorBody?.error.message ?? `Request failed with status ${response.status}`;
      throw new Error(message);
    }

    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }

  get<T>(path: string, init?: Omit<RequestInit, "method">) {
    return this.request<T>(path, { ...init, method: "GET" });
  }

  post<T>(path: string, body?: unknown, init?: Omit<RequestInit, "method" | "body">) {
    return this.request<T>(path, {
      ...init,
      method: "POST",
      body: body == null ? undefined : JSON.stringify(body),
    });
  }

  patch<T>(path: string, body?: unknown, init?: Omit<RequestInit, "method" | "body">) {
    return this.request<T>(path, {
      ...init,
      method: "PATCH",
      body: body == null ? undefined : JSON.stringify(body),
    });
  }

  put<T>(path: string, body?: unknown, init?: Omit<RequestInit, "method" | "body">) {
    return this.request<T>(path, {
      ...init,
      method: "PUT",
      body: body == null ? undefined : JSON.stringify(body),
    });
  }
}

export const apiClient = new ApiClient();
