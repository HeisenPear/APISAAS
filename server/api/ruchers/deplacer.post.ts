import { eq, and, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import { ruchers, emplacements, ruches, interventions } from '~~/server/database/schema';

/**
 * POST /api/ruchers/deplacer
 * Pose un ou PLUSIEURS ruchers sur un emplacement (transhumance).
 *
 * Tout est fait en requêtes groupées : déplacer 1 000 ruchers coûte le même
 * nombre d'allers-retours que d'en déplacer un seul.
 *
 * Le rucher hérite des coordonnées de l'emplacement : la météo, la carte et
 * la tournée lisent `ruchers.latitude/longitude` et suivent donc sans que
 * rien d'autre ne bouge dans l'application.
 */
/**
 * Département depuis un code postal français. Les deux premiers chiffres,
 * sauf la Corse (20xxx → 2A/2B) et l'outre-mer (3 chiffres).
 */
function departementDepuisCodePostal(cp: string): string | null {
  const c = cp.trim();
  if (!/^\d{5}$/.test(c)) return null;
  if (c.startsWith('20')) return Number(c) < 20200 ? '2A' : '2B';
  if (c.startsWith('97') || c.startsWith('98')) return c.slice(0, 3);
  return c.slice(0, 2);
}

const schema = z.object({
  rucherIds: z.array(z.string().uuid()).min(1).max(1000),
  /** null = retirer les ruchers de leur emplacement (position libre). */
  emplacementDestinationId: z.string().uuid().nullable(),
  date: z.string().datetime({ offset: true }).optional(),
  notes: z.string().max(2000).optional(),
});

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event);
  const body = await readValidatedBody(event, schema.parse);

  const idsDemandes = [...new Set(body.rucherIds)];

  // Les ruchers doivent tous appartenir à l'espace (une seule requête).
  const possedes = await db
    .select({ id: ruchers.id, nom: ruchers.nom, emplacementId: ruchers.emplacementId })
    .from(ruchers)
    .where(and(inArray(ruchers.id, idsDemandes), eq(ruchers.userId, ownerId)));

  if (possedes.length !== idsDemandes.length) {
    return badRequest('Un ou plusieurs ruchers sont introuvables ou non autorisés');
  }

  // Un rucher déjà posé sur cet emplacement ne bouge pas : ni mise à jour, ni
  // ligne d'historique, ni comptage dans le message de fin.
  const aDeplacer = possedes.filter((r) => r.emplacementId !== body.emplacementDestinationId);
  const ids = aDeplacer.map((r) => r.id);

  if (ids.length === 0) {
    return {
      data: {
        ruchersDeplaces: 0,
        ruchesConcernees: 0,
        dejaSurPlace: possedes.length,
        destination: null,
      },
    };
  }

  let destination: {
    id: string;
    nom: string;
    latitude: string;
    longitude: string;
    adresse: string | null;
    commune: string | null;
    codePostal: string | null;
  } | null = null;
  if (body.emplacementDestinationId) {
    const [emp] = await db
      .select({
        id: emplacements.id,
        nom: emplacements.nom,
        latitude: emplacements.latitude,
        longitude: emplacements.longitude,
        adresse: emplacements.adresse,
        commune: emplacements.commune,
        codePostal: emplacements.codePostal,
      })
      .from(emplacements)
      .where(
        and(eq(emplacements.id, body.emplacementDestinationId), eq(emplacements.userId, ownerId)),
      )
      .limit(1);
    if (!emp) throw createError({ statusCode: 404, message: 'Emplacement introuvable' });
    destination = emp;
  }

  // Nombre de ruches concernées — l'information qui parle à l'apiculteur.
  const [compte] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(ruches)
    .where(and(inArray(ruches.rucherId, ids), eq(ruches.userId, ownerId)));

  const dateVisite = body.date ? new Date(body.date) : new Date();

  // Déplacement et trace vont ensemble : soit les deux, soit aucun.
  await db.transaction(async (tx) => {
    if (destination) {
      // L'adresse administrative n'est recopiée QUE si l'emplacement la
      // renseigne : un emplacement saisi en GPS seul ne doit pas effacer la
      // commune et le code postal du rucher, qui servent à la déclaration NAPI.
      // Le département est redérivé du code postal pour rester cohérent.
      const dep = destination.codePostal
        ? departementDepuisCodePostal(destination.codePostal)
        : null;
      await tx
        .update(ruchers)
        .set({
          emplacementId: destination.id,
          latitude: destination.latitude,
          longitude: destination.longitude,
          ...(destination.adresse ? { adresse: destination.adresse } : {}),
          ...(destination.commune ? { commune: destination.commune } : {}),
          ...(destination.codePostal ? { codePostal: destination.codePostal } : {}),
          ...(dep ? { departement: dep } : {}),
          updatedAt: new Date(),
        })
        .where(and(inArray(ruchers.id, ids), eq(ruchers.userId, ownerId)));
    } else {
      // Retrait de l'emplacement : on garde les coordonnées actuelles du
      // rucher, qui redevient simplement « posé nulle part ».
      await tx
        .update(ruchers)
        .set({ emplacementId: null, updatedAt: new Date() })
        .where(and(inArray(ruchers.id, ids), eq(ruchers.userId, ownerId)));
    }

    // Trace dans l'historique : une intervention par rucher réellement déplacé.
    // Volontairement SANS emplacementId — le journal « Visites » d'un
    // emplacement ne doit lister que de vraies visites, pas les arrivées.
    await tx.insert(interventions).values(
      aDeplacer.map((r) => ({
        userId: ownerId,
        rucherId: r.id,
        rucheId: null,
        dateVisite,
        type: 'deplacement_rucher',
        donnees: {
          niveau: 'rucher',
          emplacementSourceId: r.emplacementId,
          emplacementDestinationId: destination?.id ?? null,
          emplacementDestinationNom: destination?.nom ?? null,
        },
        notes: body.notes ?? null,
        photos: [],
      })),
    );
  });

  return {
    data: {
      ruchersDeplaces: aDeplacer.length,
      ruchesConcernees: compte?.total ?? 0,
      dejaSurPlace: possedes.length - aDeplacer.length,
      destination: destination ? { id: destination.id, nom: destination.nom } : null,
    },
  };
});
