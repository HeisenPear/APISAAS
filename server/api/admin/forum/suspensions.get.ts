import { desc, gte, sql } from 'drizzle-orm';
import { profils, signalementsAbus } from '~~/server/database/schema';
import { SIGNALEMENTS_RETABLIS_AVANT_SUSPENSION, peutSignaler } from '~~/app/utils/forumModeration';

/**
 * GET /api/admin/forum/suspensions — les comptes dont le droit de signaler est
 * suspendu, et ceux à qui il a été rendu.
 *
 * ⚠️ CETTE ROUTE EXISTE PARCE QUE LA SUSPENSION EST DÉFINITIVE. C'est le choix
 * de l'apiculteur, et il n'a de sens QUE si quelqu'un peut voir qui est
 * suspendu et lever la sanction. Sans cette liste, la seule façon de retrouver
 * un compte suspendu serait de le chercher en base à la main : la décision
 * serait irréversible en pratique, ce qui n'est pas ce qui a été demandé.
 *
 * ⚠️ ELLE REND `email`, ET C'EST NÉCESSAIRE. On ne lève pas une sanction sur un
 * pseudonyme : il faut pouvoir répondre à la personne qui écrit « je crois
 * qu'il y a une erreur ». C'est une route `requireAdmin`, la seule du forum à
 * nommer qui que ce soit.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  /**
   * ⚠️ LE SEUIL VIENT DE LA RÈGLE, PAS D'UN LITTÉRAL. Écrire `>= 3` ici ferait
   * diverger cette liste de `peutSignaler()` le jour où le chiffre bouge :
   * l'écran montrerait des comptes qui peuvent encore signaler, ou en
   * oublierait qui ne le peuvent plus. C'est la même constante des deux côtés.
   */
  const lignes = await db
    .select({
      id: profils.id,
      email: profils.email,
      prenom: profils.prenom,
      nom: profils.nom,
      torts: profils.forumSignalementsRetablis,
      levee: profils.forumSuspensionLevee,
    })
    .from(profils)
    .where(gte(profils.forumSignalementsRetablis, SIGNALEMENTS_RETABLIS_AVANT_SUSPENSION))
    .orderBy(desc(profils.forumSignalementsRetablis))
    .limit(200);

  /**
   * Combien de signalements attendent encore un arbitrage : c'est ce qui dit à
   * l'administrateur s'il a du travail avant de juger un compte.
   */
  const [enAttente] = await db
    .select({
      n: sql<number>`count(*) filter (where ${signalementsAbus.arbitrage} = 'en_attente')::int`,
    })
    .from(signalementsAbus);

  return {
    data: lignes.map((l) => ({
      ...l,
      /**
       * ⚠️ ON APPELLE LA RÈGLE, ON NE LA REFORMULE PAS. Le premier jet écrivait
       * `suspendu: !l.levee` — vrai aujourd'hui, faux le jour où `peutSignaler`
       * gagne une condition, et faux SANS BRUIT : l'écran montrerait comme
       * suspendu quelqu'un qui peut encore signaler. C'est exactement la
       * divergence que « dériver, jamais recopier » désigne, à une ligne près.
       */
      suspendu: !peutSignaler({ signalementsRetablis: l.torts, suspensionLevee: l.levee }),
    })),
    signalementsEnAttente: enAttente?.n ?? 0,
    seuil: SIGNALEMENTS_RETABLIS_AVANT_SUSPENSION,
  };
});
