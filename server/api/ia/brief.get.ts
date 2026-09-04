import { briefDuJour, CONTEXTES_BRIEF, type ContexteBrief } from '~~/server/utils/maya-brief';
import { isAdminEmail } from '~~/app/config/admin';
import type { Plan } from '~~/app/config/plans';

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
 * ne propose que ce que la formule couvre : sans le plan, elle offrirait à un
 * compte Starter des boutons qui ne mènent qu'à un argumentaire commercial —
 * c'est exactement ce qu'elle faisait avec la projection à 30 jours, gatée Pro.
 *
 * La règle « admin ⇒ expert » est celle de `POST /api/ia/copilote`, reprise
 * telle quelle : la carte et la conversation doivent proposer les mêmes choses
 * au même compte, sans quoi un bouton absent d'un côté surgirait de l'autre.
 * L'e-mail vient de `requireAuth`, déjà résolu et mis en cache par
 * `requireWorkspace` — la garde ne coûte aucune requête de plus.
 */
export default defineEventHandler(async (event) => {
  const user = await requireWorkspace(event);
  const authentifie = await requireAuth(event);
  const q = getQuery(event).contexte;
  const contexte = CONTEXTES_BRIEF.includes(q as ContexteBrief) ? (q as ContexteBrief) : undefined;

  // Résilience serverless : si le pool est gelé (sockets morts après le gel de
  // la lambda), on le recycle et on retente une fois avant d'abandonner. Le
  // plan est lu DANS le bloc protégé : c'est une requête comme les autres.
  const composer = async (): Promise<Awaited<ReturnType<typeof briefDuJour>>> => {
    const plan: Plan = isAdminEmail(authentifie.email)
      ? 'expert'
      : await planDuProprietaire(user.id);
    /**
     * `user.id` est l'identifiant du PROPRIÉTAIRE (c'est ce que rend
     * `requireWorkspace`) : ce sont ses ruches, ses stocks, ses alertes.
     * `user.userId` est celui qui LIT — et c'est lui qu'on salue. Un membre
     * invité était accueilli par le prénom du propriétaire.
     */
    return briefDuJour(user.id, plan, contexte, user.userId);
  };

  try {
    return { data: await dbWatchdog(composer(), 'ia/brief', 9000) };
  } catch {
    await resetDb().catch(() => {});
    try {
      return { data: await dbWatchdog(composer(), 'ia/brief (relance)', 9000) };
    } catch (err) {
      console.error('[ia/brief] échec:', err instanceof Error ? err.message : err);
      return { data: { salutation: 'Bonjour 🐝', intro: '', items: [] } };
    }
  }
});
