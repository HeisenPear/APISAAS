/**
 * Extract a human-readable message from a $fetch error.
 * Nitro/H3 errors put the real message in `error.data.message`,
 * while generic JS errors use `error.message`.
 */
export function getApiErrorMessage(e: unknown, fallback = 'Une erreur est survenue'): string {
  if (e && typeof e === 'object') {
    const err = e as Record<string, unknown>;
    const data = err.data as Record<string, unknown> | undefined;

    // Erreur 402 plan/limite — message explicite dans data.data.message.
    //
    // `RUCHE_VERROUILLEE` figure dans la liste depuis qu'on s'est aperçu qu'il
    // en était absent : le verrou de cheptel porte la phrase la plus soignée de
    // tout le gating (« Cette ruche reste enregistrée : un abonnement vous rend
    // l'intégralité de votre cheptel, là où vous l'aviez laissé ») et elle était
    // remplacée par le `statusMessage` de trois mots, « Ruche verrouillée ».
    if (data && typeof data === 'object') {
      const inner = data.data as Record<string, unknown> | undefined;
      if (
        inner?.code === 'PLAN_REQUIRED' ||
        inner?.code === 'LIMIT_REACHED' ||
        inner?.code === 'RUCHE_VERROUILLEE'
      ) {
        return (inner.message as string) || fallback;
      }
      // Message direct dans data.message
      if (typeof data.message === 'string' && data.message) {
        return cleanMessage(data.message, fallback);
      }
    }

    // Standard Error
    if ('message' in err && typeof err.message === 'string') {
      const msg = err.message;
      if (msg && !msg.match(/^\d{3}\s/)) return cleanMessage(msg, fallback);
    }
  }
  return fallback;
}

/**
 * Sanitise un message d'erreur : détecte les JSON bruts (tableaux Zod, objets)
 * et retourne soit le premier message lisible, soit le fallback.
 */
function cleanMessage(msg: string, fallback: string): string {
  const trimmed = msg.trim();

  // Détecte un tableau JSON (erreurs Zod brutes)
  if (trimmed.startsWith('[')) {
    try {
      const issues = JSON.parse(trimmed) as Array<{ message?: string; path?: string[] }>;
      if (Array.isArray(issues) && issues.length > 0) {
        const first = issues[0];
        const field = first?.path && first.path.length > 0 ? first.path.join('.') : null;
        const text = first?.message ?? 'Données invalides';
        return field
          ? `Champ "${field}" invalide : ${text.charAt(0).toLowerCase()}${text.slice(1)}`
          : text;
      }
    } catch {
      // pas du JSON valide, on continue
    }
    return fallback;
  }

  // Détecte un objet JSON brut
  if (trimmed.startsWith('{')) {
    try {
      const obj = JSON.parse(trimmed) as Record<string, unknown>;
      if (typeof obj.message === 'string' && obj.message) return obj.message;
    } catch {
      // pas du JSON valide, on continue
    }
    return fallback;
  }

  return trimmed || fallback;
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
