import { comptagesVarroa, traitementsVarroa } from '~~/server/database/schema';
import type {
  DrizzleTransaction,
  InterventionContext,
  HandlerResult,
} from '~~/server/types/interventions';
import { createAlerte } from '~~/server/utils/alertes';
import type { z } from 'zod';
import type { varroaSchema } from '~~/server/utils/validation/interventions';

type VarroaData = z.infer<typeof varroaSchema>;

/**
 * Handler Varroa — Comptage plancher, traitement, suppression couvain, VPH
 * Alertes : chute > 3/jour (haute), VPH > 2% (haute)
 */
export async function handleVarroa(
  tx: DrizzleTransaction,
  ctx: InterventionContext,
): Promise<HandlerResult> {
  const data = ctx.donnees as VarroaData;
  const created: HandlerResult['created'] = [];
  const alerts: HandlerResult['alerts'] = [];

  switch (data.sousAction) {
    case 'comptage_plancher': {
      const chuteParJour = data.dureeJours > 0 ? data.nombreVarroas / data.dureeJours : 0;

      const comptageRows = await tx
        .insert(comptagesVarroa)
        .values({
          userId: ctx.userId,
          rucheId: ctx.rucheId,
          inspectionId: ctx.inspectionId,
          typeComptage: 'plancher',
          nombreVarroas: data.nombreVarroas,
          dureeComptageJours: data.dureeJours,
          chuteParJour: String(chuteParJour),
        })
        .returning({ id: comptagesVarroa.id });
      const row = comptageRows[0]!;

      created.push({ table: 'comptages_varroa', id: row.id });

      if (chuteParJour > 3) {
        await createAlerte(tx, {
          userId: ctx.userId,
          type: 'varroa_chute_elevee',
          titre: 'Chute varroa élevée',
          message: `Chute de ${chuteParJour.toFixed(1)} varroas/jour détectée. Traitement recommandé.`,
          priorite: 'haute',
          referenceType: 'ruche',
          referenceId: ctx.rucheId,
          actionUrl: `/ruches/${ctx.rucheId}`,
        });
        alerts.push({
          type: 'varroa_chute_elevee',
          titre: 'Chute varroa élevée',
          message: `${chuteParJour.toFixed(1)}/jour`,
          priorite: 'haute',
        });
      }
      break;
    }

    case 'traitement': {
      const traitementRows = await tx
        .insert(traitementsVarroa)
        .values({
          userId: ctx.userId,
          rucheId: ctx.rucheId,
          inspectionId: ctx.inspectionId,
          typeTraitement: data.typeTraitement,
          dosage: data.dosage,
          dateDebut: new Date(data.dateDebut),
          dateFinPrevue: data.dateFinPrevue ? new Date(data.dateFinPrevue) : null,
          numeroLotProduit: data.numeroLotProduit,
        })
        .returning({ id: traitementsVarroa.id });
      const row = traitementRows[0]!;

      created.push({ table: 'traitements_varroa', id: row.id });
      break;
    }

    case 'suppression_couvain': {
      const suppressionRows = await tx
        .insert(comptagesVarroa)
        .values({
          userId: ctx.userId,
          rucheId: ctx.rucheId,
          inspectionId: ctx.inspectionId,
          typeComptage: 'suppression_couvain_male',
          nombreVarroas: 0,
          nombreCadresRetires: data.nombreCadres,
        })
        .returning({ id: comptagesVarroa.id });
      const row = suppressionRows[0]!;

      created.push({ table: 'comptages_varroa', id: row.id });
      break;
    }

    case 'vph': {
      const tauxVph =
        data.nombreAbeilles > 0 ? (data.nombreVarroas / data.nombreAbeilles) * 100 : 0;

      const vphRows = await tx
        .insert(comptagesVarroa)
        .values({
          userId: ctx.userId,
          rucheId: ctx.rucheId,
          inspectionId: ctx.inspectionId,
          typeComptage: 'vph',
          nombreVarroas: data.nombreVarroas,
          nombreAbeillesEchantillon: data.nombreAbeilles,
          tauxVph: String(tauxVph),
        })
        .returning({ id: comptagesVarroa.id });
      const row = vphRows[0]!;

      created.push({ table: 'comptages_varroa', id: row.id });

      if (tauxVph > 2) {
        await createAlerte(tx, {
          userId: ctx.userId,
          type: 'varroa_vph_elevee',
          titre: 'Taux VPH critique',
          message: `Taux VPH de ${tauxVph.toFixed(1)}% détecté (seuil : 2%). Traitement urgent.`,
          priorite: 'haute',
          referenceType: 'ruche',
          referenceId: ctx.rucheId,
          actionUrl: `/ruches/${ctx.rucheId}`,
        });
        alerts.push({
          type: 'varroa_vph_elevee',
          titre: 'Taux VPH critique',
          message: `${tauxVph.toFixed(1)}%`,
          priorite: 'haute',
        });
      }
      break;
    }
  }

  return { type: 'varroa', created, alerts };
}
