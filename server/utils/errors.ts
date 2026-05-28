import { createError } from 'h3';

/**
 * HTTP error factory utilities for Nitro API routes.
 * Each function throws an H3Error with the appropriate status code.
 */

/** 404 Not Found */
export function notFound(message = 'Ressource introuvable'): never {
  throw createError({
    statusCode: 404,
    statusMessage: 'Not Found',
    message,
  });
}

/** 403 Forbidden */
export function forbidden(message = 'Acces interdit'): never {
  throw createError({
    statusCode: 403,
    statusMessage: 'Forbidden',
    message,
  });
}

/** 400 Bad Request */
export function badRequest(message = 'Requete invalide'): never {
  throw createError({
    statusCode: 400,
    statusMessage: 'Bad Request',
    message,
  });
}

/** 401 Unauthorized */
export function unauthorized(message = 'Authentification requise'): never {
  throw createError({
    statusCode: 401,
    statusMessage: 'Unauthorized',
    message,
  });
}

/** 409 Conflict */
export function conflict(message = 'Conflit de ressource'): never {
  throw createError({
    statusCode: 409,
    statusMessage: 'Conflict',
    message,
  });
}

/** 429 Too Many Requests */
export function tooManyRequests(message = 'Trop de requetes'): never {
  throw createError({
    statusCode: 429,
    statusMessage: 'Too Many Requests',
    message,
  });
}

/** 500 Internal Server Error */
export function internalError(message = 'Erreur interne du serveur'): never {
  throw createError({
    statusCode: 500,
    statusMessage: 'Internal Server Error',
    message,
  });
}

/**
 * Asserte qu'un resultat de DB n'est pas undefined.
 *
 * Pattern courant :
 *   const [row] = await db.insert(...).returning();
 *   // row peut etre undefined si .returning() retourne []
 *   // (rare mais possible : constraint violation silencieuse,
 *   //  filter where qui ne matche rien, etc.)
 *
 * Usage :
 *   const row = requireRow(await db.insert(...).returning(), 'Echec creation');
 */
export function requireRow<T>(rows: T[], message = 'Resultat DB inattendu'): T {
  const row = rows[0];
  if (!row) internalError(message);
  return row;
}
