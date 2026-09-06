import { describe, it, expect } from 'vitest';
import {
  classifier,
  projeterCheptel,
  rendreProjection,
  blocsProjection,
} from '~~/server/utils/copilote-local';
import { MARQUEURS_CERTITUDE } from '~~/server/utils/maya-consequences';
import { refusDeLecture } from '~~/server/utils/copilote-gating';
import { ROUTE_GATES } from '~~/app/config/route-gates';
import { PLANS, hasFeature, minimumPlanFor, getPlanConfig } from '~~/app/config/plans';
import type { InspectionsRuche } from '~~/server/utils/copilote-data';
import type { InspectionRow } from '~~/server/utils/santeScore';

const MAINTENANT = new Date('2026-06-15T09:00:00Z');

function inspection(p: Partial<InspectionRow> = {}): InspectionRow {
  return {
    rucheId: 'r-1',
    numero: '12',
    rucherId: 'ru-1',
    statut: 'active',
    qualiteReine: null,
    dateVisite: '2026-06-10T09:00:00Z',
    forceColonie: 6,
    couvain: 5,
    reserves: 6,
    reineVue: true,
    varroa: 1,
    comportement: 'calme',
    signeEssaimage: false,
    maladieObservee: null,
    ...p,
  };
}

const ruche = (numero: string, inspections: InspectionRow[]): InspectionsRuche => ({
  rucheId: `id-${numero}`,
  numero,
  rucher: 'Grand Pré',
  inspections,
});

describe('classifier — la question sur l’AVENIR ne doit pas répondre sur le présent', () => {
  it.each([
    'qu’est-ce qui peut arriver à mes ruches ?',
    'comment vont évoluer mes colonies ?',
    'quels risques dans les 30 jours ?',
    'fais-moi une projection',
    'que risque la ruche 12 si je ne fais rien ?',
    'quelle est la tendance de mes ruches ?',
    // ⚠️ CE CAS EST LE SEUL QUI PROUVE L'ORDRE DE LA LISTE D'INTENTIONS.
    // Il contient « santé » ET une formulation d'avenir : sans `prediction`
    // placée avant `sante`, la question sur le FUTUR reçoit une réponse sur le
    // PRÉSENT. Les cinq autres questions ci-dessus passent quel que soit
    // l'ordre — elles ne mesuraient donc pas ce que le commentaire du code
    // affirmait.
    'comment va évoluer la santé de mes ruches ?',
  ])('%s → prediction', (q) => {
    const c = classifier(q);
    expect(c.kind).toBe('action');
    if (c.kind !== 'action') return;
    expect(c.intent).toBe('prediction');
  });

  it('« fais-moi un point santé » reste une question sur le PRÉSENT', () => {
    const c = classifier('fais-moi un point santé');
    if (c.kind !== 'action') throw new Error('action attendue');
    expect(c.intent).toBe('sante');
  });

  it('une question sur le CIEL ne part pas vers la santé des colonies', () => {
    /**
     * Ces trois formulations portent un déclencheur de projection (`tendance`,
     * `evolution`, `a venir`) et parlent pourtant du temps qu'il fait. Sans les
     * exclusions de l'intention, les trois basculent sur la santé — vérifié en
     * retirant les exclusions, pas en le supposant.
     *
     * ⚠️ « prévisions météo » ne convient PAS comme cas de test : les synonymes
     * réécrivent « prévisions » en « météo » bien avant la détection, si bien
     * que la question part au bon endroit même sans exclusion. Le banc passait
     * donc sans rien mesurer.
     */
    for (const q of [
      'quelle est la tendance météo ?',
      'evolution du vent cette semaine',
      'quel temps à venir ?',
    ]) {
      const c = classifier(q);
      expect(c.kind, q).toBe('action');
      if (c.kind !== 'action') continue;
      expect(c.intent, q).toBe('meteo');
    }
  });
});

describe('projeterCheptel — on ne projette que ce qu’on peut projeter', () => {
  it('écarte les ruches sans aucun contrôle, et les NOMME', () => {
    // Un score plancher présenté comme une prévision serait un chiffre inventé.
    const r = projeterCheptel([ruche('7', []), ruche('8', [])], MAINTENANT);
    expect(r.projections).toEqual([]);
    expect(r.sansDonnees).toEqual(['7', '8']);
  });

  it('ne retient que les colonies porteuses d’un risque', () => {
    const saine = ruche('1', [inspection()]);
    const risquee = ruche('2', [inspection({ reserves: 1 })]);
    const r = projeterCheptel([saine, risquee], MAINTENANT);
    expect(r.projections.map((p) => p.numero)).toEqual(['2']);
  });

  it('classe les urgences d’abord', () => {
    const r = projeterCheptel(
      [
        ruche('A', [inspection({ reineVue: false })]),
        ruche('B', [inspection({ varroa: 9, reserves: 1, signeEssaimage: true })]),
      ],
      MAINTENANT,
    );
    const urgences = r.projections.map((p) => p.urgence);
    // L'ordre doit être décroissant en gravité, quel que soit l'ordre d'entrée.
    const rang = { urgente: 0, attention: 1, normale: 2 } as const;
    for (let i = 1; i < urgences.length; i++) {
      expect(rang[urgences[i]!]).toBeGreaterThanOrEqual(rang[urgences[i - 1]!]);
    }
  });

  it('attache à chaque risque sa conséquence', () => {
    const r = projeterCheptel([ruche('2', [inspection({ signeEssaimage: true })])], MAINTENANT);
    const p = r.projections[0]!;
    expect(p.risques.length).toBeGreaterThan(0);
    expect(p.consequences.length).toBeGreaterThan(0);
    for (const c of p.consequences) expect(p.risques).toContain(c.risque);
  });

  it('cheptel vide : rien, et surtout pas une projection fantôme', () => {
    const r = projeterCheptel([], MAINTENANT);
    expect(r.projections).toEqual([]);
    expect(r.sansDonnees).toEqual([]);
  });
});

describe('rendreProjection — le texte ne promet jamais', () => {
  it('n’écrit aucune conséquence au futur de l’indicatif', () => {
    /**
     * Le garde le plus important de ce lot. Une projection calculée sur trois
     * visites n'autorise pas « votre colonie va essaimer » : le jour où ça
     * n'arrive pas, l'apiculteur cesse de croire tout le reste.
     */
    const { projections, sansDonnees } = projeterCheptel(
      [
        ruche('1', [inspection({ varroa: 9 })]),
        ruche('2', [inspection({ reserves: 1 })]),
        ruche('3', [inspection({ signeEssaimage: true })]),
        ruche('4', [inspection({ reineVue: false })]),
        ruche('5', [inspection({ forceColonie: 1 })]),
      ],
      MAINTENANT,
    );
    const texte = rendreProjection(projections, sansDonnees);
    // On ne mesure QUE les lignes de conséquence (les autres portent des noms
    // de ruche et des scores, où « va » ne peut pas apparaître de toute façon).
    for (const ligne of texte.split('\n').filter((l) => l.trim().startsWith('- '))) {
      expect(MARQUEURS_CERTITUDE.test(ligne), ligne).toBe(false);
    }
  });

  it('dit explicitement que ce sont des tendances, pas des certitudes', () => {
    const { projections, sansDonnees } = projeterCheptel(
      [ruche('1', [inspection({ varroa: 9 })])],
      MAINTENANT,
    );
    expect(rendreProjection(projections, sansDonnees)).toMatch(/pas des certitudes/i);
  });

  it('sans donnée, propose de saisir un contrôle au lieu de rester muette', () => {
    const texte = rendreProjection([], ['7', '8']);
    expect(texte).toMatch(/contrôle/i);
    expect(texte).toMatch(/7/);
  });

  it('cheptel vide : oriente vers l’ajout de ruches', () => {
    expect(rendreProjection([], [])).toMatch(/ruche/i);
  });
});

describe('blocsProjection — les chiffres doivent tomber juste', () => {
  it('compte les colonies retenues, pas celles écartées', () => {
    const { projections } = projeterCheptel(
      [
        ruche('1', [inspection({ varroa: 9 })]),
        ruche('2', [inspection()]), // saine → écartée
        ruche('3', []), // sans donnée → écartée
      ],
      MAINTENANT,
    );
    const stats = blocsProjection(projections)[0]!;
    if (stats.type !== 'stats') throw new Error('stats attendu');
    expect(stats.items.find((i) => i.label === 'Colonies à surveiller')!.valeur).toBe('1');
  });

  it('aucune projection, aucune figure', () => {
    expect(blocsProjection([])).toEqual([]);
  });

  it('le tableau a autant de cellules que de colonnes', () => {
    const { projections } = projeterCheptel([ruche('1', [inspection({ varroa: 9 })])], MAINTENANT);
    const tab = blocsProjection(projections).find((b) => b.type === 'tableau')!;
    if (tab.type !== 'tableau') return;
    for (const l of tab.lignes) expect(l.length).toBe(tab.colonnes.length);
  });
});

describe('la projection est VENDUE — Maya ne doit pas la donner', () => {
  /**
   * LE DÉFAUT QUE CE BANC EXISTE POUR EMPÊCHER, ET QUE J'AI INTRODUIT.
   *
   * La route de prédiction d'une ruche est gatée `scorePredictif`. En câblant
   * l'intention Maya, je l'avais laissée SANS verrou : la page tarifs serait
   * restée exacte, et le produit l'aurait démentie en une phrase de
   * conversation. C'est la forme la plus discrète du contournement de
   * catalogue — elle se manifeste par une réponse plus généreuse que prévu,
   * jamais par une erreur.
   */
  it('un plan sans score prédictif reçoit un refus, pas une projection', () => {
    const refus = refusDeLecture('decouverte', 'prediction');
    expect(refus, 'Découverte doit être refusé').not.toBeNull();
  });

  it('le refus NOMME le plan qui débloque et dit où aller', () => {
    // « Ne jamais bloquer sans porte de sortie » : un refus qui ne dit pas
    // comment débloquer transforme une limite commerciale en cul-de-sac.
    const refus = refusDeLecture('decouverte', 'prediction')!;
    expect(refus).toMatch(/Abonnement/i);
    expect(refus, 'le plan qui débloque doit être nommé').toMatch(/Starter|Pro|Expert/);
    // Et il propose ce que Maya PEUT faire à la place.
    expect(refus).toMatch(/point santé/i);
  });

  it('le plan qui contient la fonctionnalité passe sans refus', () => {
    expect(refusDeLecture('expert', 'prediction')).toBeNull();
  });

  it('la règle est LUE dans ROUTE_GATES, pas recopiée', () => {
    /**
     * Deux tables qui décrivent la même règle finissent toujours par diverger.
     * Si la route change de feature, le refus de Maya doit suivre tout seul —
     * on vérifie donc que le plan minimum du refus correspond bien à celui que
     * `ROUTE_GATES` impose, sans qu'aucun nom de plan ne soit écrit en dur.
     */
    const gate = ROUTE_GATES['GET /api/ruches/*/prediction'];
    expect(gate?.feature, 'la route de prédiction doit rester gatée').toBeTruthy();
    const requis = minimumPlanFor(gate!.feature!);
    for (const p of PLANS) {
      const refuse = refusDeLecture(p, 'prediction') !== null;
      expect(refuse, `${p}`).toBe(!hasFeature(p, gate!.feature!));
    }
    expect(refusDeLecture('decouverte', 'prediction')).toContain(getPlanConfig(requis).label);
  });
});
