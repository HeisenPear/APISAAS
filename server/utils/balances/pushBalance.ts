import {
  planifierPushDetaille,
  type PushItem,
  type PushPayload,
} from '~~/server/utils/alertesPush';
import { sendPushBatchToUser } from '~~/server/utils/webPush';
import { horodaterNotifiees } from '~~/server/utils/moteurAlertes/rattrapage';
import { chargerPreferencesNotif, type PreferencesNotif } from '~~/server/utils/moteurAlertes';
import type { AlerteCreee } from '~~/server/utils/moteurAlertes/types';

// ═══════════════════════════════════════════════════════════════════════════
// NOTIFICATION DES ALERTES DE BALANCE.
//
// Une balance connectée ne vaut que par ce qu'elle prévient : une chute de
// 5 kg à 14 h, c'est un essaim qui vient de partir, et l'apiculteur a quelques
// heures pour le récupérer. Les alertes étaient créées en base et n'atteignaient
// personne — elles n'étaient dans aucune liste blanche de push, et aucun des
// trois points d'ingestion n'appelait l'envoi.
//
// Priorités : `balance_vol` est CRITIQUE (part seule, perce les heures calmes),
// `balance_essaimage` est HAUTE (perce aussi). Les quatre autres sont reportées
// la nuit — et le balayage du cron du matin garantit qu'elles partent alors,
// au lieu d'être perdues.
// ═══════════════════════════════════════════════════════════════════════════

function versItem(a: AlerteCreee): PushItem {
  return {
    id: a.id,
    type: a.type ?? '',
    titre: a.titre,
    message: a.message,
    actionUrl: a.actionUrl,
    priorite: a.priorite as PushPayload['priorite'],
    referenceId: a.referenceId,
  };
}

/**
 * Notifie les alertes de balance tout juste créées, puis horodate leur sort.
 *
 * Best-effort INTÉGRAL : ne lève jamais. Une mesure ne doit pas être perdue à
 * cause d'une notification.
 *
 * `preferences` évite une lecture de `profils` quand l'appelant les a déjà —
 * c'est le cas du webhook d'ingestion, dont la requête de résolution joint déjà
 * la table.
 */
export async function pousserAlertesBalance(
  userId: string,
  creees: readonly AlerteCreee[],
  maintenant: Date,
  preferences?: PreferencesNotif,
): Promise<number> {
  if (creees.length === 0) return 0;
  try {
    const prefs = preferences ?? (await chargerPreferencesNotif(userId));
    const plan = planifierPushDetaille(
      creees.map(versItem),
      prefs.categories,
      maintenant,
      prefs.plan,
    );

    const envoyes =
      plan.payloads.length > 0 ? (await sendPushBatchToUser(userId, plan.payloads)).envoyes : 0;

    // APRÈS l'envoi : horodater avant donnerait de l'at-most-once, et un envoi
    // raté ne serait jamais repêché par le balayage du cron.
    await horodaterNotifiees(
      plan.tranchees.map((a) => a.id).filter((id): id is string => !!id),
      maintenant,
    );
    return envoyes;
  } catch (err) {
    console.error('[balances] notification impossible', {
      userId,
      erreur: err instanceof Error ? err.message : String(err),
    });
    return 0;
  }
}
