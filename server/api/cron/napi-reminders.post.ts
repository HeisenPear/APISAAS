import { eq, and, ne, notInArray, isNull, or } from 'drizzle-orm';
import { profils, declarationsNapi, alertes } from '~~/server/database/schema';
import { assertCronAuth } from '~~/server/utils/cron-helpers';
import { sendPushToUser } from '~~/server/utils/webPush';

export default defineEventHandler(async (event) => {
  assertCronAuth(event);

  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const annee = now.getFullYear();

  // Verifier si c'est un des 5 jours de rappel
  const isRappelDay =
    (month === 8 && day === 1) || // 1er aout
    (month === 9 && day === 1) || // 1er sept
    (month === 12 && day === 1) || // 1er dec
    (month === 12 && day === 15) || // 15 dec
    (month === 12 && day === 28); // 28 dec

  if (!isRappelDay) {
    return { skipped: true, reason: 'Not a reminder day' };
  }

  // Message selon le jour
  const rappelConfig = {
    '8-1': {
      titre: 'Preparez votre declaration NAPI',
      message:
        'Dans 1 mois (le 1er septembre), vous pourrez declarer votre cheptel apicole sur agriculture-portail.6tzen.fr',
      priorite: 'normale' as const,
    },
    '9-1': {
      titre: 'Declaration NAPI ouverte',
      message:
        "La periode de declaration NAPI est ouverte jusqu'au 31 decembre. Connectez-vous sur APIGO pour pre-remplir votre formulaire.",
      priorite: 'normale' as const,
    },
    '12-1': {
      titre: "NAPI : plus qu'un mois !",
      message:
        "Il ne vous reste qu'un mois pour declarer votre cheptel apicole (echeance 31 decembre).",
      priorite: 'haute' as const,
    },
    '12-15': {
      titre: 'NAPI : plus que 2 semaines !',
      message:
        "L'echeance de la declaration NAPI est dans 2 semaines (31 decembre). N'oubliez pas !",
      priorite: 'haute' as const,
    },
    '12-28': {
      titre: 'URGENT — Declaration NAPI dans 3 jours !',
      message:
        'La declaration NAPI expire le 31 decembre. Il ne vous reste que 3 jours. Agissez maintenant !',
      priorite: 'urgente' as const,
    },
  };

  const key = `${month}-${day}` as keyof typeof rappelConfig;
  const config = rappelConfig[key];
  if (!config) return { skipped: true };

  // Recuperer les userIds qui ont DEJA declare cette annee (statut != brouillon)
  const declared = await db
    .select({ userId: declarationsNapi.userId })
    .from(declarationsNapi)
    .where(and(eq(declarationsNapi.annee, annee), ne(declarationsNapi.statut, 'brouillon')));

  const declaredIds = declared.map((d) => d.userId).filter((id): id is string => !!id);

  // Recuperer en UNE requete tous les users qui doivent etre notifies
  // (= ceux qui n'ont pas declare). Pas de chargement de tous les profils
  // en memoire — on filtre directement cote SQL.
  const toNotify =
    declaredIds.length > 0
      ? await db
          .select({ id: profils.id })
          .from(profils)
          .where(or(notInArray(profils.id, declaredIds), isNull(profils.id)))
      : await db.select({ id: profils.id }).from(profils);

  if (toNotify.length === 0) {
    return { notified: 0, day: key };
  }

  // INSERT batch unique pour tous les users
  const alertesValues = toNotify.map((u) => ({
    userId: u.id,
    type: (month >= 12 && day >= 15 ? 'warning' : 'info') as 'warning' | 'info',
    titre: config.titre,
    message: config.message,
    priorite: config.priorite,
    actionUrl: '/declarations/napi',
    lue: false,
  }));

  // Inserer par chunks pour eviter une requete trop volumineuse
  // (Postgres limite a ~65k parametres par requete)
  const CHUNK = 1000;
  let inserted = 0;
  for (let i = 0; i < alertesValues.length; i += CHUNK) {
    const chunk = alertesValues.slice(i, i + CHUNK);
    await db.insert(alertes).values(chunk);
    inserted += chunk.length;
  }

  // Notification push du rappel NAPI (rare : 5 jours/an). Tag annuel → le
  // navigateur remplace un rappel précédent plutôt que d'en empiler.
  for (const u of toNotify) {
    await sendPushToUser(u.id, {
      title: config.titre,
      body: config.message,
      url: '/declarations/napi',
      priorite: month >= 12 && day >= 15 ? 'haute' : 'moyenne',
      tag: `napi:${annee}`,
    }).catch(() => {});
  }

  return { notified: inserted, day: key };
});
