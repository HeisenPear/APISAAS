/**
 * Valide une cible de redirection interne issue d'un query param.
 * Empêche les redirections ouvertes (open redirect) : seul un chemin
 * interne absolu est accepté (« /tarifs?... »), jamais « //host » ni une
 * URL absolue (« https://… »).
 */
export function safeInternalPath(value: unknown): string | null {
  if (typeof value !== 'string' || value === '') return null;
  if (!value.startsWith('/') || value.startsWith('//')) return null;
  if (value.includes('://') || /[\n\r\t]/.test(value)) return null;
  return value;
}
