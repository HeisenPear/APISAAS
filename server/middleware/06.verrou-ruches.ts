import { createError, defineEventHandler, getHeader, getRequestURL, readBody } from 'h3';
import { inArray, and, eq } from 'drizzle-orm';
import { ruches } from '~~/server/database/schema';
import { isAdminEmail } from '~~/app/config/admin';
import { getLimit, getPlanConfig, minimumPlanForLimit } from '~~/app/config/plans';
import { idsRuchesAutorisees } from '~~/server/utils/quotaRuches';

/**
 * VERROU DE CHEPTEL — au-delà du plafond du plan, les ruches excédentaires
 * deviennent INACCESSIBLES (ni consultation, ni écriture), sans jamais être
 * supprimées. L'abonnement les rend toutes, intactes.
 *
 * Pourquoi un middleware et pas une garde par route : 32 routes manipulent un
 * `rucheId` (17 par le chemin `/api/ruches/<id>`, 15 par le corps). Une garde
 * répétée 32 fois est une garde qu'on oubliera à la 33ᵉ. Ici, toute route qui
 * nomme une ruche est couverte, y compris celles qui n'existent pas encore.
 *
 * Pourquoi le rang 06 : `05.body-size` valide `Content-Length` AVANT nous, donc
 * lire le corps ici ne contourne pas la protection anti-DoS. Placé plus tôt, ce
 * fichier parserait des payloads non bornés. h3 met le corps parsé en cache
 * (`ParsedBodySymbol`) : les routes le reliront sans surcoût ni double lecture.
 *
 * Coût : ZÉRO requête quand l'URL et le corps ne nomment aucune ruche, et zéro
 * aussi dès que le plan est illimité (Pro/Expert sortent avant toute requête).
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CHEMIN_RUCHE = /^\/api\/ruches\/([0-9a-f-]{36})(?:\/|$)/i;

/** `rucheId`, `rucheIds`, `rucheSourceId`, `rucheDestinationId` — au pluriel ou non. */
const CLE_RUCHE = /^ruche(?:Source|Destination)?Ids?$/;

/**
 * FAUT-IL LIRE LE CORPS DE CETTE REQUÊTE ?
 *
 * ⚠️ CETTE DÉCISION S'ÉCRIVAIT À L'ENVERS, ET C'ÉTAIT UN CONTOURNEMENT COMPLET
 * DU VERROU.
 *
 * La règle était : « lire le corps SI le Content-Type dit application/json ».
 * Un en-tête absent ne dit pas application/json, donc on ne lisait pas, donc
 * `candidats` restait vide, donc le middleware sortait immédiatement — et les
 * quinze routes qui nomment la ruche DANS LE CORPS redevenaient libres.
 *
 * Sauf que h3 se moque de l'en-tête pour parser : `readBody` teste
 * `application/json`, puis form-urlencoded, puis `text/`, et TOMBE SUR UN
 * `else` qui parse le JSON quand même. Une requête sans Content-Type est donc
 * parfaitement lue par la route, et parfaitement ignorée par le verrou.
 *
 * Concrètement, sur un compte Découverte au-delà de son plafond :
 *   curl -X POST /api/interventions --data '{"rucheId":"<ruche verrouillée>",…}'
 * SANS `-H 'Content-Type: application/json'` renvoie 201 au lieu de 402. La
 * même requête AVEC l'en-tête est bien refusée. Il suffisait d'omettre une
 * ligne.
 *
 * La règle s'écrit donc dans l'autre sens — on lit TOUJOURS, sauf quand le
 * corps se lit en flux et qu'y toucher casserait la route. C'est la forme
 * « je ne sais pas ⇒ je regarde » au lieu de « je ne sais pas ⇒ je laisse
 * passer », et c'est la seule qui convienne à une porte.
 *
 * Exporté pour être exerçable : le mode de panne est muet, aucune erreur ne le
 * signale, et il ne se voit qu'en fabriquant la requête exprès.
 */
export function doitLireLeCorps(typeContenu: string | undefined): boolean {
  const t = (typeContenu ?? '').toLowerCase();
  // `multipart/form-data` se lit avec `readMultipartFormData`, en flux : le
  // consommer ici priverait la route de son propre corps.
  return !t.includes('multipart/form-data');
}

const EXEMPTS = ['/api/auth/', '/api/stripe/', '/api/public/', '/api/cron/', '/api/subscription/'];

/**
 * Ramasse les identifiants de ruches n'importe où dans le corps — y compris
 * imbriqués (`exceptions: [{ rucheId }]`). La profondeur est bornée : un corps
 * hostile ne doit pas pouvoir nous faire descendre indéfiniment.
 */
export function collecterIdsRuches(
  valeur: unknown,
  sortie = new Set<string>(),
  niveau = 0,
): Set<string> {
  if (niveau > 6 || valeur === null || typeof valeur !== 'object') return sortie;

  if (Array.isArray(valeur)) {
    for (const v of valeur) collecterIdsRuches(v, sortie, niveau + 1);
    return sortie;
  }

  for (const [cle, v] of Object.entries(valeur)) {
    if (CLE_RUCHE.test(cle)) {
      if (typeof v === 'string' && UUID.test(v)) sortie.add(v);
      else if (Array.isArray(v)) {
        for (const x of v) if (typeof x === 'string' && UUID.test(x)) sortie.add(x);
      }
    }
    collecterIdsRuches(v, sortie, niveau + 1);
  }
  return sortie;
}

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname;
  if (!path.startsWith('/api/')) return;
  if (EXEMPTS.some((p) => path.startsWith(p))) return;

  // ─── Cette requête nomme-t-elle seulement une ruche ? ─────────────
  const candidats = new Set<string>();

  const parChemin = CHEMIN_RUCHE.exec(path);
  if (parChemin?.[1]) candidats.add(parChemin[1]);

  const method = event.method;
  if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
    // Tout SAUF le multipart, dont le corps se lit en flux et ne doit pas être
    // consommé ici. Voir `doitLireLeCorps` : la règle inverse — « seulement si
    // l'en-tête dit JSON » — se contournait en omettant l'en-tête.
    if (doitLireLeCorps(getHeader(event, 'content-type'))) {
      try {
        collecterIdsRuches(await readBody(event), candidats);
      } catch {
        // Corps illisible ou malformé : ce n'est pas à ce middleware de le
        // signaler — la validation Zod de la route rendra une 400 explicite.
      }
    }
  }

  if (candidats.size === 0) return;

  // ─── Auth ────────────────────────────────────────────────────────
  // Même contrat que `04.subscription` : une 401 propre est laissée à la route.
  let user: Awaited<ReturnType<typeof requireAuth>>;
  try {
    user = await requireAuth(event);
  } catch (err) {
    const status = (err as { statusCode?: number })?.statusCode;
    if (status !== 401) console.error('[verrou-ruches] requireAuth a échoué', err);
    return;
  }

  // Les comptes admin gardent l'accès plein — c'est la seule exception voulue.
  if (isAdminEmail(user.email)) return;

  // `withDbRetry` comme dans `04.subscription` : ces lectures gardent désormais
  // 32 routes, et un pool mort au réveil d'une lambda (CONNECTION_DESTROYED) ne
  // doit pas les transformer en 500.
  const ownerId = await withDbRetry(() => resolveOwnerId(event), 'verrou-ruches:owner');
  const plan = await withDbRetry(() => planDuProprietaire(ownerId), 'verrou-ruches:plan');
  if (getLimit(plan, 'ruches') === Infinity) return;

  // On ne juge QUE les ruches de l'espace : une ruche d'autrui doit rendre le
  // 400/404 de la route (règle d'isolation), pas un 402 qui révélerait qu'elle
  // existe ailleurs.
  const possedees = await withDbRetry(
    () =>
      db
        .select({ id: ruches.id })
        .from(ruches)
        .where(and(eq(ruches.userId, ownerId), inArray(ruches.id, [...candidats]))),
    'verrou-ruches:possedees',
  );
  if (possedees.length === 0) return;

  const autorisees = await withDbRetry(
    () => idsRuchesAutorisees(db, ownerId, plan),
    'verrou-ruches:autorisees',
  );
  if (!autorisees) return;

  const verrouillee = possedees.find((r) => !autorisees.has(r.id));
  if (!verrouillee) return;

  const max = getLimit(plan, 'ruches');
  throw createError({
    statusCode: 402,
    statusMessage: 'Ruche verrouillée',
    data: {
      code: 'RUCHE_VERROUILLEE',
      limit: 'ruches',
      rucheId: verrouillee.id,
      max,
      currentPlan: plan,
      requiredPlan: minimumPlanForLimit('ruches', max + 1),
      message: `Votre plan ${getPlanConfig(plan).label} donne accès à ${max} ruche${max > 1 ? 's' : ''}. Cette ruche reste enregistrée : un abonnement vous rend l'intégralité de votre cheptel, là où vous l'aviez laissé.`,
    },
  });
});
