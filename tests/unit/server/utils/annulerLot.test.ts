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

/**
 * Domaines dont la ligne a DÉJÀ disparu : leur suppression ne rend rien.
 * C'est exactement le cas que le compte devait savoir distinguer, et qu'il
 * comptait quand même comme défait.
 */
let deja: Set<string> = new Set();

function chaineDelete(quoi: string) {
  return {
    where: () => chaineDelete(quoi),
    returning: () => {
      supprimees.push(quoi);
      return Promise.resolve(deja.has(quoi) ? [] : [{ id: 'x' }]);
    },
  };
}

/** Quel domaine le prochain `delete` vise — posé par la ressource en cours. */
let domaineCourant = 'intervention';

/**
 * ⚠️ LE DOUBLE DOIT DISTINGUER LES REQUÊTES. `annulerPlan` demande maintenant
 * à la base si une ruche du lot porte déjà une visite (ou un rucher une ruche)
 * — le refus EN BLOC qui empêche « c'est annulé » de mentir. Un `select` qui
 * rend toujours le lot faisait croire que OUI, et tout était refusé. On
 * aiguille sur la PROJECTION : celle du lot porte `statut`.
 */
let occupation: { id: string }[] = [];

const selectOccupation = {
  from: () => selectOccupation,
  where: () => selectOccupation,
  limit: () => Promise.resolve(occupation),
  then: (r: (v: unknown) => unknown) => Promise.resolve(occupation).then(r),
};

/**
 * TROIS requêtes distinctes, trois réponses. Les confondre est ce qui a fait
 * tomber six cas d'un coup : le relevé des TYPES d'intervention (`type`) et le
 * contrôle d'occupation (`id` seul) ne rendent pas la même chose.
 */
function aiguiller(p?: Record<string, unknown>) {
  if (p && 'statut' in p) return selectLot;
  if (p && 'type' in p) return selectLot;
  return selectOccupation;
}

/**
 * Les statuts que le lot a réellement posés. ⚠️ MESURÉ, PAS SUPPOSÉ : le
 * statut passait à `annule` même sur un refus, et l'apiculteur perdait
 * définitivement son bouton « Tout annuler ».
 */
let statutsPoses: string[] = [];

const tx = {
  delete: () => chaineDelete(domaineCourant),
  update: () => ({
    set: (v: { statut?: string }) => {
      if (v.statut) statutsPoses.push(v.statut);
      return { where: () => Promise.resolve() };
    },
  }),
  select: (p?: Record<string, unknown>) => aiguiller(p),
};

vi.mock('~~/server/utils/db', () => ({
  db: {
    select: (p?: Record<string, unknown>) => aiguiller(p),
    transaction: async (f: (t: unknown) => unknown) => f(tx),
  },
  resetDb: async () => {},
  dbWatchdog: <T>(p: Promise<T>) => p,
  withDbRetry: <T>(f: () => Promise<T>) => f(),
}));

beforeEach(() => {
  supprimees = [];
  occupation = [];
  statutsPoses = [];
  deja = new Set();
  domaineCourant = 'intervention';
  lignesEnBase = [];
  lotEnBase = null;
  Object.assign(globalThis, {
    db: { select: () => selectLot, transaction: async (f: (t: unknown) => unknown) => f(tx) },
    dbWatchdog: <T>(p: Promise<T>) => p,
    resetDb: async () => {},
  });
});

async function annuler(refusePour?: (actionId: string) => string | null) {
  const { annulerPlan } = await import('~~/server/utils/copilote-executeur');
  return annulerPlan('u1', 'plan1', refusePour as never);
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

// =========================================================================
// LE RÔLE SE JUGE SUR CE QUI VA VRAIMENT PARTIR
//
// ⚠️ LA ROUTE JUGEAIT SUR UN LITTÉRAL. `undoPlan` contrôlait le domaine de
// `'intervention'` alors que ce lot défait toutes les ressources journalisées —
// clients, ventes, achats compris. Un COMPTABLE ne pouvait pas défaire le lot
// de clients qu'il venait d'écrire ; un TECHNICIEN, lui, passait et faisait
// supprimer clients et ventes.
//
// Le rappel est donc appliqué ICI, où les ressources sont lues, et AVANT toute
// suppression. Le banc de la route ne peut pas le voir : il double ce module.
// =========================================================================

// ════════════════════════════════════════════════════════════════════════════
// UN REFUS N'EST PAS UNE ABSENCE
//
// ⚠️ LE LOT LES CONFONDAIT, ET C'ÉTAIT UN « c'est annulé » QUI MENT.
//
// `annulerRucheTx` et `annulerRucherTx` rendent `0` par REFUS DÉLIBÉRÉ : une
// ruche qui porte déjà une visite n'est plus ce que Maya vient d'écrire, c'est
// le travail de l'apiculteur ; un rucher qui porte déjà une ruche emporterait
// tout son contenu (clé étrangère en cascade).
//
// `annulerPlan` lisait ce zéro comme « la ligne avait déjà disparu ». Trois
// ruches créées en lot, un contrôle dicté sur la cinquième, puis « Tout
// annuler » : les ruches 6 et 7 partaient, la 5 était refusée en silence, et
// Maya répondait « C'est annulé — j'ai défait les 2 actions du lot. Une ligne
// avait déjà disparu de leur côté. » La ruche 5 était toujours là, sur la carte
// et dans la jauge de plan. Et le lot était marqué annulé quand même : le
// bouton ne remarchait plus.
//
// Le contrôle EN BLOC existait — il n'inspectait que les interventions.
// ════════════════════════════════════════════════════════════════════════════

/** Un lot de N ruches créées à l'instant. */
function lotDeRuches(n: number) {
  lignesEnBase = [];
  lotEnBase = {
    id: 'plan1',
    statut: 'execute',
    ressources: Array.from({ length: n }, (_, i) => ({ actionId: 'ruche', id: `r${i}` })),
    createdAt: new Date(),
  };
}

describe('un lot de ruches déjà renseignées se refuse EN BLOC', () => {
  it('garde-fou : sans occupation, le lot de ruches part normalement', async () => {
    // Sans ce cas, un refus systématique satisferait les suivants tout en
    // rendant « Tout annuler » définitivement inopérant sur les ruches.
    lotDeRuches(3);
    domaineCourant = 'ruche';
    const res = await annuler();
    expect(res.ok).toBe(true);
    expect(supprimees.length, 'les trois ruches doivent partir').toBe(3);
  });

  it('une seule ruche déjà visitée ARRÊTE tout le lot', async () => {
    lotDeRuches(3);
    domaineCourant = 'ruche';
    occupation = [{ id: 'r0' }];
    const res = await annuler();

    expect(res.ok, 'un lot ne se défait qu’ENTIÈREMENT').toBe(false);
    expect(
      supprimees,
      'défaire deux ruches sur trois laisse le cheptel dans un état que personne n’a demandé',
    ).toEqual([]);
  });

  it('et le refus ne parle JAMAIS de lignes « déjà disparues »', async () => {
    /**
     * ⚠️ LE MENSONGE EXACT. La ruche est toujours là, sur la carte et dans la
     * jauge de plan — lui dire qu’elle a disparu est pire que de ne rien dire.
     */
    lotDeRuches(2);
    domaineCourant = 'ruche';
    occupation = [{ id: 'r0' }];
    const res = await annuler();

    expect(res.texte).not.toMatch(/déjà disparu|plus rien à défaire/i);
    expect(res.texte, 'un refus nomme ce qu’il faut faire à la place').toMatch(/ouvre la fiche/i);
  });

  it('le lot refusé n’est PAS marqué annulé — le bouton doit remarcher', async () => {
    /**
     * Le statut passait à `annule` dans tous les cas : après un refus,
     * l’apiculteur n’avait plus aucun moyen de défaire son lot.
     */
    lotDeRuches(2);
    domaineCourant = 'ruche';
    occupation = [{ id: 'r0' }];
    await annuler();
    expect(statutsPoses, 'rien ne doit être marqué annulé').toEqual([]);
  });

  it('un lot d’interventions, lui, n’est pas concerné par cette garde', async () => {
    // Le contre-test du périmètre : sans lui, une garde qui refuserait TOUT
    // satisferait les cas précédents en cassant l’annulation ordinaire.
    lot(2, 'controle');
    occupation = [{ id: 'peu-importe' }];
    const res = await annuler();
    expect(res.ok, 'aucune ruche dans ce lot : la garde ne s’applique pas').toBe(true);
  });
});

describe('annulerPlan — le rôle est jugé sur les ressources journalisées', () => {
  it('garde-fou : sans rappel de refus, le lot part normalement', async () => {
    // Sans ce cas, un refus systématique satisferait le suivant en rendant
    // « Tout annuler » définitivement inopérant.
    lot(2, 'controle');
    const res = await annuler();
    expect(res.ok).toBe(true);
    expect(supprimees.length).toBe(2);
  });

  it('un rappel qui refuse ARRÊTE tout, et rien n’est supprimé', async () => {
    lot(2, 'controle');
    const res = await annuler(() => 'Votre rôle ne permet pas cette action.');
    expect(res.ok, 'un lot refusé ne s’annule pas').toBe(false);
    expect(res.texte, 'et le refus est une PHRASE').toContain('rôle');
    expect(
      supprimees,
      'refuser APRÈS avoir supprimé laisserait la base dans un état que personne n’a demandé',
    ).toEqual([]);
  });

  it('le rappel voit l’actionId RÉEL de chaque ressource', async () => {
    /**
     * ⚠️ LE CŒUR DU DÉFAUT. La route passait `'intervention'` quoi qu'il
     * arrive : un lot de CLIENTS était jugé sur le domaine « terrain ». Ce cas
     * exige que ce soit bien l'`actionId` du journal qui remonte.
     */
    lot(1, 'controle');
    lotEnBase = { ...lotEnBase!, ressources: [{ actionId: 'client', id: 'c1' }] };
    const vus: string[] = [];
    await annuler((a) => {
      vus.push(a);
      return null;
    });
    expect(vus, 'c’est le journal qui décide, pas un littéral').toEqual(['client']);
  });
});
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

  it('n’annonce que ce qui est VRAIMENT parti', async () => {
    /**
     * ⚠️ LE CŒUR DU DÉFAUT. Le lot journalise 3 ressources ; l'une d'elles a
     * déjà disparu de son côté (une suppression manuelle, une cascade). La
     * phrase disait « les 3 actions » parce qu'elle comptait le JOURNAL. Elle
     * doit dire 2, et signaler la troisième.
     */
    lot(3, 'controle');
    deja.add('intervention-2');
    // La 3ᵉ ressource vise un domaine dont la ligne a disparu.
    (lotEnBase!.ressources as { actionId: string; id: string }[])[2]!.id = 'i2';
    domaineCourant = 'intervention';
    let appels = 0;
    tx.delete = () => {
      appels += 1;
      return chaineDelete(appels === 1 ? 'intervention-2' : 'intervention');
    };
    const r = await annuler();
    expect(r.ok).toBe(true);
    expect(r.texte, 'le chiffre doit être mesuré, pas recopié du journal').toContain(
      'les 2 actions',
    );
    expect(r.texte).toContain('déjà disparu');
  });

  it('le dit franchement quand plus rien n’était là', async () => {
    lot(2, 'controle');
    tx.delete = () => chaineDelete('fantome');
    deja.add('fantome');
    const r = await annuler();
    expect(r.ok).toBe(true);
    expect(r.texte).toContain('plus rien à défaire');
    expect(r.texte, 'surtout ne pas annoncer un chiffre').not.toMatch(/\d+ actions/);
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
