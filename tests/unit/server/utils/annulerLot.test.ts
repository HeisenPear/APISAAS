import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * « J'AI DÉFAIT LES 20 ACTIONS » ÉTAIT UNE PROMESSE, PAS UNE MESURE.
 *
 * Le chiffre venait de `ressources.length` — le nombre de lignes JOURNALISÉES
 * au moment de l'exécution. Aucune des primitives d'annulation ne rendait quoi
 * que ce soit (`Promise<void>`), donc l'appelant n'avait rien à compter : il
 * annonçait ce qu'il avait prévu. Toute ligne déjà disparue, tout undo no-op,
 * toute action future non câblée était comptée comme défaite.
 *
 * La cause racine était le TYPE. Une sortie muette ne peut pas mentir — elle ne
 * dit rien — et c'est ce qui rendait possible le `case 'vente': return;` : un
 * no-op invisible au compilateur. `Promise<number>` ferme les deux portes.
 *
 * Deux gardes annexes se vérifient ici aussi : le contrôle de type était
 * AVEUGLE aux lignes déjà supprimées (elles ne remontent pas du SELECT, donc
 * elles sortaient du contrôle et repassaient pour annulables), et la phrase de
 * succès collait deux propositions.
 */

let lignesEnBase: { type: string | null }[] = [];
let lotEnBase: { id: string; statut: string; ressources: unknown; createdAt: Date } | null = null;
let supprimees: string[] = [];

const selectLot = {
  from: () => selectLot,
  where: () => selectLot,
  limit: () => Promise.resolve(lotEnBase ? [lotEnBase] : []),
  then: (r: (v: unknown) => unknown) => Promise.resolve(lignesEnBase).then(r),
};

function chaineDelete(quoi: string) {
  return {
    where: () => chaineDelete(quoi),
    returning: () => {
      // Une ligne « déjà disparue » ne rend rien : c'est le cas que le compte
      // devait savoir distinguer.
      const restantes = lignesEnBase.length;
      supprimees.push(quoi);
      return Promise.resolve(supprimees.length <= restantes ? [{ id: 'x' }] : []);
    },
  };
}

const tx = {
  delete: () => chaineDelete('intervention'),
  update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
  select: () => selectLot,
};

vi.mock('~~/server/utils/db', () => ({
  db: {
    select: () => selectLot,
    transaction: async (f: (t: unknown) => unknown) => f(tx),
  },
  resetDb: async () => {},
  dbWatchdog: <T>(p: Promise<T>) => p,
  withDbRetry: <T>(f: () => Promise<T>) => f(),
}));

beforeEach(() => {
  supprimees = [];
  lignesEnBase = [];
  lotEnBase = null;
  Object.assign(globalThis, {
    db: { select: () => selectLot, transaction: async (f: (t: unknown) => unknown) => f(tx) },
    dbWatchdog: <T>(p: Promise<T>) => p,
    resetDb: async () => {},
  });
});

async function annuler() {
  const { annulerPlan } = await import('~~/server/utils/copilote-executeur');
  return annulerPlan('u1', 'plan1');
}

/** Prépare un lot de N interventions du type donné, créé à l'instant. */
function lot(n: number, type: string | null) {
  lignesEnBase = Array.from({ length: n }, () => ({ type }));
  lotEnBase = {
    id: 'plan1',
    statut: 'execute',
    ressources: Array.from({ length: n }, (_, i) => ({ actionId: 'intervention', id: `i${i}` })),
    createdAt: new Date(),
  };
}

describe('annulerPlan — le nombre annoncé est mesuré, pas promis', () => {
  it('annonce le compte réel quand tout part', async () => {
    lot(3, 'controle');
    const r = await annuler();
    expect(r.ok).toBe(true);
    expect(r.texte).toContain('les 3 actions');
  });

  it('la phrase n’a pas deux propositions collées', async () => {
    lot(2, 'controle');
    const r = await annuler();
    expect(r.texte, 'sur un geste destructeur, un texte cassé inquiète').not.toContain(
      'annulé J’ai',
    );
    expect(r.texte).toContain('—');
  });

  it('refuse un lot dont une ligne a DÉJÀ disparu', async () => {
    /**
     * ⚠️ LE GARDE ÉTAIT AVEUGLE ICI. Une ligne supprimée à la main ne remonte
     * pas du SELECT : elle sortait donc du contrôle de type et repassait pour
     * annulable. Un lot de pesées (type NON annulable) dont les lignes avaient
     * disparu franchissait le garde, la boucle ne supprimait rien, et Maya
     * annonçait quand même « J'ai défait les 12 actions ». On traite le manque
     * comme un type inconnu — donc comme un refus.
     */
    lot(3, 'controle');
    lignesEnBase = [{ type: 'controle' }, { type: 'controle' }]; // une de moins
    const r = await annuler();
    expect(r.ok).toBe(false);
    expect(supprimees, 'aucune suppression ne doit partir').toEqual([]);
  });

  it('refuse un lot contenant un type à effets de bord', async () => {
    lot(2, 'varroa');
    const r = await annuler();
    expect(r.ok).toBe(false);
    expect(r.texte).toContain('varroa');
    expect(supprimees).toEqual([]);
  });

  it('refuse un lot de plus de 24 heures', async () => {
    lot(1, 'controle');
    lotEnBase!.createdAt = new Date(Date.now() - 25 * 3600_000);
    const r = await annuler();
    expect(r.ok).toBe(false);
    expect(r.texte).toContain('24 heures');
  });

  it('dit « déjà annulé » sans rien retoucher', async () => {
    lot(1, 'controle');
    lotEnBase!.statut = 'annule';
    const r = await annuler();
    expect(r.ok).toBe(true);
    expect(supprimees).toEqual([]);
  });
});
