import { z } from 'zod';
import { connexionsBalance } from '~~/server/database/schema';
import { ErreurBeep, authentifierBeep, listerDevicesBeep } from '~~/server/utils/balances/beep';

const corpsSchema = z.object({
  fournisseur: z.literal('beep').default('beep'),
  email: z.string().email().max(255),
  motDePasse: z.string().min(1).max(200),
});

/**
 * POST /api/balances/connexions — connecte un compte BEEP.
 * Le mot de passe sert UNE fois pour obtenir l'`api_token` et n'est jamais
 * stocké. Un seul jeu d'identifiants par fournisseur et par espace (upsert).
 */
export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event, 'terrain');
  const { fournisseur, email, motDePasse } = await readValidatedBody(event, corpsSchema.parse);

  try {
    const token = await authentifierBeep(email, motDePasse);
    const devices = await listerDevicesBeep(token);

    const creees = await withDbRetry(
      () =>
        db
          .insert(connexionsBalance)
          .values({ userId: ownerId, fournisseur, token, statut: 'active', derniereErreur: null })
          .onConflictDoUpdate({
            target: [connexionsBalance.userId, connexionsBalance.fournisseur],
            set: { token, statut: 'active', derniereErreur: null, updatedAt: new Date() },
          })
          .returning({
            id: connexionsBalance.id,
            fournisseur: connexionsBalance.fournisseur,
            statut: connexionsBalance.statut,
            derniereSyncAt: connexionsBalance.derniereSyncAt,
          }),
      'balances:connexion',
    );

    // Le token BEEP n'est JAMAIS renvoyé au client.
    return { data: { ...requireRow(creees, 'Connexion impossible'), devices } };
  } catch (err) {
    if (err instanceof ErreurBeep) {
      throw createError({ statusCode: err.statut, statusMessage: 'BEEP', message: err.message });
    }
    throw err;
  }
});
