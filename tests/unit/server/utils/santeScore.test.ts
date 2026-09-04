import { describe, it, expect } from 'vitest';
import {
  computeHiveScore,
  computeScore,
  computeRucherScore,
  scoreLabel,
  SEUIL_COLONIE_FRAGILE,
  VARROA_PCT,
  type InspectionRow,
  type EvenementSante,
} from '~/server/utils/santeScore';

const REF = new Date('2025-06-15T12:00:00Z');

function base(partial: Partial<InspectionRow> = {}): InspectionRow {
  return {
    rucheId: 'r1',
    numero: 'R-01',
    rucherId: 'a1',
    statut: 'active',
    qualiteReine: 'bonne',
    dateVisite: '2025-06-10T10:00:00Z', // 5 jours avant REF
    forceColonie: 4,
    couvain: 4,
    reserves: 4,
    reineVue: true,
    varroa: 1,
    comportement: 'calme',
    signeEssaimage: false,
    maladieObservee: null,
    ...partial,
  };
}

describe('server/utils/santeScore', () => {
  describe('états terminaux', () => {
    it('colonie morte → 0', () => {
      expect(computeHiveScore(base({ statut: 'morte' })).score).toBe(0);
      expect(computeScore(base({ statut: 'morte' }))).toBe(0);
    });
    it('vendue / fusionnée → non comptabilisée (null)', () => {
      expect(computeHiveScore(base({ statut: 'vendue' })).score).toBeNull();
      expect(computeHiveScore(base({ statut: 'fusionnee' })).score).toBeNull();
    });
  });

  describe('colonie saine', () => {
    it('toutes constantes au vert → score élevé', () => {
      const r = computeHiveScore(base({ aujourdhui: REF }));
      expect(r.score).toBeGreaterThanOrEqual(85);
      expect(r.niveau).toBe('Excellent');
    });
  });

  describe('varroa', () => {
    it('infestation critique (>5%) effondre la composante varroa', () => {
      const sain = computeHiveScore(base({ aujourdhui: REF, varroa: 1 })).score!;
      const infeste = computeHiveScore(base({ aujourdhui: REF, varroa: 8 })).score!;
      expect(infeste).toBeLessThan(sain - 15);
    });
    it('un traitement varroa récent remonte la trajectoire', () => {
      const evenements: EvenementSante[] = [{ type: 'varroa', date: '2025-06-08T10:00:00Z' }];
      const sans = computeHiveScore(base({ aujourdhui: REF, varroa: 4 })).score!;
      const avec = computeHiveScore(base({ aujourdhui: REF, varroa: 4, evenements })).score!;
      expect(avec).toBeGreaterThan(sans);
    });
  });

  describe('essaimage et reprise (cas métier clé)', () => {
    it('colonie essaimée sans reine → plafonnée bas', () => {
      const r = computeHiveScore(
        base({
          aujourdhui: REF,
          statut: 'essaimee',
          couvain: 0,
          reineVue: false,
          qualiteReine: 'absente',
        }),
      );
      expect(r.score!).toBeLessThanOrEqual(30);
    });
    it('reine réintroduite après essaimage → reprise (plafond relevé)', () => {
      const evenements: EvenementSante[] = [
        { type: 'essaimage', date: '2025-06-01T10:00:00Z' },
        { type: 'introduction', date: '2025-06-08T10:00:00Z' },
      ];
      const r = computeHiveScore(
        base({ aujourdhui: REF, statut: 'essaimee', couvain: 0, evenements }),
      );
      expect(r.score!).toBeGreaterThan(30);
      expect(r.score!).toBeLessThanOrEqual(60);
    });
    it('reprise de ponte confirmée → plafond levé, le score repart', () => {
      const evenements: EvenementSante[] = [
        { type: 'essaimage', date: '2025-05-20T10:00:00Z' },
        { type: 'ponte_vue', date: '2025-06-10T10:00:00Z', ponteConfirmee: true },
      ];
      const r = computeHiveScore(base({ aujourdhui: REF, statut: 'active', evenements }));
      expect(r.score!).toBeGreaterThan(60);
    });
  });

  describe('orpheline', () => {
    it('colonie orpheline → plafonnée', () => {
      expect(
        computeHiveScore(base({ aujourdhui: REF, statut: 'orpheline', couvain: 0 })).score!,
      ).toBeLessThanOrEqual(30);
    });
  });

  describe('maladies', () => {
    it('loque → pénalité sévère', () => {
      const sain = computeHiveScore(base({ aujourdhui: REF })).score!;
      const loque = computeHiveScore(
        base({ aujourdhui: REF, maladieObservee: 'Loque américaine' }),
      ).score!;
      expect(sain - loque).toBeGreaterThanOrEqual(40);
    });
  });

  describe('fraîcheur', () => {
    it('un contrôle ancien (>30j) décote le score', () => {
      const recent = computeHiveScore(
        base({ aujourdhui: REF, dateVisite: '2025-06-10T10:00:00Z' }),
      ).score!;
      const ancien = computeHiveScore(
        base({ aujourdhui: REF, dateVisite: '2025-04-01T10:00:00Z' }),
      ).score!;
      expect(ancien).toBeLessThan(recent);
    });
    it('aucun contrôle → confiance faible', () => {
      const r = computeHiveScore(base({ aujourdhui: REF, dateVisite: null }));
      expect(r.confiance).toBe('faible');
      expect(r.score!).toBeLessThanOrEqual(60);
    });
  });

  describe('computeRucherScore', () => {
    it('moyenne des ruches comptabilisées, exclut vendue/fusionnée', () => {
      const agg = computeRucherScore([
        { score: 90, statut: 'active' },
        { score: 50, statut: 'faible' },
        { score: null, statut: 'vendue' },
      ]);
      expect(agg.score).toBe(70);
      expect(agg.nbRuches).toBe(2);
    });
    it('une ruche morte (0) pèse sur le rucher', () => {
      const agg = computeRucherScore([
        { score: 90, statut: 'active' },
        { score: 0, statut: 'morte' },
      ]);
      expect(agg.score).toBe(45);
      expect(agg.nbCritiques).toBe(1);
    });
    it('rucher sans ruche comptabilisée → null', () => {
      expect(computeRucherScore([{ score: null, statut: 'vendue' }]).score).toBeNull();
    });
  });

  describe('scoreLabel', () => {
    it('paliers', () => {
      expect(scoreLabel(85)).toBe('Excellent');
      expect(scoreLabel(65)).toBe('Bon');
      expect(scoreLabel(45)).toBe('Correct');
      expect(scoreLabel(25)).toBe('Fragile');
      expect(scoreLabel(10)).toBe('Critique');
    });

    it('l’étiquette et le seuil de fragilité ne peuvent pas se contredire', () => {
      /**
       * ⚠️ LE CHIFFRE 40 ÉTAIT ÉCRIT EN DUR À SIX ENDROITS — ici, dans
       * `computeRucherScore`, dans le briefing de Maya, et trois fois dans le
       * moteur de réponses, dont une DANS la phrase montrée à l'apiculteur
       * (« sous surveillance (score < 40) »). Six copies d'une même règle, donc
       * six occasions de diverger : le jour où l'une bouge, le compteur du
       * briefing et la liste de la réponse cessent de parler des mêmes colonies,
       * en silence.
       *
       * Elles dérivent maintenant toutes de `SEUIL_COLONIE_FRAGILE`. Ce cas
       * ancre l'invariant qui donne son sens au nom : juste sous le seuil,
       * l'étiquette dit déjà « Fragile ». Déplacer l'un sans l'autre le fait
       * tomber.
       */
      expect(scoreLabel(SEUIL_COLONIE_FRAGILE)).toBe('Correct');
      expect(scoreLabel(SEUIL_COLONIE_FRAGILE - 1)).toBe('Fragile');
    });
  });

  describe('seuils ITSAP du varroa', () => {
    it('les valeurs sont celles de l’ITSAP, écrites en toutes lettres', () => {
      /**
       * ⚠️ CES TROIS NOMBRES SONT PINÉS EN DUR, ET C'EST VOLONTAIRE.
       *
       * La première version de ce cas comparait `avec(VARROA_PCT.bas)` à
       * `avec(VARROA_PCT.traitement)` — les deux côtés lisant la constante
       * mutée, la comparaison se déplaçait avec elle. Passer le seuil de
       * traitement de 3 à 4 laissait le banc VERT : il se mesurait lui-même.
       *
       * 1 %, 3 % et 5 % ne sont pas des réglages : ce sont les seuils publiés
       * par l'ITSAP (infestation phorétique basse / seuil de traitement /
       * critique). Les changer serait changer d'avis sur une donnée
       * scientifique, ce qui mérite qu'un banc le demande explicitement.
       *
       * Ce que ce cas NE prouve pas, et qu'il faut savoir : que
       * `composanteVarroa` lise bien la constante plutôt qu'un littéral
       * identique. Tant que les deux valent 3, aucune mesure ne peut les
       * distinguer. La dérivation est ici une propriété de maintenance — elle
       * évite qu'un futur changement n'en oublie une —, pas une propriété
       * observable.
       */
      expect(VARROA_PCT).toEqual({ bas: 1, traitement: 3, critique: 5 });
    });

    it('le score chute quand on franchit chaque palier', () => {
      const avec = (pct: number) =>
        computeHiveScore({ ...base({ varroa: pct }), aujourdhui: REF }).score ?? 0;
      expect(avec(1)).toBeGreaterThan(avec(3));
      expect(avec(3)).toBeGreaterThan(avec(6));
    });
  });
});
