import { briefDuJour, CONTEXTES_BRIEF, type ContexteBrief } from '~~/server/utils/maya-brief';

/**
 * « Point du jour » de Maya — pour la carte du tableau de bord et les cartes
 * contextuelles de page. Gate `copiloteIa` appliqué par le middleware
 * subscription (cf. route-gates).
 *
 * ⚠️ LA LISTE DES CONTEXTES EST LUE, PLUS RECOPIÉE. Elle l'était ici, dans le
 * type de `maya-brief`, dans la prop de `MayaContextCard.vue` et dans un banc —
 * quatre copies. En oublier une en ajoutant une page ne produisait aucune
 * erreur : le paramètre était simplement refusé, et la carte ne s'affichait
 * jamais, sans que rien ne le dise.
 *
 * ⚠️ LE PLAN EST CELUI DE L'ESPACE, ET IL EST OBLIGATOIRE. Une carte proactive
 * ne propose que ce que la formule couvre : sans le plan, elle proposerait à un
 * compte Starter des boutons qui ne mènent qu'à un argumentaire commercial —
 * c'est exactement ce qu'elle faisait avec la projection à 30 jours, gatée Pro.
 */
export default defineEventHandler(async (event) => {
  const user = await requireWorkspace(event);
  const q = getQuery(event).contexte;
  const contexte = CONTEXTES_BRIEF.includes(q as ContexteBrief) ? (q as ContexteBrief) : undefined;
  const plan = await planDuProprietaire(user.id);

  // Résilience serverless : si le pool est gelé (sockets morts après le gel de
  // la lambda), on le recycle et on retente une fois avant d'abandonner.
  try {
    return { data: await dbWatchdog(briefDuJour(user.id, plan, contexte), 'ia/brief', 9000) };
  } catch {
    await resetDb().catch(() => {});
    try {
      return {
        data: await dbWatchdog(briefDuJour(user.id, plan, contexte), 'ia/brief (relance)', 9000),
      };
    } catch (err) {
      console.error('[ia/brief] échec:', err instanceof Error ? err.message : err);
      return { data: { salutation: 'Bonjour 🐝', intro: '', items: [] } };
    }
  }
});
