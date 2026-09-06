// ═══════════════════════════════════════════════════════════════════════════
// PLUS AUCUNE DÉPENSE NE POUVAIT ÊTRE SUPPRIMÉE — ET LE REFUS PARLAIT D'AVOIR.
//
// Ce banc garde une règle qui a divergé DEUX FOIS, dans les deux sens :
//
//   1. le `DELETE` de facture n'avait pas le garde de son `PUT` : n'importe
//      quelle facture émise s'effaçait, et son numéro était réattribué ;
//   2. le garde ajouté était PLUS LARGE que son motif. Posé sur toute la
//      table `transactions`, il valait aussi pour les ACHATS — or un achat
//      naît avec un numéro (AC-AAAA-NNNN) et le statut « payee ». Toutes les
//      dépenses sont devenues indélébiles dès la première, et le refus
//      conseillait de « créer une facture d'avoir » : un geste sans aucun sens
//      pour ce qu'on a soi-même acheté. La page Achats propose pourtant
//      « Supprimer » à deux endroits, et le clic échouait.
//
// Le second défaut est celui que ce dépôt appelle « la dispense plus large que
// son motif », pris par l'autre bout : une INTERDICTION plus large que le sien.
// Il est resté en production quelques heures.
//
// ⚠️ LE BALAYAGE EST UN PRODUIT CARTÉSIEN, PAS UNE LISTE DE CAS. Douze
// combinaisons de (type × statut × numéro) sont toutes énumérées et toutes
// jugées : une règle qui change de forme est vue le jour même, et aucun cas ne
// peut disparaître en silence.
// ═══════════════════════════════════════════════════════════════════════════

import { describe, expect, it } from 'vitest';
import {
  refusDeSuppression,
  type TransactionASupprimer,
} from '~~/server/utils/suppressionTransaction';

const TYPES: TransactionASupprimer['type'][] = ['vente', 'achat'];
const STATUTS = ['brouillon', 'envoyee', 'payee', 'en_retard', 'annulee'];
const NUMEROS = [null, 'FA-2026-0001'];

/** Toutes les combinaisons possibles, dérivées — jamais recopiées. */
function toutesLesCombinaisons(): TransactionASupprimer[] {
  const out: TransactionASupprimer[] = [];
  for (const type of TYPES) {
    for (const statut of STATUTS) {
      for (const numero of NUMEROS) out.push({ type, statut, numero });
    }
  }
  return out;
}

describe('garde-fou : la règle sait dire oui ET non', () => {
  it('le balayage couvre bien tout le produit cartésien', () => {
    /**
     * Sans ce cas, une liste réduite à un seul type ou à un seul statut
     * laisserait les règles ci-dessous vertes sur la moitié du problème —
     * exactement ce qui s'est passé : le premier garde n'avait jamais été
     * éprouvé sur un ACHAT.
     */
    const combos = toutesLesCombinaisons();
    expect(combos, 'deux types × cinq statuts × deux numéros').toHaveLength(20);
    expect(new Set(combos.map((c) => c.type)).size).toBe(2);
    expect(new Set(combos.map((c) => c.statut)).size).toBe(5);
  });

  it('elle refuse au moins un cas, et en autorise au moins un', () => {
    /**
     * Une règle qui répondrait toujours `null` — ou toujours une phrase —
     * satisferait la moitié des exigences suivantes sans rien garder.
     */
    const verdicts = toutesLesCombinaisons().map(refusDeSuppression);
    expect(
      verdicts.filter((v) => v !== null).length,
      'aucun refus : la règle ne garde rien',
    ).toBeGreaterThan(0);
    expect(
      verdicts.filter((v) => v === null).length,
      'aucune autorisation : tout est bloqué',
    ).toBeGreaterThan(0);
  });
});

describe('la RÈGLE : un ACHAT se supprime toujours', () => {
  it('quels que soient son statut et son numéro', () => {
    const bloques = toutesLesCombinaisons()
      .filter((c) => c.type === 'achat')
      .filter((c) => refusDeSuppression(c) !== null)
      .map((c) => `achat ${c.statut} ${c.numero ?? 'sans numéro'}`);

    expect(
      bloques,
      'Un achat est le relevé que l’apiculteur tient de ses PROPRES dépenses. Rien n’a ' +
        'été envoyé à personne, aucune séquence opposable n’en dépend, et l’avoir n’a pas ' +
        'de sens. Se tromper de montant en saisissant un sac de sucre doit se corriger en ' +
        'supprimant la ligne.',
    ).toEqual([]);
  });

  it('le cas exact qui bloquait : un achat payé et numéroté', () => {
    /**
     * C'est la forme que `finances/achats.post.ts` écrit par défaut :
     * `statut: 'payee'` et un numéro `AC-AAAA-NNNN`. Autrement dit, TOUTES
     * les dépenses.
     */
    expect(
      refusDeSuppression({ type: 'achat', statut: 'payee', numero: 'AC-2026-0007' }),
    ).toBeNull();
  });
});

describe('la RÈGLE : une VENTE émise ne se supprime pas', () => {
  it('dès qu’elle porte un numéro, ou qu’elle a quitté le brouillon', () => {
    for (const c of toutesLesCombinaisons().filter((x) => x.type === 'vente')) {
      const emise = Boolean(c.numero) || c.statut !== 'brouillon';
      const refus = refusDeSuppression(c);
      expect(
        refus !== null,
        `vente ${c.statut} ${c.numero ?? 'sans numéro'} — ${emise ? 'émise, doit être refusée' : 'brouillon nu, doit passer'}`,
      ).toBe(emise);
    }
  });

  it('⚠️ LES DEUX CONDITIONS, pas une seule', () => {
    /**
     * Elles ne coïncident pas toujours, et aucune seule ne suffit : un
     * brouillon numéroté a existé (les deux conversions de bon de livraison
     * en fabriquaient), et une vente « envoyee » sans numéro serait tout aussi
     * anormale. On refuse dans les deux cas.
     */
    expect(
      refusDeSuppression({ type: 'vente', statut: 'brouillon', numero: 'FA-2026-0001' }),
    ).not.toBeNull();
    expect(refusDeSuppression({ type: 'vente', statut: 'envoyee', numero: null })).not.toBeNull();
    expect(refusDeSuppression({ type: 'vente', statut: 'brouillon', numero: null })).toBeNull();
  });
});

describe('le refus est une PHRASE, et il nomme la sortie', () => {
  it('pas de code, pas d’identifiant technique, et l’avoir est nommé', () => {
    const refus = refusDeSuppression({ type: 'vente', statut: 'envoyee', numero: 'FA-2026-0001' })!;
    expect(refus).toBeTruthy();
    expect(
      refus,
      'la sortie doit être nommée — un refus qui s’arrête au « non » est un mur',
    ).toMatch(/avoir/i);
    expect(refus, 'pas d’identifiant camelCase').not.toMatch(/[a-z][A-Z]/);
    expect(refus, 'pas de nom de colonne ni de code').not.toMatch(/numero:|statut:|40[0-9]/);
  });

  it('⚠️ et cette phrase n’est JAMAIS servie à un achat', () => {
    /**
     * C'est le cœur du défaut : le message parlait d'avoir à quelqu'un qui
     * venait de saisir un sac de sucre au mauvais prix.
     */
    for (const c of toutesLesCombinaisons().filter((x) => x.type === 'achat')) {
      expect(refusDeSuppression(c), `achat ${c.statut}`).toBeNull();
    }
  });
});
