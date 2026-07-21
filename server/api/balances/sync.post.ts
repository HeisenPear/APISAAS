import { z } from 'zod';
import { and, eq, ne } from 'drizzle-orm';
import { balances, connexionsBalance } from '~~/server/database/schema';
import { ErreurBeep, synchroniserDeviceBeep } from '~~/server/utils/balances/beep';
import { enregistrerMesures } from '~~/server/utils/balances/enregistrer';
import { evaluerAlertesBalance } from '~~/server/utils/balances/alertes';

/** Vercel borne la durée d'une lambda : on synchronise par paquets, l'UI rappelle si besoin. */
const MAX_PAR_APPEL = 5;

const corpsSchema = z.object({
  balanceId: z.string().uuid().optional(),
  interval: z.enum(['hour', 'day', 'week', 'month', 'year']).default('week'),
});

/**
 * POST /api/balances/sync — synchronisation BEEP à la demande.
 * Une balance en échec n'interrompt jamais les autres : l'erreur est renvoyée
 * par balance, la route répond toujours 200.
 */
export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event, 'terrain');
  const { balanceId, interval } = await readValidatedBody(event, corpsSchema.parse);

  const [connexion] = await withDbRetry(
    () =>
      db
        .select()
        .from(connexionsBalance)
        .where(
          and(eq(connexionsBalance.userId, ownerId), eq(connexionsBalance.fournisseur, 'beep')),
        )
        .limit(1),
    'balances:sync:connexion',
  );
  if (!connexion) return badRequest('Aucun compte BEEP connecté.');

  const cibles = await withDbRetry(
    () =>
      db
        .select()
        .from(balances)
        .where(
          and(
            eq(balances.userId, ownerId),
            eq(balances.source, 'beep'),
            ne(balances.statut, 'inactive'),
            balanceId ? eq(balances.id, balanceId) : undefined,
          ),
        )
        .limit(MAX_PAR_APPEL),
    'balances:sync:cibles',
  );

  const resultats = await Promise.all(
    cibles.map(async (balance) => {
      const device =
        balance.identifiantExterne ??
        (typeof balance.config?.deviceId === 'string' ? balance.config.deviceId : null);
      if (!device) {
        return {
          id: balance.id,
          nom: balance.nom,
          importees: 0,
          doublons: 0,
          erreur: 'Identifiant BEEP manquant',
        };
      }
      try {
        const mesures = await synchroniserDeviceBeep(connexion.token, device, interval);
        const res = await enregistrerMesures(balance, mesures, 'beep');
        if (res.derniere && balance.statut === 'active') {
          await evaluerAlertesBalance(balance, res.derniere).catch(() => {});
        }
        return {
          id: balance.id,
          nom: balance.nom,
          importees: res.enregistrees.length,
          doublons: res.doublons,
          erreur: null,
        };
      } catch (err) {
        const message = err instanceof ErreurBeep ? err.message : 'Synchronisation impossible';
        return { id: balance.id, nom: balance.nom, importees: 0, doublons: 0, erreur: message };
      }
    }),
  );

  const echec = resultats.find((r) => r.erreur)?.erreur ?? null;
  await withDbRetry(
    () =>
      db
        .update(connexionsBalance)
        .set({ derniereSyncAt: new Date(), derniereErreur: echec, updatedAt: new Date() })
        .where(eq(connexionsBalance.id, connexion.id)),
    'balances:sync:trace',
  );

  return {
    data: {
      balances: resultats,
      total: resultats.reduce((n, r) => n + r.importees, 0),
      tronquee: cibles.length === MAX_PAR_APPEL && !balanceId,
    },
  };
});
