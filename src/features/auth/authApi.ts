/**
 * Autentificarea prin backend (vezi API_CONTRACT.md, secțiunea Auth):
 *   register -> POST /auth/register, apoi logare automată
 *   signIn   -> POST /auth/login, apoi GET /auth/me
 *   signOut  -> POST /auth/logout
 */
import { ApiError, request } from "../../shared/api/client";
import { clearTokens, getTokens, saveTokens, type Tokens } from "../../shared/api/tokens";

export type User = { email: string; name: string };
export type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

/**
 * Domeniile acceptate la înregistrare. Listă goală = orice adresă.
 * Ca să restrângi, scrie domeniile, ex.: ["outlook.com", "orange.md"].
 */
export const ALLOWED_DOMAINS: string[] = [];

type ApiUser = { id: number; email: string; full_name: string };

export const cleanEmail = (email: string) => email.trim().toLowerCase();

export function isAllowedEmail(email: string): boolean {
  const domain = cleanEmail(email).split("@")[1] ?? "";
  if (!domain.includes(".")) return false;
  return ALLOWED_DOMAINS.length === 0 || ALLOWED_DOMAINS.includes(domain);
}

// "ana.popescu@outlook.com" -> "Ana Popescu"
export function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? email;
  const words = local.split(/[._-]+/).filter(Boolean);
  const name = words.map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
  return name || email;
}

export async function signIn(emailInput: string, password: string): Promise<Result<{ user: User }>> {
  try {
    const tokens = await request<Tokens>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: cleanEmail(emailInput), password }),
    });
    saveTokens(tokens);

    const me = await request<ApiUser>("/auth/me");
    return { ok: true, user: { email: me.email, name: me.full_name } };
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) return { ok: false, error: "Wrong e-mail or password." };
    return { ok: false, error: "Sign in failed. Try again." };
  }
}

export async function register(emailInput: string, password: string, fullName: string): Promise<Result<{ user: User }>> {
  const email = cleanEmail(emailInput);
  if (!isAllowedEmail(email)) return { ok: false, error: "Enter a valid e-mail address." };
  if (password.length < 6) return { ok: false, error: "The password needs at least 6 characters." };

  try {
    await request<ApiUser>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, full_name: fullName.trim() || nameFromEmail(email) }),
    });
  } catch (e) {
    if (e instanceof ApiError && e.status === 409) {
      return { ok: false, error: "This e-mail is already registered. Sign in instead." };
    }
    return { ok: false, error: "Registration failed. Try again." };
  }
  // Înregistrarea nu întoarce tokenuri, deci urmează imediat logarea
  return signIn(email, password);
}

export async function signOut(): Promise<void> {
  const tokens = getTokens();
  clearTokens();
  if (!tokens) return;
  try {
    await request("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refresh_token: tokens.refresh_token }),
    });
  } catch {
    /* tokenurile sunt deja șterse din browser; serverul le lasă să expire */
  }
}