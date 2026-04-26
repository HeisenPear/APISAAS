import { ZodError } from 'zod';

/**
 * Nitro error hook — transforme les ZodErrors en messages lisibles en français.
 * Sans ce plugin, une validation Zod échouée retourne un tableau JSON brut
 * au lieu d'un message clair (ex: "Le champ 'email' est invalide").
 */
export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('error', (error, { event }) => {
    if (!event) return;

    const cause = error.cause ?? error;

    if (cause instanceof ZodError) {
      const firstIssue = cause.issues[0];
      let message = 'Données invalides';

      if (firstIssue) {
        const field = firstIssue.path.length > 0 ? firstIssue.path.join('.') : null;
        const msg = firstIssue.message;

        if (field) {
          message = `Champ "${field}" invalide : ${msg.charAt(0).toLowerCase()}${msg.slice(1)}`;
        } else {
          message = msg;
        }
      }

      // Remplacer le message de l'erreur par le message lisible
      const err = error as unknown as { statusCode?: number; statusMessage?: string };
      err.statusCode = 400;
      err.statusMessage = 'Bad Request';
      error.message = message;
    }
  });
});
