import { appliquerDesinscription, resoudreCategorie } from '~~/server/utils/desinscription';

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/notif/unsubscribe-email?u=<userId>&t=<token>[&c=marketing]
//
// Désinscription « one-click » RFC 8058. Gmail et Yahoo exigent, sur tout
// envoi de masse, un en-tête `List-Unsubscribe-Post` que LEUR serveur appelle
// en POST — sans navigateur, sans session, sans que l'apiculteur voie quoi que
// ce soit. La réponse doit donc être un 200 nu, pas une page.
//
// Un token invalide renvoie 200 lui aussi : ces appels sont automatiques, un
// 4xx ferait retenter le fournisseur en boucle sans rien changer. La coupure
// réelle, elle, reste protégée par le HMAC dans appliquerDesinscription().
// ═══════════════════════════════════════════════════════════════════════════

// Une PANNE de base est le seul cas où l'on ne répond PAS 200 : la coupure n'a
// pas eu lieu, et c'est précisément la situation où l'on VEUT que le
// fournisseur retente. Répondre 200 ici reviendrait à lui dire « c'est fait »
// alors que l'apiculteur reste inscrit — l'erreur exacte que corrige le retrait
// du `.catch()` silencieux dans `appliquerDesinscription`.

export default defineEventHandler(async (event) => {
  const q = getQuery(event);
  await appliquerDesinscription(String(q.u ?? ''), String(q.t ?? ''), resoudreCategorie(q.c));
  setResponseStatus(event, 200);
  return null;
});
