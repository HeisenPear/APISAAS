import { z } from 'zod';
import { connexionsBancaires } from '~~/server/database/schema';
import { gocardlessActif, creerRequisition } from '~~/server/utils/gocardless';

// Démarre une connexion bancaire : crée une requisition chez l'agrégateur et renvoie le lien
// d'authentification (l'utilisateur s'authentifie chez SA banque). On stocke la requisition
// en attente ; la synchronisation récupérera les transactions au retour.
const schema = z.object({
  institutionId: z.string().min(1).max(100),
  institutionNom: z.string().max(200).optional(),
});

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event, 'commerce');
  if (!gocardlessActif()) {
    throw createError({
      statusCode: 501,
      message: 'Connexion bancaire automatique non configurée',
    });
  }
  const { institutionId, institutionNom } = await readValidatedBody(event, schema.parse);
  const config = useRuntimeConfig();

  const req = await creerRequisition({
    institutionId,
    redirect: `${config.public.baseUrl}/finances/reglements?gc=callback`,
    reference: crypto.randomUUID(),
  });

  await db.insert(connexionsBancaires).values({
    userId: ownerId,
    requisitionId: req.id,
    institutionId,
    institutionNom: institutionNom ?? null,
    statut: 'en_attente',
  });

  return { data: { link: req.link } };
});
