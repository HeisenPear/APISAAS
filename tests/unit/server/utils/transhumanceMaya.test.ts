import { describe, it, expect } from 'vitest';
import {
  classifier,
  bilanTranshumance,
  rendreTranshumance,
  blocsTranshumance,
} from '~~/server/utils/copilote-local';
import { refusDeLecture } from '~~/server/utils/copilote-gating';
import { ROUTE_GATES } from '~~/app/config/route-gates';
import { PLANS, hasFeature } from '~~/app/config/plans';
import type {
  TranshumanceData,
  PlanTranshumanceRow,
  EmplacementRow,
} from '~~/server/utils/copilote-data';

/**
 * LE SIGNAL LE PLUS FORT DE CE MODULE N'EST PAS LE CALENDRIER.
 *
 * C'est `accord_signe`. Poser des ruches sur un terrain sans accord écrit
 * expose à une mise en demeure, à un déplacement en urgence EN PLEINE MIELLÉE,
 * et à la perte du terrain pour les années suivantes. Rien dans le produit ne
 * le remontait au moment où l'apiculteur planifie.
 */
const MAINTENANT = new Date('2026-06-15T09:00:00Z');

function plan(p: Partial<PlanTranshumanceRow> = {}): PlanTranshumanceRow {
  return {
    miellee: 'lavande',
    datePrevue: '2026-07-01T00:00:00Z',
    dateRealisee: null,
    statut: 'planifie',
    origine: 'Grand Pré',
    destination: 'Plateau de Valensole',
    ruchesPrevues: 24,
    ruchesRealisees: null,
    productionKg: null,
    coutEuros: null,
    distanceKm: 180,
    ...p,
  };
}

function emplacement(p: Partial<EmplacementRow> = {}): EmplacementRow {
  return {
    nom: 'Plateau de Valensole',
    commune: 'Valensole',
    capaciteMaxRuches: 30,
    accordSigne: true,
    proprietaireTerrain: 'M. Roux',
    ...p,
  };
}

const data = (
  plans: PlanTranshumanceRow[],
  emplacements: EmplacementRow[] = [],
): TranshumanceData => ({ plans, emplacements });

describe('bilanTranshumance — à venir, réalisées, chiffrées', () => {
  it('ne compte « à venir » que ce qui est encore devant', () => {
    const b = bilanTranshumance(
      data([
        plan({ datePrevue: '2026-07-01T00:00:00Z' }),
        plan({ datePrevue: '2026-05-01T00:00:00Z' }),
      ]),
      MAINTENANT,
    );
    expect(b.aVenir).toHaveLength(1);
    expect(b.aVenir[0]!.datePrevue).toBe('2026-07-01T00:00:00Z');
  });

  it('exclut des « à venir » ce qui est déjà réalisé ou annulé', () => {
    const b = bilanTranshumance(
      data([
        plan({ datePrevue: '2026-08-01T00:00:00Z', dateRealisee: '2026-07-30T00:00:00Z' }),
        plan({ datePrevue: '2026-08-02T00:00:00Z', statut: 'annule' }),
        plan({ datePrevue: '2026-08-03T00:00:00Z' }),
      ]),
      MAINTENANT,
    );
    expect(b.aVenir).toHaveLength(1);
  });

  it('ne retient comme CHIFFRÉE qu’une transhumance qui a production ET coût', () => {
    /**
     * L'invariant qui évite un faux comptable. Une donnée manquante n'est pas
     * un zéro : additionner un coût sans sa production ferait apparaître une
     * transhumance à perte là où la récolte n'est simplement pas encore saisie.
     */
    const b = bilanTranshumance(
      data([
        plan({ dateRealisee: '2026-05-01T00:00:00Z', productionKg: 120, coutEuros: 80 }),
        plan({ dateRealisee: '2026-05-02T00:00:00Z', productionKg: 90, coutEuros: null }),
        plan({ dateRealisee: '2026-05-03T00:00:00Z', productionKg: null, coutEuros: 60 }),
      ]),
      MAINTENANT,
    );
    expect(b.realisees).toHaveLength(3);
    expect(b.chiffrees).toHaveLength(1);
  });

  it('relève les emplacements sans accord signé', () => {
    const b = bilanTranshumance(
      data(
        [],
        [
          emplacement({ accordSigne: true }),
          emplacement({ nom: 'Bois de Sault', accordSigne: false }),
        ],
      ),
      MAINTENANT,
    );
    expect(b.sansAccord.map((e) => e.nom)).toEqual(['Bois de Sault']);
  });
});

describe('rendreTranshumance — dire le risque, pas seulement l’agenda', () => {
  it('avertit explicitement sur les terrains sans accord', () => {
    const b = bilanTranshumance(
      data([], [emplacement({ nom: 'Bois de Sault', accordSigne: false })]),
      MAINTENANT,
    );
    const t = rendreTranshumance(b, 2026);
    expect(t).toMatch(/accord signé/i);
    expect(t).toMatch(/Bois de Sault/);
    expect(t).toMatch(/miellée/i); // la conséquence concrète est nommée
  });

  it('ne chiffre pas un rendement sur des données incomplètes', () => {
    const b = bilanTranshumance(
      data([plan({ dateRealisee: '2026-05-01T00:00:00Z', productionKg: 90, coutEuros: null })]),
      MAINTENANT,
    );
    const t = rendreTranshumance(b, 2026);
    expect(t).not.toMatch(/€ de carburant/);
  });

  it('dit combien de réalisées restent hors du calcul', () => {
    const b = bilanTranshumance(
      data([
        plan({ dateRealisee: '2026-05-01T00:00:00Z', productionKg: 120, coutEuros: 80 }),
        plan({ dateRealisee: '2026-05-02T00:00:00Z' }),
      ]),
      MAINTENANT,
    );
    expect(rendreTranshumance(b, 2026)).toMatch(/n’entre pas dans ce calcul|n’entrent pas/i);
  });

  it('rien du tout : oriente vers la saisie des emplacements', () => {
    const b = bilanTranshumance(data([]), MAINTENANT);
    expect(rendreTranshumance(b, 2026)).toMatch(/emplacement/i);
  });
});

describe('blocsTranshumance — comparer suppose au moins deux mesures', () => {
  it('pas de graphe avec une seule transhumance chiffrée', () => {
    const b = bilanTranshumance(
      data([plan({ dateRealisee: '2026-05-01T00:00:00Z', productionKg: 120, coutEuros: 80 })]),
      MAINTENANT,
    );
    expect(blocsTranshumance(b).some((x) => x.type === 'graphe')).toBe(false);
  });

  it('graphe dès deux transhumances chiffrées', () => {
    const b = bilanTranshumance(
      data([
        plan({
          dateRealisee: '2026-05-01T00:00:00Z',
          miellee: 'colza',
          productionKg: 120,
          coutEuros: 80,
        }),
        plan({
          dateRealisee: '2026-06-01T00:00:00Z',
          miellee: 'lavande',
          productionKg: 90,
          coutEuros: 110,
        }),
      ]),
      MAINTENANT,
    );
    const g = blocsTranshumance(b).find((x) => x.type === 'graphe');
    expect(g).toBeDefined();
    if (g?.type !== 'graphe') return;
    expect(g.serie.map((p) => p.label)).toEqual(['colza', 'lavande']);
  });

  it('les tableaux ont autant de cellules que de colonnes', () => {
    const b = bilanTranshumance(data([plan()], [emplacement({ accordSigne: false })]), MAINTENANT);
    const tableaux = blocsTranshumance(b).filter((x) => x.type === 'tableau');
    expect(tableaux.length).toBeGreaterThanOrEqual(2);
    for (const t of tableaux) {
      if (t.type !== 'tableau') continue;
      for (const l of t.lignes) expect(l.length, t.titre).toBe(t.colonnes.length);
    }
  });

  it('rien du tout, aucune figure', () => {
    expect(blocsTranshumance(bilanTranshumance(data([]), MAINTENANT))).toEqual([]);
  });
});

describe('classifier et gating de la transhumance', () => {
  it.each(['mes transhumances', 'mes emplacements', 'ma prochaine transhumance'])(
    '%s → transhumance',
    (q) => {
      const c = classifier(q);
      expect(c.kind).toBe('action');
      if (c.kind !== 'action') return;
      expect(c.intent).toBe('transhumance');
    },
  );

  it.each([
    'comment marche ma transhumance ?',
    'à quoi sert ma transhumance ?',
    'je peux suivre mes transhumances ?',
    'je peux suivre mes emplacements ?',
  ])('%s ne déclenche AUCUN inventaire', (q) => {
    /**
     * LA LISTE D'EXCLUSIONS PARTAGÉE S'APPLIQUE ICI AUSSI — et ce banc doit le
     * PROUVER, pas l'affirmer.
     *
     * Ma première version demandait « comment marche LA transhumance ? ». Elle
     * passait, mais elle ne mesurait rien : « la transhumance » ne porte aucun
     * déclencheur (ils sont tous possessifs), donc la question partait vers le
     * savoir avec ou sans exclusion. Vérifié en retirant l'exclusion : ce cas
     * restait vert, les quatre ci-dessus basculent tous sur l'inventaire.
     *
     * Les trois premiers reçoivent une fiche de savoir ; le quatrième n'en a
     * pas encore et retombe en « inconnu » — donc au modèle. Dans les deux cas
     * la seule chose qui compte est la même : une question de FORME
     * interrogative ne reçoit jamais une liste de déplacements.
     */
    expect(classifier(q).kind, q).not.toBe('action');
  });

  it('suit exactement ROUTE_GATES', () => {
    const feature = ROUTE_GATES['POST /api/transhumance/plans']?.feature;
    expect(feature, 'la route transhumance doit rester gatée').toBeTruthy();
    for (const p of PLANS) {
      expect(refusDeLecture(p, 'transhumance') !== null, p).toBe(!hasFeature(p, feature!));
    }
  });

  it('le refus parle de déplacements et propose une alternative', () => {
    const refus = refusDeLecture('decouverte', 'transhumance')!;
    expect(refus).toMatch(/déplacement/i);
    expect(refus).toMatch(/Abonnement/i);
    expect(refus).toMatch(/En attendant/i);
  });
});
