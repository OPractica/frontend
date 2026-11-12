import { clearTokens, getTokens, saveTokens, type Tokens } from "./tokens";

const LOCAL_API_URL = "http://localhost:8000/api/v1";
const PRODUCTION_API_URL = "https://opractica-office-booking-api.onrender.com/api/v1";

const API_URL =
  import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? LOCAL_API_URL : PRODUCTION_API_URL);

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function send(path: string, options: RequestInit): Promise<Response> {
  const tokens = getTokens();
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(tokens ? { Authorization: `Bearer ${tokens.access_token}` } : {}),
      ...options.headers,
    },
  });
}

// Refresh tokenul e de unică folosință: dacă mai multe cereri primesc 401 deodată,
// toate așteaptă aceeași reînnoire, nu pornește fiecare una.
let refreshing: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  const tokens = getTokens();
  if (!tokens) return false;
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: tokens.refresh_token }),
  });
  if (!res.ok) {
    clearTokens();
    return false;
  }
  saveTokens((await res.json()) as Tokens);
  return true;
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res = await send(path, options);

  // Token expirat: se cere unul nou și se repetă cererea o singură dată
  const canRefresh = path !== "/auth/login" && path !== "/auth/refresh" && getTokens() !== null;
  if (res.status === 401 && canRefresh) {
    refreshing ??= refreshTokens().finally(() => {
      refreshing = null;
    });
    if (await refreshing) res = await send(path, options);
  }

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = typeof data?.detail === "string" ? data.detail : "Request failed";
    throw new ApiError(res.status, detail);
  }
  return data as T;
}