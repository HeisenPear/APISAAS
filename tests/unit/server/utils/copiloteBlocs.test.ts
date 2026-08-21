import { describe, it, expect } from 'vitest';
import {
  blocsMeteo,
  blocsAlertes,
  blocsRuchers,
  blocsInterventions,
  type BlocMaya,
} from '~~/server/utils/copilote-local';
import type {
  AlerteRow,
  InterventionRow,
  RucherRow,
  MeteoResultat,
} from '~~/server/utils/copilote-data';

/**
 * Les fabriques de blocs décident de ce que l'apiculteur VOIT sous une réponse.
 * Neuf d'entre elles vivaient en portée de module, donc sans un seul banc.
 *
 * Ce qui est vérifié ici n'est pas « la figure est jolie » — c'est un jugement —
 * mais les invariants qui, violés, produisent une figure FAUSSE ou une figure
 * qui ne dit rien : un total qui ne somme pas, une barre unique présentée comme
 * une comparaison, une donnée absente rendue comme un zéro.
 */

const meteo = (scores: number[]): MeteoResultat =>
  ({
    rucher: 'Grand Pré',
    previsions: scores.map((scoreVisite, i) => ({
      date: `2026-04-${String(i + 1).padStart(2, '0')}`,
      conditions: 'Ciel dégagé',
      tempMax: 20,
      tempMin: 9,
      pluieMm: 0,
      ventMaxKmh: 12,
      scoreVisite,
    })),
  }) as MeteoResultat;

const alerte = (priorite: string | null, titre = 'Essaimage probable'): AlerteRow => ({
  type: 'essaimage',
  titre,
  message: 'Cellules royales observées',
  priorite,
});

describe('blocsMeteo — la figure qui répond à « quand ouvrir »', () => {
  it('trace un point par jour de prévision, avec le score réel', () => {
    const b = blocsMeteo(meteo([80, 45, 20, 65, 90]));
    expect(b).toHaveLength(1);
    const g = b[0]!;
    expect(g.type).toBe('graphe');
    if (g.type !== 'graphe') return;
    expect(g.serie.map((p) => p.valeur)).toEqual([80, 45, 20, 65, 90]);
  });

  it('ne dépasse jamais sept jours — au-delà l’axe devient illisible', () => {
    const b = blocsMeteo(meteo(Array.from({ length: 14 }, (_, i) => i * 5)));
    const g = b[0]!;
    if (g.type !== 'graphe') throw new Error('graphe attendu');
    expect(g.serie.length).toBeLessThanOrEqual(7);
  });

  it('sans prévision, aucune figure — plutôt qu’un graphe vide', () => {
    expect(blocsMeteo(meteo([]))).toEqual([]);
  });
});

describe('blocsAlertes — le compte doit tomber juste', () => {
  it('répartit TOUTES les alertes, y compris celles sans priorité', () => {
    /**
     * L'invariant qui compte. Une alerte dont la priorité est absente ou
     * inattendue ne doit pas s'évaporer du décompte : « à traiter » afficherait
     * un total que le détail ne retrouve pas.
     */
    const alertes = [
      alerte('haute'),
      alerte('moyenne'),
      alerte(null),
      alerte('inconnue-du-produit'),
      alerte('basse'),
    ];
    const stats = blocsAlertes(alertes)[0]!;
    expect(stats.type).toBe('stats');
    if (stats.type !== 'stats') return;
    const lire = (label: string) => Number(stats.items.find((i) => i.label === label)!.valeur);
    expect(lire('À traiter')).toBe(5);
    expect(lire('Prioritaires') + lire('Autres')).toBe(5);
  });

  it('classe les prioritaires en tête du détail', () => {
    const b = blocsAlertes([alerte('basse', 'B'), alerte('haute', 'H'), alerte('moyenne', 'M')]);
    const tab = b.find((x) => x.type === 'tableau')!;
    if (tab.type !== 'tableau') return;
    expect(tab.lignes.map((l) => l[1])).toEqual(['H', 'M', 'B']);
  });

  it('aucune alerte, aucune figure', () => {
    expect(blocsAlertes([])).toEqual([]);
  });
});

describe('blocsRuchers — une barre seule ne compare rien', () => {
  const r = (nom: string, n: number): RucherRow => ({ nom, commune: null, nbRuchesActives: n });

  it('somme les ruches et calcule la moyenne', () => {
    const stats = blocsRuchers([r('A', 10), r('B', 20), r('C', 30)])[0]!;
    if (stats.type !== 'stats') throw new Error('stats attendu');
    const lire = (label: string) => stats.items.find((i) => i.label === label)!.valeur;
    expect(lire('Ruchers')).toBe('3');
    expect(lire('Ruches actives')).toBe('60');
    expect(lire('Moyenne par rucher')).toBe('20');
  });

  it('un seul rucher : pas de graphe de répartition', () => {
    // Une barre unique n'est pas une comparaison, c'est un chiffre déguisé.
    const b = blocsRuchers([r('Unique', 12)]);
    expect(b.some((x) => x.type === 'graphe')).toBe(false);
  });

  it('plusieurs ruchers vides : pas de graphe non plus', () => {
    const b = blocsRuchers([r('A', 0), r('B', 0)]);
    expect(b.some((x) => x.type === 'graphe')).toBe(false);
  });

  it('plusieurs ruchers peuplés : le graphe apparaît', () => {
    const b = blocsRuchers([r('A', 4), r('B', 7)]);
    const g = b.find((x) => x.type === 'graphe');
    expect(g).toBeDefined();
    if (g?.type !== 'graphe') return;
    expect(g.serie).toEqual([
      { label: 'A', valeur: 4 },
      { label: 'B', valeur: 7 },
    ]);
  });
});

describe('blocsInterventions — le graphe n’apparaît que s’il dit quelque chose', () => {
  const i = (type: string | null, ruche = 'R12'): InterventionRow => ({
    date: '2026-04-12',
    type,
    ruche,
    notes: null,
  });

  it('compte par type, du plus fréquent au moins fréquent', () => {
    const b = blocsInterventions([
      i('visite'),
      i('visite'),
      i('récolte'),
      i('visite'),
      i('varroa'),
    ]);
    const g = b.find((x) => x.type === 'graphe')!;
    if (g.type !== 'graphe') return;
    expect(g.serie[0]).toEqual({ label: 'visite', valeur: 3 });
    expect(g.serie.reduce((s, p) => s + p.valeur, 0)).toBe(5);
  });

  it('un seul type : le tableau suffit, pas de graphe', () => {
    const b = blocsInterventions([i('visite'), i('visite')]);
    expect(b.some((x) => x.type === 'graphe')).toBe(false);
    expect(b.some((x) => x.type === 'tableau')).toBe(true);
  });

  it('un type absent devient « autre » et reste compté', () => {
    const b = blocsInterventions([i(null), i('   '), i('visite')]);
    const g = b.find((x) => x.type === 'graphe')!;
    if (g.type !== 'graphe') return;
    expect(g.serie.reduce((s, p) => s + p.valeur, 0)).toBe(3);
    expect(g.serie.some((p) => p.label === 'autre')).toBe(true);
  });

  it('aucune intervention, aucune figure', () => {
    expect(blocsInterventions([])).toEqual([]);
  });
});

describe('les quatre fabriques respectent le contrat de BlocMaya', () => {
  it('n’inventent aucun type de bloc', () => {
    /**
     * `MayaChart.vue` ne sait rendre que ces cinq formes. Un type inventé se
     * traduirait par un vide silencieux sous la réponse — pas par une erreur.
     */
    const connus = new Set(['stats', 'tableau', 'graphe', 'carte', 'plan']);
    const tous: BlocMaya[] = [
      ...blocsMeteo(meteo([70, 30])),
      ...blocsAlertes([alerte('haute'), alerte('basse')]),
      ...blocsRuchers([
        { nom: 'A', commune: null, nbRuchesActives: 3 },
        { nom: 'B', commune: null, nbRuchesActives: 5 },
      ]),
      ...blocsInterventions([
        { date: '2026-04-01', type: 'visite', ruche: 'R1', notes: null },
        { date: '2026-04-02', type: 'récolte', ruche: 'R2', notes: null },
      ]),
    ];
    expect(tous.length).toBeGreaterThan(4);
    for (const b of tous) expect(connus.has(b.type), b.type).toBe(true);
  });

  it('un tableau a toujours autant de cellules que de colonnes', () => {
    // Une ligne plus courte que l'en-tête décale silencieusement tout le reste.
    const tableaux = [
      ...blocsAlertes([alerte('haute'), alerte(null)]),
      ...blocsInterventions([{ date: null, type: null, ruche: null, notes: null }]),
    ].filter((b) => b.type === 'tableau');
    expect(tableaux.length).toBeGreaterThan(0);
    for (const t of tableaux) {
      if (t.type !== 'tableau') continue;
      for (const ligne of t.lignes) expect(ligne.length, t.titre).toBe(t.colonnes.length);
    }
  });
});
