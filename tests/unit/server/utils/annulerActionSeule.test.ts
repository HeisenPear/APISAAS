import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * L'ANNULATION D'UNE ACTION SEULE, OBSERVÉE — PAS DEVINÉE.
 *
 * ⚠️ CE FICHIER EXISTE PARCE QU'UNE MUTATION A DÉMASQUÉ MON PROPRE BANC.
 * `annulationRegle.test.ts` vérifiait que `copilote-actions.ts` « contient
 * annulationAutorisee ». En retirant les DEUX LIGNES qui appellent vraiment la
 * règle dans `annulerActionIntervention`, le banc restait VERT : la chaîne
 * survivait dans la ligne d'`import`. Il gardait un mot, pas un comportement.
 *
 * C'est exactement la faiblesse qui avait laissé passer le défaut d'origine —
 * on croyait la garde posée parce qu'on lisait son nom quelque part. On regarde
 * donc ce que la fonction FAIT : est-ce qu'un DELETE part, oui ou non.
 */

let ligneEnBase: { type: string | null; creeLe: Date } | null = null;
let deleteAppele = false;

const chaineSelect = {
  select: () => chaineSelect,
  from: () => chaineSelect,
  where: () => chaineSelect,
  limit: () => Promise.resolve(ligneEnBase ? [ligneEnBase] : []),
};

const chaineDelete = {
  where: () => chaineDelete,
  returning: () => {
    deleteAppele = true;
    return Promise.resolve([{ id: 'i1' }]);
  },
};

vi.mock('~~/server/utils/db', () => ({
  db: {
    select: () => chaineSelect,
    delete: () => chaineDelete,
    transaction: async (f: (tx: unknown) => unknown) => f({}),
  },
  resetDb: async () => {},
  dbWatchdog: <T>(p: Promise<T>) => p,
  withDbRetry: <T>(f: () => Promise<T>) => f(),
}));

beforeEach(() => {
  deleteAppele = false;
  ligneEnBase = null;
  Object.assign(globalThis, {
    db: { select: () => chaineSelect, delete: () => chaineDelete },
    dbWatchdog: <T>(p: Promise<T>) => p,
    resetDb: async () => {},
  });
});

async function annuler() {
  const { annulerActionIntervention } = await import('~~/server/utils/copilote-actions');
  return annulerActionIntervention('u1', 'i1');
}

describe('annulerActionIntervention — le seul chemin qui écrit en autonomie', () => {
  it('supprime un contrôle récent', async () => {
    ligneEnBase = { type: 'controle', creeLe: new Date() };
    const r = await annuler();
    expect(r.ok).toBe(true);
    expect(deleteAppele, 'la suppression doit bien partir').toBe(true);
  });

  it('NE SUPPRIME PAS un varroa — et le dit', async () => {
    /**
     * Le cas exact signalé : « ruche 3, 12 varroas » écrivait tout seul, et
     * « Annuler » retirait le hub en laissant le `comptages_varroa` détaché et
     * l'alerte levée. On vérifie que plus AUCUN DELETE ne part.
     */
    ligneEnBase = { type: 'varroa', creeLe: new Date() };
    const r = await annuler();
    expect(r.ok).toBe(false);
    expect(deleteAppele, 'aucune suppression ne doit partir sur un type à effets').toBe(false);
    expect(r.texte).toContain('varroa');
  });

  it('NE SUPPRIME PAS au-delà de 24 heures', async () => {
    ligneEnBase = { type: 'controle', creeLe: new Date(Date.now() - 25 * 3600_000) };
    const r = await annuler();
    expect(r.ok).toBe(false);
    expect(deleteAppele).toBe(false);
    expect(r.texte).toContain('24 heures');
  });

  it('NE SUPPRIME PAS une ligne sans type', async () => {
    // La colonne est nullable : inconnu se traite comme irréversible.
    ligneEnBase = { type: null, creeLe: new Date() };
    const r = await annuler();
    expect(r.ok).toBe(false);
    expect(deleteAppele).toBe(false);
  });

  it('le dit franchement quand la ligne a déjà disparu', async () => {
    ligneEnBase = null;
    const r = await annuler();
    expect(r.ok).toBe(false);
    expect(deleteAppele).toBe(false);
    expect(r.texte).toMatch(/pas retrouvé/i);
  });

  it('LIT avant de supprimer — jamais l’inverse', async () => {
    // Un DELETE puis un contrôle serait un contrôle qui arrive trop tard. On
    // s'en assure en refusant : si l'ordre était inversé, `deleteAppele`
    // passerait à true malgré le refus.
    ligneEnBase = { type: 'recolte', creeLe: new Date() };
    await annuler();
    expect(deleteAppele).toBe(false);
  });
});
