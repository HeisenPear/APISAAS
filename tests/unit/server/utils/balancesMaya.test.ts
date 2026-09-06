import { describe, it, expect } from 'vitest';
import {
  classifier,
  etatsBalances,
  rendreBalances,
  blocsBalances,
} from '~~/server/utils/copilote-local';
import { refusDeLecture } from '~~/server/utils/copilote-gating';
import { SEUILS_BALANCE_DEFAUT, SEUIL_MIELLEE_KG } from '~~/server/utils/balances/alertes';
import { ROUTE_GATES } from '~~/app/config/route-gates';
import { PLANS, hasFeature } from '~~/app/config/plans';
import type { BalanceRow } from '~~/server/utils/copilote-data';

/**
 * LE SIGNAL LE PLUS UTILE D'UNE BALANCE N'EST PAS LE POIDS.
 *
 * C'est le SILENCE. Un capteur qui a cessé d'émettre est pire qu'une absence de
 * capteur, parce qu'on continue de lui faire confiance : on croit surveiller
 * une ruche qu'on ne surveille plus.
 *
 * Second invariant, tout aussi important : aucun seuil n'est recopié. Ils
 * viennent de `balances/alertes.ts`, où ils sont documentés ET surchargeables
 * balance par balance. Deux barèmes pour une même balance donneraient deux
 * verdicts contradictoires — l'un dans les alertes, l'autre dans la conversation.
 */
const MAINTENANT = new Date('2026-06-15T12:00:00Z');

function balance(p: Partial<BalanceRow> = {}): BalanceRow {
  return {
    nom: 'Balance A',
    ruche: '12',
    rucher: 'Grand Pré',
    poidsNetKg: 38.2,
    variation24hKg: 0.4,
    batteriePct: 80,
    mesureeAt: '2026-06-15T10:00:00Z', // 2 h avant
    seuilBatteriePct: null,
    seuilSilenceHeures: null,
    ...p,
  };
}

/** Une mesure vieille de `h` heures. */
const ilYA = (h: number) => new Date(MAINTENANT.getTime() - h * 3_600_000).toISOString();

describe('etatsBalances — le silence est le vrai signal', () => {
  it('déclare muette une balance qui dépasse son seuil de silence', () => {
    const [e] = etatsBalances([balance({ mesureeAt: ilYA(20) })], MAINTENANT);
    expect(e!.muette).toBe(true);
    expect(Math.round(e!.silenceHeures!)).toBe(20);
  });

  it('laisse vivante une balance qui a parlé récemment', () => {
    const [e] = etatsBalances([balance({ mesureeAt: ilYA(3) })], MAINTENANT);
    expect(e!.muette).toBe(false);
  });

  it('une balance qui n’a JAMAIS mesuré est muette elle aussi', () => {
    // Elle est posée, elle ne dit rien : le résultat pour l'apiculteur est le
    // même que pour un capteur tombé en panne, et doit se dire pareil.
    const [e] = etatsBalances([balance({ mesureeAt: null })], MAINTENANT);
    expect(e!.muette).toBe(true);
    expect(e!.silenceHeures).toBeNull();
  });

  it('respecte le seuil PROPRE à chaque balance, pas le défaut', () => {
    /**
     * Les seuils sont surchargeables une par une. Juger toutes les balances sur
     * le défaut ferait mentir les réglages de l'apiculteur — et il n'aurait
     * aucun moyen de comprendre pourquoi.
     */
    const tolerante = balance({ mesureeAt: ilYA(30), seuilSilenceHeures: 48 });
    const stricte = balance({ mesureeAt: ilYA(30), seuilSilenceHeures: 6 });
    const [a, b] = etatsBalances([tolerante, stricte], MAINTENANT);
    expect(a!.muette, 'seuil à 48 h, silence de 30 h').toBe(false);
    expect(b!.muette, 'seuil à 6 h, silence de 30 h').toBe(true);
  });

  it('suit le seuil de batterie du produit, sans le recopier', () => {
    const juste = SEUILS_BALANCE_DEFAUT.batteriePct;
    const [bas] = etatsBalances([balance({ batteriePct: juste })], MAINTENANT);
    const [ok] = etatsBalances([balance({ batteriePct: juste + 1 })], MAINTENANT);
    expect(bas!.batterieFaible, `${juste} % doit alerter`).toBe(true);
    expect(ok!.batterieFaible, `${juste + 1} % ne doit pas alerter`).toBe(false);
  });

  it('une batterie inconnue n’est pas une batterie faible', () => {
    const [e] = etatsBalances([balance({ batteriePct: null })], MAINTENANT);
    expect(e!.batterieFaible).toBe(false);
  });

  it('la miellée suit le seuil du produit', () => {
    const [oui] = etatsBalances([balance({ variation24hKg: SEUIL_MIELLEE_KG })], MAINTENANT);
    const [non] = etatsBalances([balance({ variation24hKg: SEUIL_MIELLEE_KG - 0.1 })], MAINTENANT);
    expect(oui!.enMiellee).toBe(true);
    expect(non!.enMiellee).toBe(false);
  });
});

describe('rendreBalances — dire le silence, pas seulement le poids', () => {
  it('signale explicitement les balances muettes', () => {
    const etats = etatsBalances(
      [balance({ nom: 'A', mesureeAt: ilYA(2) }), balance({ nom: 'B', mesureeAt: ilYA(40) })],
      MAINTENANT,
    );
    const t = rendreBalances(etats);
    expect(t).toMatch(/ne dit plus rien|ne disent plus rien/i);
    expect(t).toMatch(/\bB\b/);
  });

  it('ne compte pas une balance muette parmi celles qui répondent', () => {
    const etats = etatsBalances(
      [balance({ mesureeAt: ilYA(2) }), balance({ mesureeAt: ilYA(40) })],
      MAINTENANT,
    );
    expect(rendreBalances(etats)).toMatch(/dont 1 qui répond/);
  });

  it('aucune balance : explique à quoi ça sert, au lieu d’un vide', () => {
    expect(rendreBalances([])).toMatch(/poids en direct/i);
  });

  it('un poids absent ne devient pas un zéro', () => {
    // Une mesure sans poids net (capteur partiel) ne doit pas s'afficher
    // « 0 kg » — ce serait lire une ruche vide là où il n'y a pas de donnée.
    const etats = etatsBalances([balance({ poidsNetKg: null })], MAINTENANT);
    const t = rendreBalances(etats);
    expect(t).toMatch(/poids inconnu/i);
    expect(t).not.toMatch(/\b0 kg net\b/);
  });
});

describe('blocsBalances — comparer suppose au moins deux valeurs', () => {
  it('pas de graphe avec une seule balance pesée', () => {
    const etats = etatsBalances([balance()], MAINTENANT);
    expect(blocsBalances(etats).some((b) => b.type === 'graphe')).toBe(false);
  });

  it('pas de graphe si les balances vivantes n’ont pas de poids', () => {
    const etats = etatsBalances(
      [balance({ poidsNetKg: null }), balance({ poidsNetKg: null })],
      MAINTENANT,
    );
    expect(blocsBalances(etats).some((b) => b.type === 'graphe')).toBe(false);
  });

  it('le tableau des silencieuses n’apparaît que s’il y en a', () => {
    const vivantes = etatsBalances([balance(), balance()], MAINTENANT);
    expect(blocsBalances(vivantes).some((b) => b.type === 'tableau')).toBe(false);

    const avecMuette = etatsBalances([balance(), balance({ mesureeAt: ilYA(40) })], MAINTENANT);
    const tab = blocsBalances(avecMuette).find((b) => b.type === 'tableau');
    expect(tab).toBeDefined();
    if (tab?.type !== 'tableau') return;
    for (const l of tab.lignes) expect(l.length).toBe(tab.colonnes.length);
  });

  it('aucune balance, aucune figure', () => {
    expect(blocsBalances([])).toEqual([]);
  });
});

describe('classifier et gating des balances', () => {
  it.each(['mes balances', 'combien pèsent mes ruches ?', 'poids de mes ruches'])(
    '%s → balances',
    (q) => {
      const c = classifier(q);
      expect(c.kind).toBe('action');
      if (c.kind !== 'action') return;
      expect(c.intent).toBe('balances');
    },
  );

  it('suit exactement ROUTE_GATES', () => {
    const feature = ROUTE_GATES['PUT /api/balances/*']?.feature;
    expect(feature, 'la route balances doit rester gatée').toBeTruthy();
    for (const p of PLANS) {
      expect(refusDeLecture(p, 'balances') !== null, p).toBe(!hasFeature(p, feature!));
    }
  });

  it('le refus parle de balances et propose une alternative', () => {
    const refus = refusDeLecture('decouverte', 'balances')!;
    expect(refus).toMatch(/poids/i);
    expect(refus).toMatch(/Abonnement/i);
    expect(refus).toMatch(/En attendant/i);
  });
});

describe('la frontière savoir / données, sur les QUATRE intentions', () => {
  /**
   * LA MÊME LEÇON, APPRISE DEUX FOIS.
   *
   * D'abord avec les reines : des déclencheurs nus ont volé quatre fiches de
   * savoir au corpus. J'ai cru que le possessif suffisait à trancher — puis
   * « comment marche MA balance ? » en a volé deux de plus. Le possessif est
   * bien là, et pourtant la bonne réponse est une fiche.
   *
   * Ce qui distingue n'est pas le possessif, c'est la FORME INTERROGATIVE :
   * demander comment ça marche, ou si c'est possible, n'est jamais une demande
   * d'inventaire.
   *
   * Ce banc vérifie que les quatre intentions de données partagent bien la même
   * liste — quatre copies divergeraient, et le trou se rouvrirait sur celle
   * qu'on aurait oubliée.
   */
  it.each([
    'comment marche ma balance ?',
    'je peux suivre le poids de mes ruches ?',
    'à quoi sert le marquage de mes reines ?',
    'je peux suivre mes reines ?',
  ])('%s ne déclenche AUCUN inventaire', (q) => {
    expect(classifier(q).kind, q).not.toBe('action');
  });

  it('les demandes de données passent toujours, elles', () => {
    // Le garde ne doit pas être si large qu'il assèche l'intention.
    const attendus: Array<[string, string]> = [
      ['mes balances', 'balances'],
      ['combien pèsent mes ruches ?', 'balances'],
      ['mes reines', 'reines'],
      ['mes lignées', 'elevage'],
      ['ma session de greffage', 'elevage'],
      ['qu’est-ce qui peut arriver à mes ruches ?', 'prediction'],
    ];
    for (const [q, intent] of attendus) {
      const c = classifier(q);
      expect(c.kind, q).toBe('action');
      if (c.kind !== 'action') continue;
      expect(c.intent, q).toBe(intent);
    }
  });
});
