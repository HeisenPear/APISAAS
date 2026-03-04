/** Escape PostgreSQL ILIKE special characters */
export function escapeIlike(s: string): string {
  return s.replace(/[%_\\]/g, '\\$&');
}
