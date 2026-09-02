import { describe, it, expect, vi, beforeEach } from 'vitest';
import { valeursLiees } from '../../../helpers/fauxDb';

/**
 * DÉCLARER UNE PERTE — ET LE PIRE MOMENT DE L'ANNÉE POUR RECEVOIR UN COURS.
 *
 * Mesuré avant correction, quatre formulations, quatre issues fausses :
 *
 *   « j'ai perdu la ruche 5 »           → « je n'ai pas compris »
 *   « la ruche 7 est morte cet hiver »  → une FICHE de savoir
 *   « j'ai perdu 3 colonies cet hiver » → une FICHE de savoir
 *   « mortalité hivernale ruche 4 »     → une demande de clarification
 *
 * Un apiculteur qui ouvre ses ruches en mars et trouve une colonie morte n'a
 * pas besoin qu'on lui explique la mortalité hivernale. Il a besoin que ce soit
 * noté.
 *
 * ⚠️ L'AUTRE MOITIÉ DU BANC TIENT LA FRONTIÈRE AVEC LE SAVOIR. Les mêmes mots
 * servent à poser une QUESTION (« comment éviter la mortalité hivernale »), et
 * répondre à une question par une écriture est le défaut le plus cher du
 * moteur — l'anti-corpus le tient à zéro dur.
 */

let refusCourant: string | null = null;
vi.mock('~~/server/utils/copilote-gating', () => ({
  refusDePlan: () => Promise.resolve(refusCourant),
}));

/** Cf. `cheptelDicte` : `db` est un import EXPLICITE, il faut doubler le MODULE. */
const feint = vi.hoisted(() => {
  const etat: { lignes: Record<string, unknown[]> } = { lignes: {} };
  const nomDeTable = (tb: unknown): string =>
    String((tb as Record<symbol, unknown>)?.[Symbol.for('drizzle:Name')] ?? '');
  const db = {
    select() {
      let table = '';
      const m = {
        from(tb: unknown) {
          table = nomDeTable(tb);
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

const {
  analyserMortalite,
  analyserRuche,
  previsualiserMortalite,
  insererMortaliteTx,
  annulerMortaliteTx,
} = await import('~~/server/utils/copilote-actions');
const { classifierTour } = await import('~~/server/utils/copilote-local');
const { MAYA_ACTIONS } = await import('~~/app/config/maya-actions');

const t = (phrase: string) => classifierTour([{ role: 'user' as const, content: phrase }]);
const action = (phrase: string): string => {
  const c = t(phrase);
  return c.kind === 'ecriture' ? `ecriture:${c.ecriture.action}` : c.kind;
};
const parse = (phrase: string) => {
  const c = t(phrase);
  return c.kind === 'ecriture' && c.ecriture.action === 'mortalite' ? c.ecriture.parse : null;
};

beforeEach(() => {
  refusCourant = null;
  feint.etat.lignes = {};
});

describe('la perte s’enregistre, au lieu d’ouvrir une fiche', () => {
  it('garde-fou — l’action est au catalogue, écrit, et n’est PAS gatée', () => {
    expect(MAYA_ACTIONS.mortalite?.ecrit, 'l’action a disparu').toBe(true);
    /**
     * On ne fait pas payer un apiculteur pour enregistrer que ses colonies sont
     * mortes. Le geste RÉDUIT son cheptel : le gater reviendrait à lui interdire
     * de descendre sous son propre plafond.
     */
    expect(MAYA_ACTIONS.mortalite.route, 'la perte a été gatée').toBeNull();
    expect(MAYA_ACTIONS.mortalite.autonomie, 'une perte ne se note jamais sans accord').toBe(
      'jamais',
    );
  });

  it('les quatre formulations mesurées avant correction écrivent maintenant', () => {
    expect(action("j'ai perdu la ruche 5")).toBe('ecriture:mortalite');
    expect(action('la ruche 7 est morte cet hiver')).toBe('ecriture:mortalite');
    expect(action("j'ai perdu 3 colonies cet hiver")).toBe('ecriture:mortalite');
    expect(action('mortalite hivernale ruche 4')).toBe('ecriture:mortalite');
  });

  it('la cause se lit quand elle est dite', () => {
    expect(parse('la ruche 12 est morte de faim')!.cause).toBe('faim');
    expect(parse("j'ai perdu la ruche 3 a cause du varroa")!.cause).toBe('varroa');
    expect(parse("j'ai perdu la ruche 3")!.cause, 'une cause a été inventée').toBeUndefined();
  });

  it('sans numéro de ruche, on DEMANDE — on ne devine pas', async () => {
    /**
     * « J'ai perdu 3 colonies » ne dit pas LESQUELLES. Deviner sortirait du
     * cheptel des colonies bien vivantes — l'erreur inverse de celle qu'on
     * corrige, et bien pire.
     */
    const p = parse("j'ai perdu 3 colonies cet hiver")!;
    expect(p.manque).toContain('ruche');
    expect(p.combien).toBe(3);
    feint.etat.lignes = {
      ruches: [
        { id: 'r1', numero: '5', rucherNom: 'Les Tilleuls', rucherId: 'ru1' },
        { id: 'r2', numero: '7', rucherNom: 'Les Tilleuls', rucherId: 'ru1' },
      ],
    };
    const vue = await previsualiserMortalite('u1', p);
    expect(vue.ok, 'Maya a choisi une ruche toute seule').toBe(false);
    if (vue.ok) return;
    expect(vue.suggestions?.length, 'la question arrive sans la liste des ruches').toBeGreaterThan(
      0,
    );
  });

  it('une ruche introuvable se dit, elle ne plante pas', async () => {
    feint.etat.lignes = { ruches: [{ id: 'r1', numero: '5', rucherNom: 'X', rucherId: 'ru1' }] };
    const vue = await previsualiserMortalite('u1', {
      rucheNumero: '99',
      combien: 1,
      manque: [],
    });
    expect(vue.ok).toBe(false);
    if (vue.ok) return;
    expect(vue.message).toContain('99');
  });

  it('l’aperçu nomme la ruche, son rucher et le nouveau statut', async () => {
    feint.etat.lignes = {
      ruches: [{ id: 'r1', numero: '5', rucherNom: 'Les Tilleuls', rucherId: 'ru1' }],
    };
    const vue = await previsualiserMortalite('u1', { rucheNumero: '5', combien: 1, manque: [] });
    expect(vue.ok).toBe(true);
    if (!vue.ok) return;
    expect(vue.apercu).toContain('Les Tilleuls');
    expect(vue.apercu).toContain('morte');
    expect(vue.params).toMatchObject({ rucheId: 'r1' });
  });
});

describe('ce que la perte ne doit PAS voler', () => {
  it('une QUESTION sur la mortalité reste une question', () => {
    /**
     * ⚠️ C'EST LA FRONTIÈRE LA PLUS FINE DU MOTEUR : les mêmes mots servent à
     * déclarer et à demander. Répondre par une écriture à une question est le
     * défaut que l'anti-corpus tient à zéro dur.
     */
    expect(
      action('comment eviter la mortalite hivernale'),
      'un cours est devenu une perte',
    ).not.toBe('ecriture:mortalite');
    expect(action('pourquoi mes ruches meurent en hiver')).not.toBe('ecriture:mortalite');
    expect(action('mortalite hivernale')).not.toBe('ecriture:mortalite');
    expect(action('combien de ruches j ai perdu')).not.toBe('ecriture:mortalite');

    /**
     * ⚠️ AUCUNE DES QUATRE CI-DESSUS N'ATTEINT MES GARDES, ET LA MUTATION L'A
     * DIT : en les retirant TOUTES, le banc restait vert. Trois sont captées en
     * amont par `INTERRO_INFO`, ancré au DÉBUT de phrase (« comment »,
     * « pourquoi », « combien ») ; la quatrième ne nomme aucune colonie, donc
     * l'exigence de ruche l'écarte avant. Les cas mesuraient le garde-fou du
     * classifieur, pas le mien.
     *
     * Il faut donc une lecture dont le mot interrogatif n'ouvre PAS la phrase,
     * et qui compte bien des colonies — c'est d'ailleurs comme ça qu'on demande
     * le bilan d'un hiver.
     */
    expect(
      action("liste les 3 colonies que j'ai perdues"),
      'une demande de bilan a déclaré trois pertes',
    ).not.toBe('ecriture:mortalite');
    /**
     * Et une perte ANNONCÉE n'est pas une perte constatée. « Il faudra
     * déclarer » parle de ce qu'on va faire ; sortir la ruche du cheptel
     * là-dessus, c'est écrire sur une colonie peut-être encore vivante.
     */
    expect(
      action('il faudra declarer la ruche 5 morte'),
      'une intention a sorti une ruche du cheptel',
    ).not.toBe('ecriture:mortalite');
  });

  it('une perte ne CRÉE jamais de ruche', () => {
    /**
     * ⚠️ « NOTE QUE LA RUCHE 5 EST MORTE » PORTE LE VERBE « NOTE » ET LE MOT
     * « RUCHE » — de quoi déclencher la création de cheptel. Sans garde, chaque
     * décès aurait fabriqué une ruche de plus. La règle est écrite des deux
     * côtés : l'ordre dans `classifierTour`, et un refus explicite dans
     * `estUneCreation`.
     */
    expect(action('note que la ruche 5 est morte'), 'un décès a créé une ruche').toBe(
      'ecriture:mortalite',
    );
    expect(action("j'ai perdu la ruche 5")).not.toBe('ecriture:ruche');

    /**
     * ⚠️ L'ORDRE SEUL SUFFIT AUJOURD'HUI, DONC LE CAS CI-DESSUS NE GARDE PAS LA
     * RÈGLE : la mortalité est testée AVANT la création, donc retirer le refus
     * de `estUneCreation` ne changeait rien — mutation restée verte. On appelle
     * donc l'analyseur de création DIRECTEMENT, ce qui est le sens même de
     * « la règle est écrite des deux côtés » : elle doit tenir sans l'ordre.
     */
    expect(
      analyserRuche('note que la ruche 5 est morte', 'note que la ruche 5 est morte'),
      'appelé seul, l’analyseur de création fabrique une ruche à chaque décès',
    ).toBeNull();
  });

  it('les gestes voisins gardent leurs phrases', () => {
    expect(action('ajoute une ruche')).toBe('ecriture:ruche');
    expect(action('note un controle ruche 3')).toBe('ecriture:intervention');
    expect(action('ruche 3 reine vue force 4')).toBe('ecriture:intervention');
  });

  it('« la ruche 3 est vide » n’est PAS une perte', () => {
    /**
     * Le mot peut dire que la colonie a disparu — ou qu'il n'y a plus de miel,
     * ou qu'on parle d'une hausse vide. Déclarer une colonie morte là-dessus
     * sortirait une ruche VIVANTE du cheptel. Devant une phrase ambiguë qui
     * déclencherait une écriture, on n'écrit pas.
     */
    expect(action('la ruche 3 est vide')).not.toBe('ecriture:mortalite');
    expect(analyserMortalite('la ruche 3 est vide', 'la ruche 3 est vide')).toBeNull();
  });
});

// ─── Le double de transaction ────────────────────────────────────────────────

function fauxExec(
  lignes: Record<string, unknown[]> = {},
  suppriméesRendues: unknown[] = [{ id: 'i1' }],
) {
  const inserts: { table: string; valeurs: Record<string, unknown> }[] = [];
  /**
   * ⚠️ LES CONDITIONS DES LECTURES SONT ENREGISTRÉES, ET C'EST LA MUTATION QUI
   * L'A EXIGÉ. Un double qui rend ses lignes sans regarder le `where` laisse
   * passer le retrait d'un `eq(userId, …)` : l'isolation entre exploitations de
   * cette application ne tient QU'À CES FILTRES écrits à la main — `db.ts`
   * ouvre une connexion qui contourne la RLS. C'est exactement ce que fait
   * `fauxDb.ts`, et que j'avais laissé tomber en écrivant le mien.
   */
  const lectures: { table: string; conditions: string[] }[] = [];
  const updates: { valeurs: Record<string, unknown>; conditions: string[] }[] = [];
  const suppressions: { valeurs: string[] }[] = [];
  const nom = (tb: unknown): string =>
    String((tb as Record<symbol, unknown>)?.[Symbol.for('drizzle:Name')] ?? '');
  const exec = {
    select() {
      let table = '';
      const m = {
        from(tb: unknown) {
          table = nom(tb);
          return m;
        },
        where(cond: unknown) {
          lectures.push({ table, conditions: valeursLiees(cond) });
          return m;
        },
        innerJoin: () => m,
        orderBy: () => m,
        limit: () => m,
        then: (res: (v: unknown[]) => unknown) => Promise.resolve(lignes[table] ?? []).then(res),
      };
      return m;
    },
    insert(tb: unknown) {
      const table = nom(tb);
      const m = {
        values(v: Record<string, unknown>) {
          inserts.push({ table, valeurs: v });
          return m;
        },
        returning: () => Promise.resolve([{ id: 'i1' }]),
      };
      return m;
    },
    update() {
      let valeurs: Record<string, unknown> = {};
      const m = {
        set(v: Record<string, unknown>) {
          valeurs = v;
          return m;
        },
        where(cond: unknown) {
          updates.push({ valeurs, conditions: valeursLiees(cond) });
          return Promise.resolve([]);
        },
      };
      return m;
    },
    delete() {
      const m = {
        where(cond: unknown) {
          suppressions.push({ valeurs: valeursLiees(cond) });
          return m;
        },
        returning: () => Promise.resolve(suppriméesRendues),
      };
      return m;
    },
  };
  return { exec, inserts, updates, suppressions, lectures };
}

describe('ce qui part vraiment en base', () => {
  // Un vrai UUID : `mortaliteActionSchema` en exige un, et c'est bien ce
  // qu'un aperçu produit. Un « r1 » bricolé aurait fait échouer le banc sur
  // la validation au lieu du comportement mesuré.
  const ID_RUCHE = '11111111-1111-4111-8111-111111111111';
  const RUCHE = { id: ID_RUCHE, numero: '5', rucherId: 'ru1', statut: 'faible' };

  it('le statut passe à morte, et la trace garde l’ANCIEN', async () => {
    const { exec, inserts, updates } = fauxExec({ ruches: [RUCHE] });
    const r = await insererMortaliteTx(exec as never, 'u1', { rucheId: ID_RUCHE }, 'decouverte');
    expect(r.ok, r.texte).toBe(true);

    expect(updates.length, 'le statut de la ruche n’a pas changé').toBe(1);
    expect(updates[0]!.valeurs.statut).toBe('morte');
    expect(updates[0]!.conditions, 'la mise à jour n’est plus bornée au propriétaire').toContain(
      'u1',
    );

    expect(inserts.length, 'aucune trace ne documente la perte').toBe(1);
    const trace = inserts[0]!.valeurs;
    expect(trace.type).toBe('sanitaire');
    expect(trace.userId).toBe('u1');
    // ⚠️ SANS `statutPrecedent`, L'ANNULATION NE PEUT PLUS RESTAURER QUE
    // « active » — et une colonie qui meurt était souvent `faible` la veille.
    expect(trace.donnees, 'la trace ne porte plus l’ancien statut').toMatchObject({
      mortalite: true,
      statutPrecedent: 'faible',
    });
  });

  it('la ruche est LUE bornée au propriétaire', async () => {
    /**
     * ⚠️ SANS CE CAS, RETIRER `eq(ruches.userId, userId)` DE LA LECTURE NE
     * CASSAIT RIEN — mutation restée verte. Or c'est la lecture qui décide :
     * elle rapporte le statut, le numéro et le rucher, et tout le reste en
     * découle. Ce dépôt n'a pas de RLS côté serveur ; l'isolation entre
     * exploitations ne tient qu'à ces filtres écrits à la main.
     */
    const { exec, lectures } = fauxExec({ ruches: [RUCHE] });
    await insererMortaliteTx(exec as never, 'u1', { rucheId: ID_RUCHE }, 'decouverte');
    const surRuches = lectures.filter((l) => l.table === 'ruches');
    expect(surRuches.length, 'la ruche n’est plus relue avant d’être déclarée morte').toBe(1);
    expect(
      surRuches[0]!.conditions,
      'la lecture n’est plus bornée au propriétaire : la ruche d’un autre apiculteur répondrait',
    ).toContain('u1');
  });

  it('une ruche DÉJÀ morte ne se re-déclare pas', async () => {
    const { exec, inserts, updates } = fauxExec({ ruches: [{ ...RUCHE, statut: 'morte' }] });
    const r = await insererMortaliteTx(exec as never, 'u1', { rucheId: ID_RUCHE }, 'decouverte');
    expect(r.ok).toBe(false);
    expect(inserts.length + updates.length, 'une seconde trace a été écrite').toBe(0);
  });

  it('une ruche qui n’est pas la sienne ne se déclare pas morte', async () => {
    // Le double ne rend RIEN : c'est le cas « la requête scopée userId ne
    // trouve pas la ligne ». Ce dépôt n'a pas de RLS côté serveur.
    const { exec, inserts, updates } = fauxExec({ ruches: [] });
    const r = await insererMortaliteTx(exec as never, 'u1', { rucheId: ID_RUCHE }, 'decouverte');
    expect(r.ok).toBe(false);
    expect(inserts.length + updates.length).toBe(0);
  });

  it('l’annulation RESTAURE l’ancien statut, pas « active »', async () => {
    /**
     * ⚠️ UNE COLONIE QUI MEURT ÉTAIT SOUVENT `faible` OU `orpheline` LA VEILLE
     * — c'est même le cas le plus fréquent. Remettre « active » effacerait
     * l'observation qui précède la perte, sur la ruche même dont on venait de
     * dire qu'elle allait mal.
     */
    const { exec, updates, suppressions } = fauxExec({
      interventions: [
        { id: 'i1', rucheId: 'r1', donnees: { mortalite: true, statutPrecedent: 'orpheline' } },
      ],
    });
    const n = await annulerMortaliteTx(exec as never, 'u1', 'i1');
    expect(n, 'l’annulation doit RÉPONDRE combien de lignes sont parties').toBe(1);
    expect(updates.length, 'le statut n’a pas été restauré').toBe(1);
    expect(updates[0]!.valeurs.statut, 'la ruche est revenue « active » au lieu de son état').toBe(
      'orpheline',
    );
    // ⚠️ LA RESTAURATION AUSSI PORTE SES BORNES. Sans ce contrôle, retirer le
    // `eq(ruches.userId, …)` de la mise à jour laissait le banc vert : un
    // identifiant de trace mal routé aurait alors changé le statut d'une ruche
    // appartenant à quelqu'un d'autre.
    expect(updates[0]!.conditions, 'la restauration n’est plus bornée au propriétaire').toContain(
      'u1',
    );
    expect(suppressions.length, 'la trace est restée').toBe(1);
    expect(suppressions[0]!.valeurs).toContain('u1');
  });

  it('une trace qui n’est PAS une mortalité ne se défait pas par cette porte', async () => {
    // Le journal ne devrait jamais l'y amener — mais chaque suppression porte
    // ses propres bornes.
    const { exec, updates, suppressions } = fauxExec({
      interventions: [{ id: 'i1', rucheId: 'r1', donnees: { varroa: 12 } }],
    });
    const n = await annulerMortaliteTx(exec as never, 'u1', 'i1');
    expect(n, 'un comptage varroa a été supprimé par la porte des mortalités').toBe(0);
    expect(updates.length + suppressions.length, 'quelque chose a bougé quand même').toBe(0);
  });

  it('une annulation qui ne trouve rien répond zéro', async () => {
    const { exec } = fauxExec({ interventions: [] });
    expect(await annulerMortaliteTx(exec as never, 'u1', 'i1')).toBe(0);
  });
});
