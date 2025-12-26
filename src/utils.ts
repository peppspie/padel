/**
 * Generates a unique identifier.
 * Uses the native Web Crypto API if available (secure contexts),
 * falling back to a timestamp-based random string for non-secure contexts.
 * 
 * @returns {string} A unique 36-character UUID or a 16+ character fallback string.
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
