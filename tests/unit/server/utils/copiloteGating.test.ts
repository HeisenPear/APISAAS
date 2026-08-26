// Maya écrit dans les mêmes tables que les routes directes. Ce banc vérifie
// qu'elle en subit les mêmes portes — dans les DEUX sens : ce que le plan
// inclut doit passer, ce qu'il exclut doit être refusé.
//
// La règle est lue dans ROUTE_GATES, jamais redéclarée : les cas ci-dessous
// s'appuient donc sur le catalogue réel, pas sur une copie qui dériverait.

import { describe, expect, it } from 'vitest';
import { refusDePlan } from '~~/server/utils/copilote-gating';
import type { DrizzleTransaction } from '~~/server/types/interventions';

/**
 * Exécuteur minimal : `select().from().where()` est *thenable* et rend le
 * compte demandé. Suffisant ici — le but est de tester la DÉCISION, pas le SQL.
 */
function execAvec(compte: number): DrizzleTransaction {
  const resultat = [{ count: compte }];
  const maillon: Record<string, unknown> = {};
  for (const m of ['select', 'from', 'where', 'limit']) maillon[m] = () => maillon;
  maillon.then = (resoudre: (v: unknown) => unknown) => Promise.resolve(resultat).then(resoudre);
  return maillon as unknown as DrizzleTransaction;
}

const AUCUN_ACCES = execAvec(0);

describe('refusDePlan — ce que le plan INCLUT doit passer', () => {
  it('laisse un Pro créer un client (feature et limite couvertes)', async () => {
    expect(await refusDePlan(execAvec(9999), 'u1', 'client', 'pro')).toBeNull();
  });

  it('laisse un Starter créer un client sous son plafond', async () => {
    expect(await refusDePlan(execAvec(19), 'u1', 'client', 'starter')).toBeNull();
  });

  it('laisse un Starter enregistrer une récolte (production incluse dès Starter)', async () => {
    expect(await refusDePlan(AUCUN_ACCES, 'u1', 'recolte', 'starter')).toBeNull();
  });

  it('laisse un Starter enregistrer un mouvement de stock', async () => {
    expect(await refusDePlan(AUCUN_ACCES, 'u1', 'stock', 'starter')).toBeNull();
  });

  it('ne consulte même pas la base quand le plan est illimité', async () => {
    // Un exécuteur qui explose : si la fonction l'interroge, le test casse.
    const interdit = new Proxy({} as DrizzleTransaction, {
      get() {
        throw new Error('aucune requête ne doit partir sur un plan illimité');
      },
    });
    expect(await refusDePlan(interdit, 'u1', 'client', 'expert')).toBeNull();
  });
});

describe('refusDePlan — ce que le plan EXCLUT doit être refusé', () => {
  it('refuse la création de client à Découverte (feature absente)', async () => {
    const refus = await refusDePlan(AUCUN_ACCES, 'u1', 'client', 'decouverte');
    expect(refus).toBeTruthy();
    expect(refus).toContain('Starter');
  });

  it('refuse une récolte à Découverte (feature production absente)', async () => {
    expect(await refusDePlan(AUCUN_ACCES, 'u1', 'recolte', 'decouverte')).toBeTruthy();
  });

  it('refuse un mouvement de stock à Découverte', async () => {
    expect(await refusDePlan(AUCUN_ACCES, 'u1', 'stock', 'decouverte')).toBeTruthy();
  });

  it('refuse le 21ᵉ client à un Starter (plafond de 20 atteint)', async () => {
    const refus = await refusDePlan(execAvec(20), 'u1', 'client', 'starter');
    expect(refus).toBeTruthy();
    expect(refus).toContain('20');
  });
});

describe('refusDePlan — le plafond de FACTURES, celui qui ne s’appliquait pas', () => {
  /**
   * ⚠️ CES QUATRE CAS SONT LA RÉGRESSION D'UN TROU SILENCIEUX, ET AUCUN
   * N'EXISTAIT. Le compteur de `copilote-gating` ne savait compter QUE les
   * clients :
   *
   *     if (limite !== 'clients') return null;
   *     ...
   *     if (actuel === null || actuel < max) return null;   // null = ça passe
   *
   * Or `ROUTE_EQUIVALENTE` déclare `vente`, et sa route porte
   * `limit: 'facturesParMois'` — 0 sur Découverte, 10 sur Starter. Le jour où
   * la vente cesse d'être un squelette, un Starter aurait facturé sans plafond,
   * et la page tarifs serait restée exacte pendant que le produit la démentait.
   *
   * Le banc d'origine testait `client`, `recolte` et `stock`. Il ne testait pas
   * `vente` — la seule action dont le plafond était cassé. Une couverture qui
   * s'arrête juste avant le défaut est le pire des faux verts.
   */
  it('refuse la 11ᵉ facture du mois à un Starter (plafond de 10)', async () => {
    const refus = await refusDePlan(execAvec(10), 'u1', 'vente', 'starter');
    expect(refus, 'le plafond de factures ne s’appliquait pas du tout').toBeTruthy();
    expect(refus).toContain('10');
  });

  it('laisse passer la 10ᵉ facture du mois d’un Starter', async () => {
    expect(await refusDePlan(execAvec(9), 'u1', 'vente', 'starter')).toBeNull();
  });

  it('refuse toute facture à Découverte (facturation absente du plan)', async () => {
    const refus = await refusDePlan(AUCUN_ACCES, 'u1', 'vente', 'decouverte');
    expect(refus).toBeTruthy();
    expect(refus).toMatch(/Starter|Pro|Expert/);
  });

  it('ne consulte pas la base pour un Pro (facturation illimitée)', async () => {
    const interdit = new Proxy({} as DrizzleTransaction, {
      get() {
        throw new Error('aucune requête ne doit partir sur un plan illimité');
      },
    });
    expect(await refusDePlan(interdit, 'u1', 'vente', 'pro')).toBeNull();
  });
});

describe('refusDePlan — la porte de sortie', () => {
  it('nomme toujours la formule qui débloque', async () => {
    for (const action of ['client', 'recolte', 'stock', 'vente'] as const) {
      const refus = await refusDePlan(AUCUN_ACCES, 'u1', action, 'decouverte');
      expect(refus, action).toMatch(/Starter|Pro|Expert/);
    }
  });

  it('indique où changer de formule, jamais un mur sec', async () => {
    const refus = await refusDePlan(AUCUN_ACCES, 'u1', 'client', 'decouverte');
    expect(refus).toContain('Abonnement');
  });

  it('rassure sur les données plutôt que de suggérer d’en supprimer', async () => {
    const refus = await refusDePlan(execAvec(20), 'u1', 'client', 'starter');
    expect(refus).toContain('intactes');
    expect(refus).not.toMatch(/supprim/i);
  });
});
