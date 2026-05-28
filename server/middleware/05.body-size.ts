import { defineEventHandler, getRequestURL, getHeader, createError } from 'h3';

/**
 * Limite de taille du body pour eviter le DoS par upload de payloads enormes.
 *
 * On verifie `Content-Length` *avant* de lire le body (lecture lazy par les routes
 * via readBody/readFormData). Les uploads d'images legitimes (logo, photos)
 * tombent sous la limite generale ; ils ont leur propre verification metier.
 *
 * Note : Content-Length est fourni par le client et peut etre absent (chunked
 * transfer). Pour une vraie protection, completer avec une lecture streamee
 * limitee — mais Vercel borne deja le payload a 4.5 MB (Hobby) / 5 MB (Pro)
 * cote infrastructure, donc on rajoute une couche applicative cooperative.
 */
const DEFAULT_LIMIT = 1 * 1024 * 1024; // 1 MB pour la majorite des routes JSON
const UPLOAD_LIMIT = 6 * 1024 * 1024; // 6 MB pour les routes upload (photos = 5 MB max)

const UPLOAD_PATHS = ['/api/photos/upload', '/api/profils/logo'];

export default defineEventHandler((event) => {
  const url = getRequestURL(event);
  const pathname = url.pathname;

  if (!pathname.startsWith('/api/')) return;
  if (event.method !== 'POST' && event.method !== 'PUT' && event.method !== 'PATCH') return;

  const contentLengthRaw = getHeader(event, 'content-length');
  if (!contentLengthRaw) return; // absent (chunked) — Vercel bornera

  const contentLength = Number(contentLengthRaw);
  if (!Number.isFinite(contentLength) || contentLength < 0) {
    throw createError({ statusCode: 400, message: 'Content-Length invalide' });
  }

  const limit = UPLOAD_PATHS.some((p) => pathname.startsWith(p)) ? UPLOAD_LIMIT : DEFAULT_LIMIT;

  if (contentLength > limit) {
    throw createError({
      statusCode: 413,
      statusMessage: 'Payload Too Large',
      message: `Taille maximum : ${Math.round(limit / 1024 / 1024)} Mo`,
    });
  }
});
