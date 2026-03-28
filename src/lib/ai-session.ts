/**
 * AI SESSION MANAGEMENT
 * Generates and persists a session ID for grouping multi-turn AI conversations.
 * @see src/lib/ai-logger.ts
 */

const SESSION_STORAGE_KEY = 'ai_session_id';

// Generate a random UUID-like string
export function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Retrieves the current session action from localStorage or generates a new one.
 * Persists for the duration of the browser session.
 */
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return generateSessionId();
  
  let sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  }
  return sessionId;
}

/**
 * Forces a reset of the AI session (e.g. after a hard logout)
 */
export function startNewSession(): string {
  const newSessionId = generateSessionId();
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_STORAGE_KEY, newSessionId);
  }
  return newSessionId;
}
