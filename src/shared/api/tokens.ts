const KEY = "workplace-booking.tokens.v1";

export type Tokens = { access_token: string; refresh_token: string };

export function getTokens(): Tokens | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Tokens) : null;
  } catch {
    return null;
  }
}

export function saveTokens(tokens: Tokens) {
  window.localStorage.setItem(KEY, JSON.stringify(tokens));
}

export function clearTokens() {
  window.localStorage.removeItem(KEY);
}