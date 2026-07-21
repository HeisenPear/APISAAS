import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { balances, profils } from '~~/server/database/schema';
import { isAdminEmail } from '~~/app/config/admin';
import { hasFeature, type Plan } from '~~/app/config/plans';
import { verifierDebitIngestion } from '~~/server/utils/balances/acces';
import { normaliserLot } from '~~/server/utils/balances/normaliser';
import { enregistrerMesures } from '~~/server/utils/balances/enregistrer';
import { evaluerAlertesBalance } from '~~/server/utils/balances/alertes';

/** Un lot raisonnable : une passerelle qui rattrape 24 h à 15 min = 96 points. */
const MAX_LOT = 500;

const tokenSchema = z
  .string()
  .min(20)
  .max(140)
  .regex(/^[A-Za-z0-9_-]+$/);
const objet = z.record(z.string(), z.unknown());
const corpsSchema = z.union([objet, z.array(objet).max(MAX_LOT)]);

/**
 * POST /api/balances/ingest/:token — ROUTE PUBLIQUE d'ingestion.
 *
 * Authentifiée par le SEUL `ingestToken` de l'appareil (pas de session) : c'est
 * volontairement hors de `route-gates`, elle vérifie elle-même le plan du
 * PROPRIÉTAIRE. Deux invariants de sécurité :
 *   1. la mesure est écrite sur LA balance de ce token, et sur aucune autre —
 *      `userId`/`balanceId` viennent de la ligne résolue, jamais du payload
 *      (un `device_id` envoyé par le capteur reste purement informatif) ;
 *   2. la réponse ne divulgue RIEN du compte (ni nom, ni plan, ni id).
 */
export default defineEventHandler(async (event) => {
  const token = tokenSchema.parse(getRouterParam(event, 'token'));
  if (!verifierDebitIngestion(token)) {
    return tooManyRequests('Trop de mesures envoyées, réessayez dans une minute.');
  }
  const corps = await readValidatedBody(event, corpsSchema.parse);

  const [cible] = await withDbRetry(
    () =>
      db
        .select({ balance: balances, plan: profils.plan, email: profils.email })
        .from(balances)
        .innerJoin(profils, eq(profils.id, balances.userId))
        .where(eq(balances.ingestToken, token))
        .limit(1),
    'balances:ingest:lookup',
  );
  if (!cible) return notFound('Balance inconnue');

  const admin = isAdminEmail(cible.email);
  if (!admin && !hasFeature(cible.plan as Plan, 'balancesConnectees')) {
    throw createError({
      statusCode: 402,
      statusMessage: 'Plan insuffisant',
      message: 'Les balances connectées ne sont pas incluses dans le plan de ce compte.',
    });
  }

  const { balance } = cible;
  const { mesures, rejetees } = normaliserLot(corps);
  const res = await enregistrerMesures(balance, mesures, 'webhook');

  // Détection IMMÉDIATE : une chute d'essaimage ne peut pas attendre le cron du
  // lendemain. Best-effort — un échec ici ne doit jamais faire perdre la mesure.
  if (res.derniere && balance.statut === 'active') {
    try {
      await evaluerAlertesBalance(balance, res.derniere);
    } catch (err) {
      console.error('[balances/ingest] détection d’alertes échouée', err);
    }
  }

  setResponseStatus(event, 202);
  return {
    ok: true,
    recues: Array.isArray(corps) ? corps.length : 1,
    enregistrees: res.enregistrees.length,
    doublons: res.doublons,
    ignorees: rejetees,
  };
});
