import { z } from 'zod';
import { eq, and, gte, lt, ne, sql } from 'drizzle-orm';
import { signalementsFrelon } from '~~/server/database/schema';
import {
  trouverDoublon,
  scoreFiabilite,
  MAX_SIGNALEMENTS_PAR_JOUR,
  RAYON_DOUBLON_M,
} from '~~/app/utils/frelonFiabilite';

const bodySchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  espece: z.enum(['asiatique', 'europeen', 'indetermine']).default('asiatique'),
  type: z.enum(['nid_primaire', 'nid_secondaire', 'individu', 'piege']).default('nid_secondaire'),
  pression: z.enum(['faible', 'modere', 'fort', 'infestation']).default('modere'),
  /**
   * ⚠️ PAS DANS LE FUTUR. Elle est désormais un SIGNE DE VIE (voir
   * `index.get.ts`) : une date à venir rendrait le nid immortel sur la
   * carte. Elle est aussi la clé de tri d'une liste tronquée à 2000
   * lignes — une observation datée de 2099 s'y installerait en tête.
   *
   * La tolérance d'un jour absorbe les décalages de fuseau : un
   * apiculteur qui saisit « aujourd'hui » depuis un téléphone en avance
   * sur le serveur ne doit pas se voir refuser sa propre observation.
   */
  dateObservation: z.coerce.date().refine((d) => d.getTime() <= Date.now() + 86_400_000, {
    message: 'La date d’observation ne peut pas être dans le futur.',
  }),
  commune: z.string().max(120).nullish(),
  hauteurM: z.number().min(0).max(99).nullish(),
  notes: z.string().max(2000).nullish(),
  photoUrl: z.string().url().nullish(),
});

/**
 * POST /api/frelon — signale un nid sur la carte communautaire.
 * Anti-fraude : rate-limit par compte (24 h) + dédoublonnage géographique
 * (un report < 150 m d'un nid actif existant devient un VOTE de confirmation).
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const body = await readValidatedBody(event, bodySchema.parse);

  // Rate-limit anti-flood.
  const depuis = new Date(Date.now() - 24 * 3600 * 1000);
  const [{ n } = { n: 0 }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(signalementsFrelon)
    .where(
      and(eq(signalementsFrelon.auteurId, user.id), gte(signalementsFrelon.createdAt, depuis)),
    );
  if (n >= MAX_SIGNALEMENTS_PAR_JOUR) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Trop de signalements',
      message: `Limite de ${MAX_SIGNALEMENTS_PAR_JOUR} signalements/jour atteinte.`,
    });
  }

  // Dédoublonnage : nids actifs à proximité immédiate (≈ 300 m de bbox).
  const d = 0.003;
  const proches = await db
    .select({
      id: signalementsFrelon.id,
      lat: signalementsFrelon.latitude,
      lng: signalementsFrelon.longitude,
      auteurId: signalementsFrelon.auteurId,
    })
    .from(signalementsFrelon)
    .where(
      and(
        ne(signalementsFrelon.statut, 'rejete'),
        ne(signalementsFrelon.statut, 'detruit'),
        gte(signalementsFrelon.latitude, String(body.latitude - d)),
        sql`${signalementsFrelon.latitude} <= ${String(body.latitude + d)}`,
        gte(signalementsFrelon.longitude, String(body.longitude - d)),
        sql`${signalementsFrelon.longitude} <= ${String(body.longitude + d)}`,
      ),
    )
    .limit(50);

  const doublonId = trouverDoublon(
    { lat: body.latitude, lng: body.longitude },
    proches.map((p) => ({ id: p.id, lat: Number(p.lat), lng: Number(p.lng) })),
    RAYON_DOUBLON_M,
  );

  if (doublonId) {
    const doublon = proches.find((p) => p.id === doublonId)!;
    if (doublon.auteurId !== user.id) {
      // Un report sur un nid déjà signalé par QUELQU'UN D'AUTRE = confirmation.
      await appliquerVote(doublonId, user.id, 'confirme');
    } else {
      /**
       * ⚠️ SON PROPRE NID : ON AVANCE LA DATE D'OBSERVATION. Cette branche ne
       * faisait RIEN — elle rendait `{ deduplique: true }` et l'écran affichait
       * « votre confirmation a été enregistrée » alors que rien ne l'avait été.
       *
       * C'était sans conséquence tant que rien ne périmait. Depuis que le
       * silence efface un signalement, cela enfermait l'auteur : il ne peut pas
       * voter son propre nid (anti-auto-validation), le re-signaler ne posait
       * aucun vote, et au bout de quatre mois son nid quittait la carte — donc
       * plus aucun écran ne connaissait son identifiant, ni pour le modifier ni
       * pour l'acter détruit. Or celui qui passe devant un nid chaque semaine
       * est presque toujours celui qui l'a signalé.
       *
       * Re-signaler EST une observation : on écrit sa date, et
       * `index.get.ts` la compte comme signe de vie.
       */
      await db
        .update(signalementsFrelon)
        .set({ dateObservation: body.dateObservation, updatedAt: new Date() })
        .where(
          and(
            eq(signalementsFrelon.id, doublonId),
            eq(signalementsFrelon.auteurId, user.id),
            // On n'écrit que si la nouvelle observation est PLUS RÉCENTE :
            // ressaisir une vieille date ne doit pas vieillir le signalement.
            lt(signalementsFrelon.dateObservation, body.dateObservation),
          ),
        );
    }
    return { data: { id: doublonId }, deduplique: true };
  }

  const score = scoreFiabilite({ confirmations: 0, infirmations: 0, destructions: 0 }, 0, 0);
  const [created] = await db
    .insert(signalementsFrelon)
    .values({
      auteurId: user.id,
      latitude: String(body.latitude),
      longitude: String(body.longitude),
      espece: body.espece,
      type: body.type,
      pression: body.pression,
      dateObservation: body.dateObservation,
      commune: body.commune ?? null,
      hauteurM: body.hauteurM != null ? String(body.hauteurM) : null,
      notes: body.notes ?? null,
      photoUrl: body.photoUrl ?? null,
      scoreFiabilite: score,
    })
    .returning();

  setResponseStatus(event, 201);
  return { data: created, deduplique: false };
});
