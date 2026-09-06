import { describe, it, expect } from 'vitest';
import { fenetresVisite } from '~~/server/utils/copilote-local';
import { palierScore } from '~~/server/utils/meteo';
import type { MeteoJour } from '~~/server/utils/copilote-data';

/**
 * Maya ne savait dire que le MEILLEUR jour de visite. C'est la moitié de la
 * question : sur le terrain, « quand est-ce que je n'ouvre surtout pas » vaut au
 * moins autant — une colonie ouverte par vent fort ou sous la pluie se
 * refroidit, et le déplacement est perdu.
 *
 * L'invariant central de ce banc n'est pas le tri : c'est que les jours
 * déconseillés viennent du barème OFFICIEL du produit (`palierScore`), et pas
 * d'un seuil recopié « qui semble raisonnable ». Deux vérités pour une même
 * donnée, c'est ainsi que la page tarifs et le code ont divergé ailleurs.
 */
const jour = (date: string, scoreVisite: number): MeteoJour => ({
  date,
  conditions: 'Averses',
  tempMax: 14,
  tempMin: 6,
  pluieMm: 8,
  ventMaxKmh: 35,
  scoreVisite,
});

describe('fenetresVisite — les deux bouts de la fenêtre', () => {
  it('désigne le meilleur ET le pire jour', () => {
    const f = fenetresVisite([
      jour('2026-04-01', 55),
      jour('2026-04-02', 88),
      jour('2026-04-03', 21),
    ]);
    expect(f.meilleur?.date).toBe('2026-04-02');
    expect(f.pire?.date).toBe('2026-04-03');
  });

  it('ne déconseille QUE les jours du palier défavorable', () => {
    /**
     * Le piège évité : nommer « le moins bon jour » d'une bonne semaine. Un jour
     * à 62/100 est praticable ; le désigner comme à éviter ferait renoncer
     * l'apiculteur à une sortie parfaitement valable.
     */
    const f = fenetresVisite([
      jour('2026-04-01', 82),
      jour('2026-04-02', 71),
      jour('2026-04-03', 62),
    ]);
    expect(f.aEviter).toEqual([]);
    expect(f.pire?.scoreVisite).toBe(62); // le pire existe, il n'est pas à éviter
  });

  it('classe les jours à éviter du pire au moins pire', () => {
    const f = fenetresVisite([
      jour('2026-04-01', 30),
      jour('2026-04-02', 90),
      jour('2026-04-03', 12),
      jour('2026-04-04', 38),
    ]);
    expect(f.aEviter.map((j) => j.scoreVisite)).toEqual([12, 30, 38]);
  });

  it('suit le barème officiel, pas un seuil recopié', () => {
    /**
     * Le garde qui compte vraiment. Si `palierScore` change de frontière, ce
     * banc doit suivre TOUT SEUL — c'est ce qui prouve qu'aucun 40 n'a été
     * réécrit à la main dans `fenetresVisite`.
     */
    for (let score = 0; score <= 100; score++) {
      const f = fenetresVisite([jour('2026-04-01', score)]);
      const defavorable = palierScore(score).cle === 'defavorable';
      expect(f.aEviter.length, `score ${score}`).toBe(defavorable ? 1 : 0);
    }
  });

  it('sans prévision, rien à dire — et surtout pas un jour inventé', () => {
    const f = fenetresVisite([]);
    expect(f.meilleur).toBeNull();
    expect(f.pire).toBeNull();
    expect(f.aEviter).toEqual([]);
  });

  it('un seul jour est à la fois le meilleur et le pire', () => {
    const f = fenetresVisite([jour('2026-04-01', 50)]);
    expect(f.meilleur?.date).toBe('2026-04-01');
    expect(f.pire?.date).toBe('2026-04-01');
  });

  it('ne modifie pas le tableau reçu', () => {
    // `sort` mute en place : sans copie, l'ordre chronologique des prévisions
    // serait détruit pour tous les autres consommateurs — dont le graphe, qui
    // afficherait les jours dans le désordre.
    const previsions = [jour('2026-04-01', 30), jour('2026-04-02', 90)];
    fenetresVisite(previsions);
    expect(previsions.map((j) => j.date)).toEqual(['2026-04-01', '2026-04-02']);
  });
});
