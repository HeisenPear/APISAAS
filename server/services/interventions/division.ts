import { eq } from 'drizzle-orm';
import { divisions, divisionsRuches, ruches } from '~~/server/database/schema';
import { assertQuotaRuches } from '~~/server/utils/quotaRuches';
import type {
  DrizzleTransaction,
  InterventionContext,
  HandlerResult,
} from '~~/server/types/interventions';
import type { z } from 'zod';
import type { divisionSchema } from '~~/server/utils/validation/interventions';

type DivisionData = z.infer<typeof divisionSchema>;

/**
 * Handler Division — Crée N ruches filles à partir d'une ruche source
 * Side-effects : INSERT divisions + INSERT ruches × N + INSERT divisions_ruches × N
 */
export async function handleDivision(
  tx: DrizzleTransaction,
  ctx: InterventionContext,
): Promise<HandlerResult> {
  const data = ctx.donnees as DivisionData;
  const created: HandlerResult['created'] = [];

  // Plafond du plan — AVANT toute écriture. Ce handler est la seule porte de
  // création de ruches hors `POST /api/ruches`, et ses routes de dispatch ne
  // sont pas gatées sur la limite `ruches` : sans ceci, un compte Découverte
  // (1 ruche) créait 10 ruches par appel, en boucle. La garde est posée ICI
  // plutôt que dans chaque route pour couvrir tout appelant présent et futur.
  // `tx` et non `db` : le comptage voit les ruches déjà insérées dans la même
  // transaction, donc N divisions successives (bulk-group) se cumulent.
  await assertQuotaRuches(tx, ctx.userId, ctx.plan, data.nombreDivisions);

  // Récupérer la ruche source pour copier le rucher + type
  const rucheSourceRows = await tx
    .select({ rucherId: ruches.rucherId, type: ruches.type, userId: ruches.userId })
    .from(ruches)
    .where(eq(ruches.id, ctx.rucheId))
    .limit(1);
  const rucheSource = rucheSourceRows[0]!;

  // Obtenir le dernier numéro de ruche pour l'auto-numérotation
  const existingRuches = await tx
    .select({ numero: ruches.numero })
    .from(ruches)
    .where(eq(ruches.userId, ctx.userId));

  let maxNum = 0;
  for (const r of existingRuches) {
    const n = parseInt(r.numero, 10);
    if (!isNaN(n) && n > maxNum) maxNum = n;
  }

  // Créer la division parent
  const divisionRows = await tx
    .insert(divisions)
    .values({
      userId: ctx.userId,
      rucheSourceId: ctx.rucheId,
      inspectionId: ctx.inspectionId,
      nombreDivisions: data.nombreDivisions,
    })
    .returning({ id: divisions.id });
  const division = divisionRows[0]!;

  created.push({ table: 'divisions', id: division.id });

  // Créer N ruches filles
  for (let i = 0; i < data.nombreDivisions; i++) {
    maxNum++;
    const newRucheRows = await tx
      .insert(ruches)
      .values({
        userId: ctx.userId,
        rucherId: rucheSource.rucherId,
        numero: String(maxNum),
        type: rucheSource.type,
        statut: 'active',
        origineEssaim: 'division',
        dateInstallation: new Date(),
      })
      .returning({ id: ruches.id });
    const newRuche = newRucheRows[0]!;

    created.push({ table: 'ruches', id: newRuche.id });

    // Lier la ruche fille à la division.
    //
    // ⚠️ DÉCLARÉE, MÊME SI C'EST UNE TABLE DE LIAISON. Le retour du
    // gestionnaire est la seule chose que la répercussion sait lire : une
    // écriture tue est une écriture invisible, et dispenser « parce que c'est
    // une liaison » serait une dispense par FICHIER, pas par règle.
    const lienRows = await tx
      .insert(divisionsRuches)
      .values({ divisionId: division.id, rucheDestinationId: newRuche.id })
      .returning({ id: divisionsRuches.id });
    created.push({ table: 'divisions_ruches', id: lienRows[0]!.id });
  }

  return { type: 'division', created };
}
