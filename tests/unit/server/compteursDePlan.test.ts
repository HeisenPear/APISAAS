import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { COMPTEURS, compterRessource } from '~~/server/utils/compteursDePlan';
import { debutDuMoisParis, partiesParis } from '~~/server/utils/horloge';
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

  it('la borne du quota mensuel est minuit à PARIS, pas sur le serveur', () => {
    /**
     * ⚠️ LE DÉFAUT QUE CE CAS GARDE EST INVISIBLE ONZE MOIS SUR DOUZE, ET
     * COÛTEUX LE DOUZIÈME. La borne se calculait avec `setDate(1)` +
     * `setHours(0,0,0,0)` — c'est-à-dire dans le fuseau du SERVEUR, et le
     * serveur est en UTC sur Vercel. Les deux dernières heures de chaque mois à
     * Paris tombaient donc dans le mois précédent : une facture émise le
     * 1er juillet à 01 h 30 à Paris (30 juin 23 h 30 UTC) s'imputait au quota de
     * JUIN, déjà consommé. L'apiculteur lisait « plafond atteint » le jour même
     * où son compteur repartait à zéro.
     *
     * On vérifie l'aller-retour : la borne, relue À PARIS, doit tomber le 1er à
     * 00 h 00. C'est plus fort que de comparer à une constante — ça reste vrai
     * en heure d'hiver comme en heure d'été.
     */
    for (const instant of [
      new Date('2026-01-17T12:00:00Z'), // hiver, UTC+1
      new Date('2026-07-17T12:00:00Z'), // été, UTC+2
      new Date('2026-03-30T12:00:00Z'), // le mois du changement d'heure
      new Date('2026-11-01T00:30:00Z'), // juste après une bascule de mois
    ]) {
      const borne = debutDuMoisParis(instant);
      const p = partiesParis(borne);
      expect([p.jour, p.heure, p.minute], instant.toISOString()).toEqual([1, 0, 0]);
      expect(p.mois, instant.toISOString()).toBe(partiesParis(instant).mois);
    }
  });

  it('la borne d’été tombe bien à 22 h UTC la veille', () => {
    // Le cas concret du défaut, en dur : en juillet, minuit à Paris est 22 h UTC
    // le 30 juin. Une borne UTC naïve aurait dit « 1er juillet 00 h 00 UTC » et
    // aurait raté deux heures de factures.
    expect(debutDuMoisParis(new Date('2026-07-17T12:00:00Z')).toISOString()).toBe(
      '2026-06-30T22:00:00.000Z',
    );
  });

  it('la borne ne modifie pas l’instant qu’on lui donne', () => {
    // Les dates JavaScript sont muables : un `setDate` sur l'argument reçu
    // corromprait l'horloge de l'appelant. Erreur classique.
    const instant = new Date('2026-03-17T14:32:00Z');
    debutDuMoisParis(instant);
    expect(instant.toISOString()).toBe('2026-03-17T14:32:00.000Z');
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
