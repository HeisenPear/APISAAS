import { describe, it, expect, vi, beforeEach } from 'vitest';

// ═══════════════════════════════════════════════════════════════════════════
// UN LOT EST HÉTÉROGÈNE — et c'est pour ça que la répercussion s'y perd.
//
// ⚠️ CE FICHIER NAÎT DE TROIS MUTATIONS QUI ONT SURVÉCU.
//
// Le commentaire du banc de la route affirmait : « l'exécuteur DÉRIVE l'union
// des invalidations de ses étapes, son propre banc le mesure ». Ce banc
// n'existait pas. Trois mutations l'ont prouvé, en restant vertes :
//   · supprimer l'accumulation des événements du lot ;
//   · rendre l'annulation en cascade muette ;
//   · lui faire annoncer des CRÉATIONS au lieu de suppressions.
//
// Le défaut gardé est concret : la séquence « crée le rucher des Tilleuls, et
// mets-y trois ruches » touche DEUX domaines. N'en répercuter qu'un laisse
// l'autre écran figé — et si c'est la jauge de plan qui reste figée, le refus
// de plafond suivant contredira ce que l'apiculteur a sous les yeux.
// ═══════════════════════════════════════════════════════════════════════════

/** Ce que chaque primitive d'insertion rendra, par action. */
const feint = vi.hoisted(() => ({
  reponses: {} as Record<string, { ok: boolean; evenements?: string[] }>,
  ressourcesDuLot: [] as { actionId: string; id: string }[],
  defaites: 0,
}));

/**
 * Le double des primitives d'écriture. On y met `evenements` pour DEUX
 * actions seulement : le troisième cas mesure que le PLANCHER du catalogue
 * prend le relais quand rien n'a été mesuré.
 */
function insertion(actionId: string) {
  return async () => {
    const r = feint.reponses[actionId] ?? { ok: true };
    return {
      ok: r.ok,
      texte: 'ok',
      cree: r.ok ? { actionId, id: `${actionId}-1` } : undefined,
      evenements: r.evenements,
    };
  };
}

vi.mock('~~/server/utils/copilote-actions', () => ({
  insererInterventionTx: insertion('intervention'),
  insererClientTx: insertion('client'),
  insererRecolteTx: insertion('recolte'),
  insererStockTx: insertion('stock'),
  insererVenteTx: insertion('vente'),
  insererAchatTx: insertion('achat'),
  insererRucherTx: insertion('rucher'),
  insererRucheTx: insertion('ruche'),
  insererMortaliteTx: insertion('mortalite'),
  annulerActionIntervention: async () => (feint.defaites += 1),
  annulerClientTx: async () => (feint.defaites += 1),
  annulerVenteTx: async () => (feint.defaites += 1),
  annulerAchatTx: async () => (feint.defaites += 1),
  annulerRucherTx: async () => (feint.defaites += 1),
  annulerRucheTx: async () => (feint.defaites += 1),
  annulerMortaliteTx: async () => (feint.defaites += 1),
  annulerRecolteTx: async () => (feint.defaites += 1),
  annulerStockTx: async () => (feint.defaites += 1),
}));

/** Le lot journalisé que `annulerPlan` relira. */
let lotEnBase: { id: string; statut: string; ressources: unknown; createdAt: Date } | null = null;

const lecture = {
  from: () => lecture,
  where: () => lecture,
  limit: () => Promise.resolve(lotEnBase ? [lotEnBase] : []),
  // Le second SELECT (les types d'intervention) : aucune ligne d'intervention
  // dans nos lots de test, donc jamais atteint — mais il doit exister.
  then: (r: (v: unknown) => unknown) => Promise.resolve([]).then(r),
};

const tx = {
  insert: () => ({ values: () => ({ returning: async () => [{ id: 'plan-1' }] }) }),
  update: () => ({ set: () => ({ where: async () => {} }) }),
  delete: () => ({ where: () => ({ returning: async () => [{ id: 'x' }] }) }),
  select: () => lecture,
};

const faussedb = {
  select: () => lecture,
  transaction: async (f: (t: unknown) => unknown) => f(tx),
};

vi.mock('~~/server/utils/db', () => ({
  db: faussedb,
  resetDb: async () => {},
  dbWatchdog: <T>(p: Promise<T>) => p,
  withDbRetry: <T>(f: () => Promise<T>) => f(),
}));

beforeEach(() => {
  feint.reponses = {};
  feint.defaites = 0;
  lotEnBase = null;
  Object.assign(globalThis, {
    db: faussedb,
    resetDb: async () => {},
    dbWatchdog: <T>(p: Promise<T>) => p,
  });
});

const { executerPlan, annulerPlan } = await import('~~/server/utils/copilote-executeur');
const { MAYA_ACTIONS } = await import('~~/app/config/maya-actions');

/** Un plan dont chaque étape porte l'action donnée. */
function plan(actions: string[]) {
  return {
    type: 'sequence' as const,
    titre: 'Installation du printemps',
    resume: [],
    etapes: actions.map((actionId, i) => ({
      id: `e${i}`,
      actionId,
      domaine: MAYA_ACTIONS[actionId as 'ruche'].domaine,
      libelle: `Étape ${i}`,
      params: {},
    })),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. Le garde-fou
// ═══════════════════════════════════════════════════════════════════════════

describe('garde-fou : le harnais exécute vraiment un lot', () => {
  it('un plan à deux étapes réussit et journalise', async () => {
    // Sans ce cas, un exécuteur qui échouerait systématiquement rendrait tous
    // les cas suivants vacuement verts : « aucun événement, rien à comparer ».
    const r = await executerPlan('u1', plan(['rucher', 'ruche']) as never, 'pro');
    expect(r.ok, 'le lot doit passer, sinon rien n’est mesuré').toBe(true);
    expect(r.nbReussies).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. L'union, pas la première étape
// ═══════════════════════════════════════════════════════════════════════════

describe('executerPlan additionne les invalidations de ses étapes', () => {
  it('un lot à deux domaines invalide LES DEUX', async () => {
    const r = await executerPlan('u1', plan(['rucher', 'ruche']) as never, 'pro');
    // Le rucher naît, la ruche naît, et le rucher change de compte.
    expect(r.evenements).toContain('rucher:created');
    expect(r.evenements).toContain('ruche:created');
  });

  it('préfère ce que l’étape a MESURÉ à son plancher', async () => {
    // Une étape `intervention` de catégorie `division` crée une RUCHE. Son
    // plancher ne le sait pas ; son gestionnaire, si.
    feint.reponses.intervention = {
      ok: true,
      evenements: ['intervention:created', 'ruche:created'],
    };
    const r = await executerPlan('u1', plan(['intervention']) as never, 'pro');
    expect(
      r.evenements,
      'la ruche née d’une division doit apparaître, sinon elle reste invisible ' +
        'partout — y compris de la jauge de plan qu’elle vient de consommer',
    ).toContain('ruche:created');
  });

  it('ne perd AUCUNE étape, même identiques (dédoublonne sans tronquer)', async () => {
    const r = await executerPlan('u1', plan(['ruche', 'ruche', 'client']) as never, 'pro');
    expect(r.nbReussies).toBe(3);
    expect([...r.evenements].sort()).toEqual(['client:created', 'ruche:created', 'rucher:updated']);
  });

  it('un lot en ÉCHEC n’invalide rien', async () => {
    // Rollback : rien n'a été écrit. Émettre ferait recharger des listes pour
    // une transaction qui n'a jamais eu lieu.
    feint.reponses.client = { ok: false };
    const r = await executerPlan('u1', plan(['ruche', 'client']) as never, 'pro');
    expect(r.ok).toBe(false);
    expect(r.evenements).toEqual([]);
  });

  it('un plan VIDE n’invalide rien', async () => {
    const r = await executerPlan('u1', { ...plan([]), etapes: [] } as never, 'pro');
    expect(r.evenements).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. « Tout annuler » se répercute aussi
// ═══════════════════════════════════════════════════════════════════════════

/** Prépare un lot journalisé, créé à l'instant (donc dans la fenêtre d'undo). */
function journal(actions: string[]) {
  lotEnBase = {
    id: 'plan-1',
    statut: 'execute',
    ressources: actions.map((actionId, i) => ({ actionId, id: `${actionId}-${i}` })),
    createdAt: new Date(),
  };
}

describe('annulerPlan invalide le CONTRAIRE de ce qu’il a créé', () => {
  it('un lot de ruches annulé parle de SUPPRESSION', async () => {
    journal(['ruche', 'ruche']);
    const r = await annulerPlan('u1', 'plan-1');
    expect(r.ok).toBe(true);
    expect(
      r.evenements,
      'un écran qui garde une ligne supprimée après « c’est annulé » est pire ' +
        'que l’inaction : l’apiculteur ne sait plus laquelle des deux croire',
    ).toContain('ruche:deleted');
    expect(r.evenements).not.toContain('ruche:created');
  });

  it('couvre TOUS les domaines du lot, pas seulement le premier', async () => {
    journal(['rucher', 'client']);
    const r = await annulerPlan('u1', 'plan-1');
    expect([...r.evenements].sort()).toEqual(['client:deleted', 'rucher:deleted']);
  });

  it('un lot DÉJÀ annulé n’invalide rien', async () => {
    // Rien n'a bougé en base à cet instant : faire recharger ferait croire
    // qu'une action vient d'avoir lieu.
    journal(['ruche']);
    lotEnBase!.statut = 'annule';
    const r = await annulerPlan('u1', 'plan-1');
    expect(r.ok).toBe(true);
    expect(r.evenements).toEqual([]);
  });

  it('un lot INTROUVABLE n’invalide rien', async () => {
    lotEnBase = null;
    const r = await annulerPlan('u1', 'plan-1');
    expect(r.ok).toBe(false);
    expect(r.evenements).toEqual([]);
  });

  it('un lot HORS FENÊTRE n’invalide rien — il n’a rien défait', async () => {
    journal(['ruche']);
    lotEnBase!.createdAt = new Date(Date.now() - 72 * 3600 * 1000);
    const r = await annulerPlan('u1', 'plan-1');
    expect(r.ok).toBe(false);
    expect(r.evenements).toEqual([]);
  });
});
