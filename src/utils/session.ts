const SESSION_KEY = "wanderwise_session_id";

export function getSessionId() {
  if (typeof window === "undefined") return "ssr_anonymous";
  const existing = window.sessionStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const sessionId = `ses_${crypto.randomUUID()}`;
  window.sessionStorage.setItem(SESSION_KEY, sessionId);
  return sessionId;
}
