export function generateId(): string {
  // Try to use the native secure crypto API if available (HTTPS or Localhost)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for non-secure contexts (like local mobile testing via HTTP)
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}