const TOKEN_KEY = "alfsight-admin-token";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Private mode or blocked storage: the token lasts for this page only.
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Nothing stored.
  }
}

/** Headers that identify the dashboard user to the API. */
export function authHeaders(token = getToken()): Record<string, string> {
  if (import.meta.env.DEV) return { "x-dev-user-id": "dev-user-1" };
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function redirectToLogin() {
  const next = window.location.pathname + window.location.search;
  window.location.href = `/login?next=${encodeURIComponent(next)}`;
}
