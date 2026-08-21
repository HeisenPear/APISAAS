import { describe, it, expect } from 'vitest';
import {
  classifier,
  couleurAttendue,
  marquagesIncoherents,
  rendreReines,
  blocsReines,
  rendreElevage,
  blocsElevage,
} from '~~/server/utils/copilote-local';
import { refusDeLecture } from '~~/server/utils/copilote-gating';
import { ROUTE_GATES } from '~~/app/config/route-gates';
import { PLANS, hasFeature } from '~~/app/config/plans';
import type { ReineRow, SessionGreffageRow } from '~~/server/utils/copilote-data';

/**
 * Maya lisait sept tables sur les soixante-deux du schéma. Les reines, les
 * lignées, le greffage : invisibles. Un apiculteur qui greffe tient là son
 * travail le plus technique de l'année, et sa copilote n'en savait rien.
 */

const reine = (p: Partial<ReineRow> = {}): ReineRow => ({
  ruche: '12',
  rucher: 'Grand Pré',
  couleur: 'bleu',
  annee: 2025,
  race: 'buckfast',
  qualite: 'bonne',
  ...p,
});

const session = (p: Partial<SessionGreffageRow> = {}): SessionGreffageRow => ({
  date: '2026-05-12T09:00:00Z',
  technique: 'doolittle',
  greffees: 20,
  acceptees: 14,
  nees: 12,
  terminee: true,
  lignee: 'Souche A',
  ...p,
});

describe('code couleur international — la convention, pas une approximation', () => {
  it('respecte la table officielle du dernier chiffre', () => {
    // 1/6 blanc · 2/7 jaune · 3/8 rouge · 4/9 vert · 5/0 bleu
    const attendu: Record<number, string> = {
      2021: 'blanc',
      2026: 'blanc',
      2022: 'jaune',
      2027: 'jaune',
      2023: 'rouge',
      2028: 'rouge',
      2024: 'vert',
      2029: 'vert',
      2025: 'bleu',
      2030: 'bleu',
    };
    for (const [an, couleur] of Object.entries(attendu)) {
      expect(couleurAttendue(Number(an)), an).toBe(couleur);
    }
  });

  it('couvre les dix chiffres — aucun trou dans la table', () => {
    for (let an = 2020; an <= 2039; an++) expect(couleurAttendue(an), String(an)).toBeTruthy();
  });

  it('sans année, aucune couleur attendue', () => {
    expect(couleurAttendue(null)).toBeNull();
    expect(couleurAttendue(Number.NaN)).toBeNull();
  });
});

describe('marquagesIncoherents — signaler une contradiction, jamais un manque', () => {
  it('repère une couleur qui contredit l’année', () => {
    const out = marquagesIncoherents([reine({ annee: 2025, couleur: 'rouge' })]);
    expect(out).toHaveLength(1);
    expect(out[0]!.attendue).toBe('bleu');
  });

  it('ne signale pas une reine sans année ni une reine sans couleur', () => {
    /**
     * L'invariant qui évite de crier au loup. Une fiche incomplète n'est pas
     * une erreur de marquage : confondre les deux ferait signaler des dizaines
     * de ruches simplement pas encore renseignées.
     */
    expect(marquagesIncoherents([reine({ annee: null })])).toEqual([]);
    expect(marquagesIncoherents([reine({ couleur: null })])).toEqual([]);
    expect(marquagesIncoherents([reine({ annee: null, couleur: null })])).toEqual([]);
  });

  it('laisse passer un marquage correct', () => {
    expect(marquagesIncoherents([reine({ annee: 2024, couleur: 'vert' })])).toEqual([]);
  });
});

describe('rendreReines — l’âge est le signal du module', () => {
  it('signale les reines de trois ans et plus', () => {
    const t = rendreReines([reine({ annee: 2022 }), reine({ annee: 2026 })], 2026);
    expect(t).toMatch(/trois ans ou plus/i);
  });

  it('ne juge pas l’âge d’une reine sans année — et le dit', () => {
    const t = rendreReines([reine({ annee: null })], 2026);
    expect(t).toMatch(/pas d’année renseignée/i);
  });

  it('aucune ruche active : oriente au lieu de rester vide', () => {
    expect(rendreReines([], 2026)).toMatch(/ruche/i);
  });
});

describe('blocsReines — une barre seule ne montre pas un vieillissement', () => {
  it('pas de graphe quand toutes les reines ont la même année', () => {
    const b = blocsReines([reine({ annee: 2025 }), reine({ annee: 2025 })], 2026);
    expect(b.some((x) => x.type === 'graphe')).toBe(false);
  });

  it('graphe dès que deux années coexistent, trié chronologiquement', () => {
    const b = blocsReines([reine({ annee: 2026 }), reine({ annee: 2023 })], 2026);
    const g = b.find((x) => x.type === 'graphe');
    expect(g).toBeDefined();
    if (g?.type !== 'graphe') return;
    expect(g.serie.map((p) => p.label)).toEqual(['2023', '2026']);
  });

  it('le tableau des marquages a autant de cellules que de colonnes', () => {
    const b = blocsReines([reine({ annee: 2025, couleur: 'rouge' })], 2026);
    const t = b.find((x) => x.type === 'tableau');
    expect(t).toBeDefined();
    if (t?.type !== 'tableau') return;
    for (const l of t.lignes) expect(l.length).toBe(t.colonnes.length);
  });
});

describe('élevage — une session non relevée n’est PAS un échec', () => {
  it('exclut du taux les sessions sans relevé, au lieu de les compter à zéro', () => {
    /**
     * LE PIÈGE DE CE MODULE. `acceptees` est NULL tant que la session n'a pas
     * été relevée. Traité comme un zéro, il afficherait un taux catastrophique
     * là où il n'y a qu'une saisie en attente — sur un indicateur de
     * savoir-faire, c'est le genre de faux qu'on ne pardonne pas.
     */
    const t = rendreElevage([
      session({ greffees: 10, acceptees: 8 }),
      session({ greffees: 10, acceptees: null }),
    ]);
    expect(t).toMatch(/80\s*%/); // 8/10, et non 8/20
    expect(t).toMatch(/pas encore de relevé/i);
  });

  it('aucune session relevée : pas de taux inventé', () => {
    const t = rendreElevage([session({ acceptees: null })]);
    expect(t).not.toMatch(/%/);
  });

  it('aucune session : oriente vers la saisie', () => {
    expect(rendreElevage([])).toMatch(/greffage/i);
  });

  it('le bloc affiche « — » plutôt qu’un zéro quand rien n’est relevé', () => {
    const b = blocsElevage([session({ acceptees: null })]);
    const stats = b[0]!;
    if (stats.type !== 'stats') throw new Error('stats attendu');
    expect(stats.items.find((i) => i.label.includes('acceptation'))!.valeur).toBe('—');
  });

  it('pas de courbe avec une seule session relevée', () => {
    // Une seule mesure ne montre aucune progression, qui est tout l'intérêt.
    const b = blocsElevage([session(), session({ acceptees: null })]);
    expect(b.some((x) => x.type === 'graphe')).toBe(false);
  });

  it('courbe dès deux sessions relevées, la plus ancienne d’abord', () => {
    const b = blocsElevage([
      session({ date: '2026-06-01T00:00:00Z', greffees: 10, acceptees: 5 }),
      session({ date: '2026-05-01T00:00:00Z', greffees: 10, acceptees: 9 }),
    ]);
    const g = b.find((x) => x.type === 'graphe');
    expect(g).toBeDefined();
    if (g?.type !== 'graphe') return;
    expect(g.serie.map((p) => p.valeur)).toEqual([90, 50]);
  });
});

describe('classifier — greffage et reines sont DEUX domaines, deux plans', () => {
  it.each(['ma session de greffage', 'quel est mon taux d’acceptation ?', 'mes lignées'])(
    '%s → elevage',
    (q) => {
      const c = classifier(q);
      expect(c.kind).toBe('action');
      if (c.kind !== 'action') return;
      expect(c.intent).toBe('elevage');
    },
  );

  it.each(['l’âge de mes reines', 'quelles reines remplacer ?', 'combien de reines ai-je ?'])(
    '%s → reines',
    (q) => {
      const c = classifier(q);
      expect(c.kind).toBe('action');
      if (c.kind !== 'action') return;
      expect(c.intent).toBe('reines');
    },
  );

  it.each([
    'couleur de reine',
    'comment marquer une reine',
    'qu’est-ce qu’une colonie orpheline',
    'comment savoir si ma reine est bonne',
  ])('%s reste du SAVOIR, pas un inventaire', (q) => {
    /**
     * LA FRONTIÈRE QUE CE BANC VERROUILLE, ET QUE J'AI FRANCHIE.
     *
     * Mes premiers déclencheurs étaient des mots nus — « reine », « marquage »,
     * « greffage ». Ils ont volé quatre fiches de savoir au corpus (86 → 82) :
     * à « comment savoir si ma reine est bonne », Maya répondait par la liste
     * des reines. Une question de connaissance recevait un inventaire.
     *
     * La frontière n'est pas le vocabulaire, c'est la CIBLE. Les intentions
     * passant avant le savoir, un déclencheur sans possessif fait toujours
     * perdre le savoir.
     */
    expect(classifier(q).kind, q).toBe('savoir');
  });

  it('« cellules acceptées » part vers l’élevage, pas vers le module Reine', () => {
    // Le mot « reine » apparaît dans les deux domaines ; c'est l'ordre de la
    // liste d'intentions qui tranche, et ce cas le prouve.
    const c = classifier('combien de cellules acceptées cette session ?');
    if (c.kind !== 'action') throw new Error('action attendue');
    expect(c.intent).toBe('elevage');
  });
});

describe('les deux capacités sont VENDUES — Maya ne les donne pas', () => {
  it.each(['reines', 'elevage'] as const)('%s suit exactement ROUTE_GATES', (lecture) => {
    /**
     * Le module Reine est Starter, l'élevage est Expert. Servir l'un ou l'autre
     * sans vérifier le plan contournerait le catalogue par la conversation —
     * la forme la plus discrète, puisqu'elle se manifeste par une réponse plus
     * GÉNÉREUSE que prévu, jamais par une erreur.
     */
    const route = lecture === 'reines' ? 'PUT /api/ruches/*/reine' : 'GET /api/elevage/classement';
    const feature = ROUTE_GATES[route]?.feature;
    expect(feature, `${route} doit rester gatée`).toBeTruthy();
    for (const p of PLANS) {
      expect(refusDeLecture(p, lecture) !== null, `${p}/${lecture}`).toBe(!hasFeature(p, feature!));
    }
  });

  it('chaque refus nomme la sortie ET ce que Maya peut faire à la place', () => {
    for (const lecture of ['reines', 'elevage'] as const) {
      const refus = refusDeLecture('decouverte', lecture)!;
      expect(refus, lecture).toMatch(/Abonnement/i);
      expect(refus, lecture).toMatch(/En attendant/i);
    }
  });

  it('chaque refus parle de SA capacité, pas d’une autre', () => {
    /**
     * Comparer simplement les deux textes ne suffisait pas : ils diffèrent déjà
     * par le nom du plan requis (Starter pour les reines, Expert pour
     * l'élevage). Le banc passait donc même en servant à tous la phrase de la
     * projection — vérifié par mutation. Ce qu'il faut mesurer, c'est que le
     * refus nomme bien le sujet demandé.
     */
    expect(refusDeLecture('decouverte', 'reines')!).toMatch(/reine/i);
    expect(refusDeLecture('decouverte', 'elevage')!).toMatch(/greffage/i);
    expect(refusDeLecture('decouverte', 'prediction')!).toMatch(/30 jours/i);
    // Et aucun ne doit parler du sujet d'un autre.
    expect(refusDeLecture('decouverte', 'reines')!).not.toMatch(/greffage/i);
    expect(refusDeLecture('decouverte', 'elevage')!).not.toMatch(/30 jours/i);
  });
});
