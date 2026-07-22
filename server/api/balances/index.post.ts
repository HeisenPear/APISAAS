import { balances, hausses, ruchers, ruches } from '~~/server/database/schema';
import {
  champsBalanceSchema,
  genererIngestToken,
  urlIngestion,
} from '~~/server/utils/balances/acces';

/**
 * POST /api/balances — déclare une balance et émet son secret d'ingestion.
 * Le gating (feature `balancesConnectees` + limite `balances`) est assuré en
 * amont par le middleware 04.subscription via `route-gates`.
 */
export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event, 'terrain');
  const body = await readValidatedBody(event, champsBalanceSchema.parse);

  // Défense en profondeur : on n'accroche jamais une balance à la ruche d'un autre.
  await Promise.all([
    assertFkBelongsToOwner(ownerId, ruches, ruches.id, ruches.userId, body.rucheId, 'Ruche'),
    assertFkBelongsToOwner(ownerId, hausses, hausses.id, hausses.userId, body.hausseId, 'Hausse'),
    assertFkBelongsToOwner(ownerId, ruchers, ruchers.id, ruchers.userId, body.rucherId, 'Rucher'),
  ]);

  const token = genererIngestToken();
  const creees = await withDbRetry(
    () =>
      db
        .insert(balances)
        .values({
          userId: ownerId,
          nom: body.nom,
          marque: body.marque ?? null,
          modele: body.modele ?? null,
          source: body.source,
          identifiantExterne: body.identifiantExterne ?? null,
          ingestToken: token,
          rucheId: body.rucheId ?? null,
          hausseId: body.hausseId ?? null,
          rucherId: body.rucherId ?? null,
          poidsTare: body.poidsTare != null ? body.poidsTare.toFixed(2) : null,
          statut: body.statut,
          seuilVariationKg: body.seuilVariationKg != null ? body.seuilVariationKg.toFixed(2) : null,
          seuilPoidsRecolteKg:
            body.seuilPoidsRecolteKg != null ? body.seuilPoidsRecolteKg.toFixed(2) : null,
          seuilBatteriePct: body.seuilBatteriePct ?? null,
          seuilSilenceHeures: body.seuilSilenceHeures ?? null,
          notes: body.notes ?? null,
        })
        .returning(),
    'balances:creation',
  );

  const balance = requireRow(creees, 'Création de la balance impossible');
  setResponseStatus(event, 201);
  return {
    data: { ...balance, urlIngestion: urlIngestion(resolveAppOrigin(event), balance.ingestToken) },
  };
});
