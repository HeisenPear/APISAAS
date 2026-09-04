// ═══════════════════════════════════════════════════════════════════════════
// DEUX SURFACES DU MÊME PRODUIT DISAIENT À L'APICULTEUR DEUX CHOSES OPPOSÉES.
//
// Le rythme de visite recommandé vit dans `server/utils/cadence.ts` — c'est la
// source unique du socle d'alertes et de la feuille de route du jour. Une
// TROISIÈME copie (`VISITE_DELAI_JOURS = 21`) en a déjà été supprimée.
//
// Il en restait une QUATRIÈME, dans `maya-fenetres.ts`, écrite par MOIS
// plutôt que par saison — et elle contredisait la source tous les mois :
//
//   mars        10 j chez `cadence`,  21 j dans les fenêtres
//   avril–mai   10 j              ,  12 j
//   juin        14 j              ,  12 j
//   juil.–août  14 j              ,  16 j
//   OCT.–NOV.   21 j              ,  RIEN DU TOUT
//
// La dernière ligne est celle qu'on voit. D'octobre à novembre, la liste
// d'alertes déclarait les ruches en retard de visite pendant que l'écran des
// fenêtres n'en proposait aucune — au moment précis où l'apiculteur prépare
// l'hivernage et où une visite oubliée coûte une colonie.
//
// Vingt bancs couvraient déjà `maya-fenetres`. Aucun ne mesurait l'ACCORD
// avec la source : ils vérifiaient chacun le comportement du fichier avec ses
// propres chiffres. C'est la marque de la duplication — les deux copies sont
// testées, jamais leur écart.
//
// ⚠️ LE BALAYAGE PART DES DOUZE MOIS, PAS D'UNE LISTE DE CAS. Ajouter une
// saison à `cadence.ts` est mesuré le jour même.
// ═══════════════════════════════════════════════════════════════════════════

import { describe, expect, it } from 'vitest';
import { cadenceVisite } from '~~/server/utils/cadence';
import {
  calculerFenetresRucher,
  type MeteoJourFenetre,
  type RucherFenetreInput,
} from '~~/server/utils/maya-fenetres';

/** Le 15 du mois à midi UTC — loin des bornes, pour que Paris et UTC s'accordent. */
function leQuinze(mois: number): Date {
  return new Date(Date.UTC(2026, mois - 1, 15, 12, 0, 0));
}

/** Trois jours de météo praticable autour de la date — sinon aucune fenêtre. */
function previsions(aujourdhui: Date): MeteoJourFenetre[] {
  return [0, 1, 2].map((n) => {
    const d = new Date(aujourdhui.getTime() + n * 86_400_000);
    return {
      date: d.toISOString().slice(0, 10),
      scoreVisite: 90,
      tempMax: 22,
      ventMaxKmh: 8,
      pluieMm: 0,
      conditions: 'Ciel dégagé',
    };
  });
}

function rucherVuIlYa(jours: number, aujourdhui: Date): RucherFenetreInput {
  const dernier = new Date(aujourdhui.getTime() - jours * 86_400_000);
  return {
    rucherId: 'r1',
    rucherNom: 'Les Tilleuls',
    derniers: { controle: dernier.toISOString().slice(0, 10) },
    previsions: previsions(aujourdhui),
  };
}

/** Une fenêtre de CONTRÔLE est-elle proposée pour un rucher vu il y a N jours ? */
function proposeUnControle(jours: number, mois: number): boolean {
  const aujourdhui = leQuinze(mois);
  return calculerFenetresRucher(rucherVuIlYa(jours, aujourdhui), aujourdhui).some(
    (f) => f.tache === 'controle',
  );
}

const MOIS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

describe('garde-fou : les fenêtres réagissent bien au retard', () => {
  it('un rucher très en retard reçoit une fenêtre en pleine saison', () => {
    /**
     * Sans ce cas, un `calculerFenetresRucher` qui ne rendrait JAMAIS de
     * contrôle satisferait la moitié des exigences ci-dessous sans rien
     * mesurer.
     */
    expect(proposeUnControle(120, 5), 'mai, quatre mois sans visite').toBe(true);
  });

  it('un rucher visité hier n’en reçoit aucune', () => {
    /**
     * L'autre sens : un moteur qui proposerait TOUT satisferait l'autre moitié.
     */
    expect(proposeUnControle(1, 5), 'mai, visité hier').toBe(false);
  });
});

describe('la RÈGLE : les fenêtres suivent `cadence.ts`, mois par mois', () => {
  it('sous l’intervalle de la saison, aucune fenêtre de contrôle', () => {
    for (const mois of MOIS) {
      const c = cadenceVisite(leQuinze(mois));
      // Un jour AVANT l'échéance : le rucher est à jour, quoi qu'en pense
      // une seconde table.
      expect(
        proposeUnControle(c.intervalleJours - 1, mois),
        `mois ${mois} — l’intervalle de la saison est ${c.intervalleJours} j : ` +
          'une fenêtre proposée un jour avant l’échéance vient d’une AUTRE table',
      ).toBe(false);
    }
  });

  it('au-delà de l’intervalle, une fenêtre — sauf au repos hivernal', () => {
    for (const mois of MOIS) {
      const c = cadenceVisite(leQuinze(mois));
      const attendu = !c.repos;
      expect(
        proposeUnControle(c.intervalleJours + 2, mois),
        c.repos
          ? `mois ${mois} — repos hivernal : on n’ouvre pas une ruche par temps froid`
          : `mois ${mois} — ${c.intervalleJours} j dépassés, la liste d’alertes le dit déjà ; ` +
              'l’écran des fenêtres doit le dire aussi',
      ).toBe(attendu);
    }
  });

  it('OCTOBRE ET NOVEMBRE — le trou qui a produit ce banc', () => {
    /**
     * L'ancienne table rendait `null` d'octobre à février : aucune fenêtre
     * n'était proposée pendant que les alertes déclaraient les ruches en
     * retard. `cadence.ts` place octobre et novembre en AUTOMNE — 21 jours,
     * pas de repos —, et c'est la préparation de l'hivernage.
     */
    for (const mois of [10, 11]) {
      expect(cadenceVisite(leQuinze(mois)).repos, `mois ${mois} n’est pas un mois de repos`).toBe(
        false,
      );
      expect(
        proposeUnControle(30, mois),
        `mois ${mois} — trente jours sans visite en pleine préparation d’hivernage, ` +
          'et l’écran des fenêtres ne proposait rien',
      ).toBe(true);
    }
  });
});
