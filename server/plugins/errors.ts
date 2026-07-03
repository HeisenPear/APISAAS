import { ZodError } from 'zod';

/**
 * Nitro error hook — deux responsabilités :
 *  1. Traduire les ZodErrors en messages lisibles en français.
 *  2. Logger de façon structurée les erreurs serveur 5xx (observabilité prod).
 *     Sans ça, Vercel n'affiche qu'un "[request error] [unhandled]" tronqué,
 *     impossible à diagnostiquer. On émet method + path + statusCode + message
 *     + stack, ce qui rend les logs runtime Vercel exploitables.
 */
export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('error', (error, { event }) => {
    if (!event) return;

    const errObj = error as unknown as {
      statusCode?: number;
      statusMessage?: string;
      data?: unknown;
    };

    // h3 (getValidatedQuery / readValidatedBody) encapsule la ZodError tantôt
    // dans error.cause, tantôt dans error.data selon le chemin. On couvre les
    // trois cas, on renvoie un message lisible ET on VIDE la charge brute —
    // sinon le ZodError complet (schéma d'API + valeurs soumises) fuit au client.
    const dataIsZod =
      errObj.data instanceof ZodError ||
      (!!errObj.data &&
        typeof errObj.data === 'object' &&
        Array.isArray((errObj.data as { issues?: unknown }).issues));
    const zodErr: ZodError | null =
      error.cause instanceof ZodError
        ? error.cause
        : error instanceof ZodError
          ? error
          : dataIsZod
            ? (errObj.data as ZodError)
            : null;

    if (zodErr) {
      const firstIssue = zodErr.issues?.[0];
      let message = 'Données invalides';

      if (firstIssue) {
        const field = firstIssue.path.length > 0 ? firstIssue.path.join('.') : null;
        const msg = firstIssue.message;
        message = field
          ? `Champ "${field}" invalide : ${msg.charAt(0).toLowerCase()}${msg.slice(1)}`
          : msg;
      }

      errObj.statusCode = 400;
      errObj.statusMessage = 'Bad Request';
      error.message = message;
      errObj.data = undefined; // ne JAMAIS renvoyer le ZodError brut au client
      return;
    }

    // Log structuré des erreurs serveur (5xx ou non gérées). Les 4xx attendues
    // (401, 403, 404, 422, 429…) ne sont pas du bruit à logger.
    const statusCode = errObj.statusCode ?? 500;
    if (statusCode >= 500) {
      console.error(
        `[server-error] ${event.method} ${event.path} → ${statusCode}: ${error.message}`,
        error.stack ?? '',
      );
    }
  });
});
