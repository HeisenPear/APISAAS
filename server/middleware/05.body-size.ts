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

/** Routes de téléversement, reconnaissables à leur préfixe. */
export const CHEMINS_FICHIER = ['/api/photos/upload', '/api/profils/logo'];

/**
 * Routes qui portent un fichier SANS être reconnaissables à un préfixe.
 *
 * ⚠️ CE TABLEAU EXISTE POUR UNE PANNE INVISIBLE. L'envoi d'une facture poste le
 * PDF en base64 — et le base64 gonfle de ~33 %. La route retombait sur la
 * limite ordinaire de 1 Mo : au-delà d'environ 750 Ko de PDF, l'envoi partait
 * en 413. Une facture d'une page chargée y arrive, deux pages en sont
 * certaines. Personne ne le voyait, faute de trace d'envoi.
 *
 * On ne pouvait pas l'ajouter à `CHEMINS_FICHIER` : l'identifiant est AU MILIEU
 * du chemin, et un `startsWith('/api/finances/factures/')` aurait aussi ouvert
 * la MODIFICATION d'une facture — du JSON de formulaire, qui n'a aucune raison
 * de dépasser 1 Mo. On vise donc la route, exactement.
 *
 * ⚠️ 6 Mo est le plafond APPLICATIF. Vercel borne à ~4,5 Mo en amont : un PDF
 * qui dépasse doit être ALLÉGÉ (échelle du rendu, qualité JPEG), pas autorisé
 * plus haut ici — la limite d'infrastructure ne se relève pas depuis le code.
 */
export const MOTIFS_FICHIER = [/^\/api\/finances\/factures\/[^/]+\/email$/];

/** Vraie source de vérité du plafond : les bancs s'y branchent, sans recopie. */
export function routeDeFichier(pathname: string): boolean {
  return (
    CHEMINS_FICHIER.some((p) => pathname.startsWith(p)) ||
    MOTIFS_FICHIER.some((m) => m.test(pathname))
  );
}

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

  const limit = routeDeFichier(pathname) ? UPLOAD_LIMIT : DEFAULT_LIMIT;

  if (contentLength > limit) {
    throw createError({
      statusCode: 413,
      statusMessage: 'Payload Too Large',
      message: `Taille maximum : ${Math.round(limit / 1024 / 1024)} Mo`,
    });
  }
});
