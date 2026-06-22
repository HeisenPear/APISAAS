import { eq } from 'drizzle-orm';
import { ruchers, ruches } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const user = await requireWorkspace(event);

  // Récupérer le profil
  const profil = await db.query.profils.findFirst({
    where: (p, { eq: eqFn }) => eqFn(p.id, user.id),
  });

  // Récupérer les ruchers actifs
  const ruchersList = await db.select().from(ruchers).where(eq(ruchers.userId, user.id));

  // Compter les ruches par type et par rucher
  const ruchesData = await db.select().from(ruches).where(eq(ruches.userId, user.id));

  const nbProduction = ruchesData.filter((r) => r.statut === 'active').length;
  const nbRuchettes = ruchesData.filter(
    (r) => r.type === 'warre' || r.notes?.includes('ruchette'),
  ).length;
  const nbNuclei = ruchesData.filter((r) => r.notes?.includes('nucle')).length;

  // Ruches par rucher
  const rucherMap: Record<string, number> = {};
  for (const r of ruchesData) {
    if (r.rucherId) {
      rucherMap[r.rucherId] = (rucherMap[r.rucherId] ?? 0) + 1;
    }
  }

  const ruchersPreFill = ruchersList.map((r) => ({
    rucherId: r.id,
    nom: r.nom,
    commune: r.commune ?? '',
    nbColonies: rucherMap[r.id] ?? 0,
  }));

  // Validation
  const validationErrors: { field: string; message: string }[] = [];

  if (!profil?.napi) {
    validationErrors.push({ field: 'napi', message: 'Numéro NAPI manquant' });
  }
  if (!profil?.nom || !profil?.prenom) {
    validationErrors.push({ field: 'nom', message: 'Nom/prénom manquants dans le profil' });
  }
  if (!profil?.adresse) {
    validationErrors.push({ field: 'adresse', message: 'Adresse manquante dans le profil' });
  }

  for (const r of ruchersPreFill) {
    if (!r.commune) {
      validationErrors.push({
        field: `rucher_${r.rucherId}_commune`,
        message: `Commune manquante pour le rucher "${r.nom}"`,
      });
    }
  }

  return {
    data: {
      profil: {
        napi: profil?.napi ?? '',
        nom: profil?.nom ?? '',
        prenom: profil?.prenom ?? '',
        email: user.email,
        telephone: profil?.telephone ?? '',
        adresse: profil?.adresse ?? '',
        codePostal: profil?.codePostal ?? '',
        ville: profil?.ville ?? '',
      },
      cheptel: {
        nbProduction,
        nbRuchettes,
        nbNuclei,
        total: nbProduction + nbRuchettes + nbNuclei,
      },
      ruchers: ruchersPreFill,
      validationErrors,
      isComplete: validationErrors.length === 0,
    },
  };
});
