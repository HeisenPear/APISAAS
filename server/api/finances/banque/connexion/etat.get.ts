import { eq, desc } from 'drizzle-orm';
import { connexionsBancaires } from '~~/server/database/schema';
import { gocardlessActif } from '~~/server/utils/gocardless';

// État de la connexion bancaire automatique : configurée ou non (secrets agrégateur),
// + liste des connexions de l'utilisateur. Lecture seule.
export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);

  const connexions = await db
    .select({
      id: connexionsBancaires.id,
      institutionNom: connexionsBancaires.institutionNom,
      statut: connexionsBancaires.statut,
      derniereSync: connexionsBancaires.derniereSync,
      createdAt: connexionsBancaires.createdAt,
    })
    .from(connexionsBancaires)
    .where(eq(connexionsBancaires.userId, ownerId))
    .orderBy(desc(connexionsBancaires.createdAt));

  return { data: { actif: gocardlessActif(), connexions } };
});
