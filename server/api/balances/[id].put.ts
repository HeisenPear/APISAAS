import { and, eq } from 'drizzle-orm';
import { balances, hausses, ruchers, ruches } from '~~/server/database/schema';
import {
  chargerBalance,
  genererIngestToken,
  majBalanceSchema,
  urlIngestion,
} from '~~/server/utils/balances/acces';
import { recalculerPoidsNet } from '~~/server/utils/balances/enregistrer';
import { memoriserUnitePoids, oublierUnitePoids } from '~~/server/utils/balances/unite';

/** PUT /api/balances/:id — mise à jour partielle (nom, liaisons, tare, seuils, statut). */
export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event, 'terrain');
  const id = getRouterParam(event, 'id');
  if (!id) return badRequest('ID manquant');
  uuidSchema.parse(id);

  const existante = await chargerBalance(ownerId, id);
  if (!existante) return notFound('Balance introuvable');
  const b = await readValidatedBody(event, majBalanceSchema.parse);

  await Promise.all([
    assertFkBelongsToOwner(ownerId, ruches, ruches.id, ruches.userId, b.rucheId, 'Ruche'),
    assertFkBelongsToOwner(ownerId, hausses, hausses.id, hausses.userId, b.hausseId, 'Hausse'),
    assertFkBelongsToOwner(ownerId, ruchers, ruchers.id, ruchers.userId, b.rucherId, 'Rucher'),
  ]);

  // Unité de poids : vit dans `config` (jsonb), donc hors du `set()` Drizzle.
  // Écrite AVANT la mise à jour principale pour que le `returning()` la reflète.
  // ⚠️ Ne s'applique qu'aux mesures À VENIR : l'historique déjà converti n'est
  // pas recalculé (il faudrait rejouer chaque `raw`). En pratique l'unité est
  // apprise dès le premier lot, quand l'historique est encore vide.
  if (b.unitePoids !== undefined) {
    if (b.unitePoids) await memoriserUnitePoids(id, b.unitePoids, false);
    else await oublierUnitePoids(id);
  }

  const dec = (v: number | null | undefined) =>
    v === undefined ? undefined : (v?.toFixed(2) ?? null);
  const maj = {
    nom: b.nom,
    marque: b.marque,
    modele: b.modele,
    source: b.source,
    identifiantExterne: b.identifiantExterne,
    rucheId: b.rucheId,
    hausseId: b.hausseId,
    rucherId: b.rucherId,
    poidsTare: dec(b.poidsTare),
    statut: b.statut,
    seuilVariationKg: dec(b.seuilVariationKg),
    seuilPoidsRecolteKg: dec(b.seuilPoidsRecolteKg),
    seuilBatteriePct: b.seuilBatteriePct,
    seuilSilenceHeures: b.seuilSilenceHeures,
    notes: b.notes,
    ingestToken: b.regenererToken ? genererIngestToken() : undefined,
    updatedAt: new Date(),
  };

  const misesAJour = await withDbRetry(
    () =>
      db
        .update(balances)
        .set(maj)
        .where(and(eq(balances.id, id), eq(balances.userId, ownerId)))
        .returning(),
    'balances:maj',
  );
  const balance = requireRow(misesAJour, 'Mise à jour impossible');

  // Une tare qui change doit se répercuter sur TOUT l'historique, sinon la
  // courbe du poids net présenterait une marche artificielle.
  if (maj.poidsTare !== undefined && maj.poidsTare !== existante.poidsTare) {
    await recalculerPoidsNet(id, balance.poidsTare);
  }

  return {
    data: { ...balance, urlIngestion: urlIngestion(resolveAppOrigin(event), balance.ingestToken) },
  };
});
