import { Expense } from "@/types";

const REQUEST_TIMEOUT_MS = 15_000;

// Keep this in sync with the backend's crud.expense.DEFAULT_LIST_LIMIT.
export const DEFAULT_PAGE_LIMIT = 100;

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export interface ExpenseListResult {
  expenses: Expense[];
  total: number;
  limit: number;
  offset: number;
}

interface GetExpensesOptions {
  limit?: number;
  offset?: number;
}

export interface ExpenseInput {
  amount: string;
  category: string;
  incurred_date?: string;
  description?: string;
}

/**
 * Resolve the API base URL at call-time (not module-load-time) so that
 * `next build` works without NEXT_PUBLIC_API_URL set (the build collects
 * server-component page data and would otherwise throw during build).
 *
 * - Dev:        defaults to http://localhost:8000/api/v1
 * - Production: requires NEXT_PUBLIC_API_URL to be set; throws a clear
 *               error if missing so the UI surfaces the misconfiguration
 *               instead of silently failing.
 */
function getApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (raw && raw.trim()) return raw.trim();
  if (process.env.NODE_ENV !== "production") return "http://localhost:8000/api/v1";
  throw new ApiError(500, "NEXT_PUBLIC_API_URL is missing.");
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const API = getApiBase();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${API}${path}`, {
      headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
      // SSR: always revalidate on each request so SSR page isn't stale.
      cache: "no-store",
      signal: controller.signal,
      ...init,
    });

    if (res.status === 204) return undefined as T;

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      // Try to surface a friendly detail from FastAPI/Pydantic responses.
      let message = text || res.statusText;
      try {
        const json = JSON.parse(text);
        if (json && typeof json === "object" && typeof json.detail === "string") {
          message = json.detail;
        } else if (Array.isArray(json?.detail)) {
          message = json.detail.map((e: { msg?: string; loc?: string[] }) =>
            e?.loc?.length ? `${e.loc.join(".")}: ${e.msg}` : e?.msg
          ).join("; ");
        }
      } catch {
        /* keep raw text */
      }
      throw new ApiError(res.status, message);
    }

    return res.json() as Promise<T>;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError(504, "Request timed out. The server may be restarting — please try again.");
    }
    if (err instanceof TypeError) {
      throw new ApiError(503, "Could not reach the server. Is the backend running?");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

function buildQuery(params: Record<string, string | number | undefined>) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined) usp.set(k, String(v));
  });
  const qs = usp.toString();
  return qs ? `?${qs}` : "";
}

export async function getExpenses(options: GetExpensesOptions = {}): Promise<ExpenseListResult> {
  const limit = options.limit ?? DEFAULT_PAGE_LIMIT;
  const offset = options.offset ?? 0;
  return request<ExpenseListResult>(`/expenses${buildQuery({ limit, offset })}`);
}

export async function createExpense(input: ExpenseInput): Promise<Expense> {
  return request<Expense>("/expenses", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateExpense(id: number, input: ExpenseInput): Promise<Expense> {
  return request<Expense>(`/expenses/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteExpense(id: number): Promise<void> {
  return request<void>(`/expenses/${id}`, { method: "DELETE" });
}
