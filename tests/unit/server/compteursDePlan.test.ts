import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { COMPTEURS, compterRessource, debutDuMois } from '~~/server/utils/compteursDePlan';
import { ROUTE_GATES } from '~/config/route-gates';
import type { PlanLimits } from '~/config/plans';
import type { Executeur } from '~~/server/utils/compteursDePlan';

/**
 * UNE PORTE QUI IGNORE CE QU'ELLE NE COMPREND PAS N'EST PAS UNE PORTE.
 *
 * Le dépôt avait deux compteurs de ressources, et les deux laissaient passer ce
 * qu'ils ne savaient pas mesurer :
 *
 *   · le middleware d'abonnement : un `switch` de sept cas et un
 *     `default: return 0`. Zéro veut dire « en dessous du plafond » ;
 *   · la porte d'écriture de Maya : `if (limite !== 'clients') return null;`,
 *     et `null` valait aussi « laisse passer ».
 *
 * Le second était assumé par son commentaire — « seul clients est atteignable
 * par une écriture Maya aujourd'hui ». C'était vrai le jour de l'écriture. Sauf
 * que la table des actions déclarait DÉJÀ `vente`, dont la route porte
 * `limit: 'facturesParMois'` (0 sur Découverte, 10 sur Starter). La garde
 * dormait en attendant le code qui la réveillerait — et personne ne s'en serait
 * souvenu au moment de l'écrire.
 *
 * CE BANC NE VÉRIFIE PAS QUE LES SEPT COMPTEURS EXISTENT. Il vérifie une
 * propriété qui reste vraie quand le produit grandit : **toute limite qu'une
 * porte déclare doit être comptable**. Ajouter demain une route
 * `limit: 'photosStorageMb'` casse ce banc au lieu d'ouvrir un trou.
 */

/** Un exécuteur factice : `select().from().where()` rend le compte demandé. */
function execAvec(compte: number): Executeur {
  const resultat = [{ count: compte }];
  const maillon: Record<string, unknown> = {};
  for (const m of ['select', 'from', 'where', 'limit']) maillon[m] = () => maillon;
  maillon.then = (resoudre: (v: unknown) => unknown) => Promise.resolve(resultat).then(resoudre);
  return maillon as unknown as Executeur;
}

/** Les limites que le catalogue de routes déclare vraiment. */
const LIMITES_DECLAREES = [
  ...new Set(
    Object.values(ROUTE_GATES)
      .map((g) => g.limit)
      .filter((l): l is keyof PlanLimits => Boolean(l)),
  ),
].sort();

describe('les compteurs de plafond de plan', () => {
  it('le catalogue déclare bien des limites (garde-fou du banc)', () => {
    // Sans ce contrôle, un `ROUTE_GATES` vide rendrait le cas suivant vert : le
    // banc affirmerait une conformité qu'il n'a jamais mesurée.
    expect(LIMITES_DECLAREES.length).toBeGreaterThan(3);
    expect(LIMITES_DECLAREES).toContain('facturesParMois');
  });

  it('TOUTE limite déclarée par une porte est comptable', () => {
    /**
     * La règle centrale. Elle ne nomme aucun compteur : elle relie deux tables
     * — le catalogue des portes et celui des compteurs — et exige qu'elles se
     * recouvrent. C'est ce recouvrement qui manquait.
     */
    const sansCompteur = LIMITES_DECLAREES.filter((l) => COMPTEURS[l] === null);
    expect(
      sansCompteur,
      'une porte déclare un plafond que personne ne sait mesurer : elle laisserait passer',
    ).toEqual([]);
  });

  it('les limites NON comptables sont déclarées, pas oubliées', () => {
    /**
     * L'inverse compte aussi. Une entrée `null` est une DÉCISION (« ceci n'est
     * pas un nombre de lignes en base »), pas un trou qu'on n'a pas bouché. On
     * exige donc qu'elle soit rare et nommée : si la liste enfle, quelqu'un
     * s'en sert comme d'une trappe.
     */
    const nonComptables = (Object.keys(COMPTEURS) as (keyof PlanLimits)[])
      .filter((l) => COMPTEURS[l] === null)
      .sort();
    expect(nonComptables).toEqual(['alertesActives', 'iaQuestionsParMois', 'photosStorageMb']);
  });

  it('« je ne sais pas compter » rend null, jamais zéro', async () => {
    /**
     * Le cœur de la correction, en une assertion. Zéro et « inconnu » sont deux
     * choses différentes : le premier autorise, le second doit faire réfléchir
     * l'appelant. Les confondre est exactement ce qui rendait le défaut muet.
     */
    expect(await compterRessource(execAvec(42), 'u1', 'photosStorageMb')).toBeNull();
    expect(await compterRessource(execAvec(42), 'u1', 'clients')).toBe(42);
  });

  it('la borne du quota mensuel est le premier instant du mois', () => {
    /**
     * L'instant est injectable, et cette borne est la seule décision du fichier
     * qui ne touche pas la base. Une borne fausse déplacerait un plafond d'un
     * mois sur l'autre sans que rien ne le dise — le genre d'écart qu'on ne
     * découvre qu'en recevant la réclamation d'un client facturé en trop.
     */
    const borne = debutDuMois(new Date(2026, 2, 17, 14, 32, 8, 500));
    expect(borne.getFullYear()).toBe(2026);
    expect(borne.getMonth()).toBe(2);
    expect(borne.getDate()).toBe(1);
    expect([
      borne.getHours(),
      borne.getMinutes(),
      borne.getSeconds(),
      borne.getMilliseconds(),
    ]).toEqual([0, 0, 0, 0]);
  });

  it('la borne ne modifie pas l’instant qu’on lui donne', () => {
    // Un `setDate` sur l'argument reçu corromprait l'horloge de l'appelant —
    // et c'est une erreur classique avec les dates JavaScript, qui sont muables.
    const instant = new Date(2026, 2, 17, 14, 32);
    debutDuMois(instant);
    expect(instant.getDate()).toBe(17);
  });

  it('les deux appelants passent par ces compteurs, pas par les leurs', () => {
    /**
     * ⚠️ CE CAS GARDE LA CORRECTION ELLE-MÊME. Rien n'empêche quelqu'un de
     * remettre un `switch` local « juste pour ce cas-là » — c'est précisément
     * comme ça que les deux compteurs d'origine sont nés. On exige donc que ni
     * le middleware ni la porte de Maya ne comptent pour leur compte.
     */
    for (const f of ['server/middleware/04.subscription.ts', 'server/utils/copilote-gating.ts']) {
      const source = readFileSync(f, 'utf-8');
      expect(source, `${f} doit utiliser les compteurs partagés`).toContain('compterRessource');
      expect(source, `${f} ne doit pas recompter pour son compte`).not.toMatch(/count\(\*\)::int/);
    }
  });
});
