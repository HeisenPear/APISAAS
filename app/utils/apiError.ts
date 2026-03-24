/**
 * Extract a human-readable message from a $fetch error.
 * Nitro/H3 errors put the real message in `error.data.message`,
 * while generic JS errors use `error.message`.
 */
export function getApiErrorMessage(e: unknown, fallback = 'Une erreur est survenue'): string {
  if (e && typeof e === 'object') {
    const err = e as Record<string, unknown>;
    const data = err.data as Record<string, unknown> | undefined;

    // Erreur 402 plan/limite — message explicite dans data.data.message
    if (data && typeof data === 'object') {
      const inner = data.data as Record<string, unknown> | undefined;
      if (inner?.code === 'PLAN_REQUIRED' || inner?.code === 'LIMIT_REACHED') {
        return (inner.message as string) || fallback;
      }
      // Message direct dans data.message
      if (typeof data.message === 'string' && data.message) {
        return data.message;
      }
    }

    // Standard Error
    if ('message' in err && typeof err.message === 'string') {
      const msg = err.message;
      if (msg && !msg.match(/^\d{3}\s/)) return msg;
    }
  }
  return fallback;
}

/**
 * Vérifie si une erreur est une erreur de plan (402 PLAN_REQUIRED ou LIMIT_REACHED).
 */
export function isPlanError(e: unknown): boolean {
  if (!e || typeof e !== 'object') return false;
  const err = e as Record<string, unknown>;
  const statusCode = err.statusCode ?? (err.data as Record<string, unknown>)?.statusCode;
  if (statusCode !== 402) return false;
  const data = (err.data as Record<string, unknown>)?.data as Record<string, unknown> | undefined;
  return data?.code === 'PLAN_REQUIRED' || data?.code === 'LIMIT_REACHED';
}

/**
 * Extrait les données d'une erreur 402 pour afficher un modal upgrade.
 */
export function getPlanErrorData(e: unknown) {
  if (!e || typeof e !== 'object') return null;
  const err = e as Record<string, unknown>;
  const data = (err.data as Record<string, unknown>)?.data as Record<string, unknown> | undefined;
  if (!data) return null;
  return {
    code: data.code as string,
    feature: data.feature as string | undefined,
    limit: data.limit as string | undefined,
    currentPlan: data.currentPlan as string,
    requiredPlan: data.requiredPlan as string,
    message: data.message as string,
  };
}
