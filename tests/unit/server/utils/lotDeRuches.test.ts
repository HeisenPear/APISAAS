import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * « J'AI INSTALLÉ 3 NOUVELLES RUCHES » — UN LOT, PAS UNE RUCHE.
 *
 * ⚠️ ET C'EST UNE QUESTION D'ANNULATION, PAS DE CONFORT. Le journal d'une
 * action isolée ne porte qu'UN identifiant : créer trois ruches par ce chemin
 * rendrait « Annuler » menteur sur deux d'entre elles. Le PLAN, lui, journalise
 * ses N ressources, les défait toutes, et COMPTE ce qu'il a vraiment défait —
 * c'est le mécanisme du lot d'interventions, emprunté tel quel.
 *
 * ⚠️ LES NUMÉROS SONT ATTRIBUÉS À LA CONSTRUCTION, PAS À L'EXÉCUTION. C'est la
 * leçon du cron des achats récurrents : un lot qui calcule son numéro pendant
 * l'exécution donne le même à tout le monde. Ce n'était pas une course rare
 * là-bas, c'était déterministe.
 */

const feint = vi.hoisted(() => {
  const etat: { lignes: Record<string, unknown[]> } = { lignes: {} };
  const nom = (tb: unknown): string =>
    String((tb as Record<symbol, unknown>)?.[Symbol.for('drizzle:Name')] ?? '');
  const db = {
    select() {
      let table = '';
      const m = {
        from(tb: unknown) {
          table = nom(tb);
          return m;
        },
        where: () => m,
        innerJoin: () => m,
        orderBy: () => m,
        limit: () => m,
        then: (res: (v: unknown[]) => unknown) =>
          Promise.resolve(etat.lignes[table] ?? []).then(res),
      };
      return m;
    },
  };
  return { etat, db };
});
vi.mock('~~/server/utils/db', () => ({ db: feint.db }));
/**
 * `resetDb` et `dbWatchdog` sont des auto-imports Nitro que Vitest ne pose pas.
 * Sans eux, `repondreConversation` part dans sa branche de secours et rend
 * « Je rencontre un souci technique » — un banc vert sur la mauvaise réponse.
 */
Object.assign(globalThis, {
  db: feint.db,
  resetDb: async () => {},
  dbWatchdog: <T>(p: Promise<T>) => p,
});

const { preparerRuchesEnLot } = await import('~~/server/utils/copilote-actions');
const { repondreConversation } = await import('~~/server/utils/copilote-local');
const { MAX_ETAPES_PLAN } = await import('~~/server/utils/copilote-plan');

const UN_RUCHER = [{ id: 'ru1', nom: 'Les Tilleuls' }];

beforeEach(() => {
  feint.etat.lignes = {};
});

const repondre = (phrase: string) =>
  repondreConversation('u1', [{ role: 'user' as const, content: phrase }], 'pro');

describe('trois ruches d’un coup passent par un PLAN', () => {
  it('garde-fou — une ruche SEULE ne fait pas de plan', () => {
    // Si tout passait en plan, les cas suivants seraient vrais sans rien
    // prouver de l'aiguillage.
    feint.etat.lignes = { ruchers: UN_RUCHER, ruches: [] };
    return repondre('ajoute une ruche').then((r) => {
      expect(r.confirmationPlan, 'une ruche seule a fabriqué un plan').toBeUndefined();
      expect(r.confirmation?.actionId).toBe('ruche');
    });
  });

  it('trois ruches donnent trois étapes, numérotées à la SUITE', async () => {
    feint.etat.lignes = {
      ruchers: UN_RUCHER,
      ruches: [
        { numero: '1', type: 'warre' },
        { numero: '2', type: 'warre' },
      ],
    };
    const r = await repondre("j'ai installe 3 nouvelles ruches");
    expect(r.confirmationPlan, 'le lot ne produit pas de plan').toBeTruthy();
    const plan = r.confirmationPlan!.plan;
    expect(plan.etapes.length, 'le lot a perdu des ruches en route').toBe(3);
    /**
     * ⚠️ TROIS NUMÉROS DISTINCTS, ET QUI SUIVENT LA SUITE EXISTANTE. Un lot qui
     * calcule son numéro pendant l'exécution rend trois fois le même : c'est le
     * défaut DÉTERMINISTE qu'a déjà produit le cron des achats récurrents.
     */
    const numeros = plan.etapes.map((e) => (e.params as { numero: string }).numero);
    expect(numeros, 'les numéros ne suivent plus la suite de l’apiculteur').toEqual([
      '3',
      '4',
      '5',
    ]);
    expect(new Set(numeros).size, 'deux ruches portent le même numéro').toBe(3);
    // Toutes au même rucher, et du modèle que l'apiculteur utilise déjà.
    for (const e of plan.etapes) {
      expect(e.actionId).toBe('ruche');
      expect(e.domaine, 'le cheptel est du TERRAIN').toBe('terrain');
      expect(e.params).toMatchObject({ rucherId: 'ru1', type: 'warre' });
    }
  });

  it('le titre du plan dit ce qui va être créé', async () => {
    feint.etat.lignes = { ruchers: UN_RUCHER, ruches: [] };
    const r = await repondre("j'ai installe 4 nouvelles ruches");
    expect(r.confirmationPlan!.plan.titre).toContain('Les Tilleuls');
    expect(r.confirmationPlan!.plan.titre).toContain('4');
  });

  it('un lot ÉCRASANT se refuse, avec une issue', async () => {
    /**
     * Au-delà du plafond d'étapes, Maya proposerait un plan que la
     * confirmation refuserait ensuite — « proposer puis se dédire est la pire
     * des expériences », dit déjà `MAX_ETAPES_PLAN`. On annonce le périmètre.
     */
    feint.etat.lignes = { ruchers: UN_RUCHER, ruches: [] };
    const trop = MAX_ETAPES_PLAN + 100;
    const r = await repondre(`j'ai installe ${trop} nouvelles ruches`);
    expect(r.confirmationPlan, 'un lot hors plafond a quand même produit un plan').toBeUndefined();
    expect(r.texte).toContain(String(MAX_ETAPES_PLAN));
    expect(r.navigation, 'un refus sans issue est un mur').toBeTruthy();
  });

  it('les questions du cas UNITAIRE valent aussi pour le lot', async () => {
    /**
     * ⚠️ LE LOT NE REPOSE PAS SES PROPRES QUESTIONS — il partage
     * `contexteNouvelleRuche` avec l'aperçu d'une ruche seule. Deux copies de
     * « y a-t-il un rucher, lequel, quels numéros sont pris, quel modèle »
     * auraient fini par diverger, et la divergence ici, c'est une ruche posée
     * dans le mauvais rucher.
     */
    feint.etat.lignes = { ruchers: [] };
    const sansRucher = await preparerRuchesEnLot('u1', { combien: 3, manque: [] });
    expect('refus' in sansRucher, 'un lot s’est créé sans rucher').toBe(true);

    feint.etat.lignes = {
      ruchers: [
        { id: 'ru1', nom: 'Les Tilleuls' },
        { id: 'ru2', nom: 'Le Verger' },
      ],
    };
    const ambigu = await preparerRuchesEnLot('u1', { combien: 3, manque: [] });
    expect('refus' in ambigu, 'le lot a choisi un rucher tout seul').toBe(true);
    if (!('refus' in ambigu)) return;
    expect(ambigu.refus.ok).toBe(false);
    if (ambigu.refus.ok) return;
    expect(ambigu.refus.suggestions).toEqual(['Les Tilleuls', 'Le Verger']);
  });

  it('les numéros déjà pris sont ENJAMBÉS, pas réutilisés', async () => {
    feint.etat.lignes = {
      ruchers: UN_RUCHER,
      ruches: [
        { numero: '1', type: 'dadant_10' },
        { numero: '7', type: 'dadant_10' },
      ],
    };
    const lot = await preparerRuchesEnLot('u1', { combien: 2, manque: [] });
    expect('etapes' in lot).toBe(true);
    if (!('etapes' in lot)) return;
    // La suite repart APRÈS le plus grand — 8 puis 9 — et surtout pas 2 et 3,
    // qui laisseraient un trou avant un numéro déjà utilisé.
    expect(lot.etapes.map((e) => (e.params as { numero: string }).numero)).toEqual(['8', '9']);
  });
});
