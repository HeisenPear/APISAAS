import { z } from 'zod';
import { gocardlessActif, listerInstitutions } from '~~/server/utils/gocardless';

// Liste les banques disponibles pour un pays via l'agrégateur (501 si non configuré).
const schema = z.object({ pays: z.string().length(2).default('FR') });

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  await resolveOwnerId(event);
  if (!gocardlessActif()) {
    throw createError({
      statusCode: 501,
      message: 'Connexion bancaire automatique non configurée',
    });
  }
  const { pays } = await getValidatedQuery(event, schema.parse);
  const institutions = await listerInstitutions(pays);
  return { data: institutions.map((i) => ({ id: i.id, name: i.name, logo: i.logo ?? null })) };
});
