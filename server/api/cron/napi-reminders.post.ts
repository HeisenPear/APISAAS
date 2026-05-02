import { eq, and, ne } from 'drizzle-orm';
import { profils, declarationsNapi, alertes } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'authorization');
  const cronSecret = process.env.NUXT_CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    throw createError({ statusCode: 401, message: 'Non autorisé' });
  }

  const now = new Date();
  const month = now.getMonth() + 1; // 1-indexed
  const day = now.getDate();
  const annee = now.getFullYear();

  // Vérifier si c'est un des 5 jours de rappel
  const isRappelDay =
    (month === 8 && day === 1) ||   // 1er août
    (month === 9 && day === 1) ||   // 1er sept
    (month === 12 && day === 1) ||  // 1er déc
    (month === 12 && day === 15) || // 15 déc
    (month === 12 && day === 28);   // 28 déc

  if (!isRappelDay) {
    return { skipped: true, reason: 'Not a reminder day' };
  }

  // Message selon le jour
  const rappelConfig = {
    '8-1': { titre: 'Préparez votre déclaration NAPI', message: 'Dans 1 mois (le 1er septembre), vous pourrez déclarer votre cheptel apicole sur agriculture-portail.6tzen.fr', priorite: 'normale' },
    '9-1': { titre: 'Déclaration NAPI ouverte', message: "La période de déclaration NAPI est ouverte jusqu'au 31 décembre. Connectez-vous sur APIGO pour pré-remplir votre formulaire.", priorite: 'normale' },
    '12-1': { titre: 'NAPI : plus qu\'un mois !', message: 'Il ne vous reste qu\'un mois pour déclarer votre cheptel apicole (échéance 31 décembre).', priorite: 'haute' },
    '12-15': { titre: 'NAPI : plus que 2 semaines !', message: 'L\'échéance de la déclaration NAPI est dans 2 semaines (31 décembre). N\'oubliez pas !', priorite: 'haute' },
    '12-28': { titre: 'URGENT — Déclaration NAPI dans 3 jours !', message: 'La déclaration NAPI expire le 31 décembre. Il ne vous reste que 3 jours. Agissez maintenant !', priorite: 'urgente' },
  };

  const key = `${month}-${day}` as keyof typeof rappelConfig;
  const config = rappelConfig[key];
  if (!config) return { skipped: true };

  // Récupérer tous les utilisateurs n'ayant pas encore déclaré pour cette année
  const usersWithDecl = await db
    .select({ userId: declarationsNapi.userId })
    .from(declarationsNapi)
    .where(and(eq(declarationsNapi.annee, annee), ne(declarationsNapi.statut, 'brouillon')));

  const declaredUserIds = new Set(usersWithDecl.map(u => u.userId));

  const allUsers = await db.select({ id: profils.id }).from(profils);
  const toNotify = allUsers.filter(u => !declaredUserIds.has(u.id));

  let count = 0;
  for (const user of toNotify) {
    await db.insert(alertes).values({
      userId: user.id,
      type: month >= 12 && day >= 15 ? 'warning' : 'info',
      titre: config.titre,
      message: config.message,
      priorite: config.priorite,
      actionUrl: '/declarations/napi',
      lue: false,
    });
    count++;
  }

  return { notified: count, day: key };
});
