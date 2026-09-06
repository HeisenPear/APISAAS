import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTableName } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import { valeursLiees } from '../../../helpers/fauxDb';

/**
 * CRÉER UNE RUCHE OU UN RUCHER — LE PREMIER GESTE DE TOUT NOUVEAU COMPTE, ET
 * LE SEUL QUE MAYA NE SAVAIT PAS FAIRE.
 *
 * Sans ruche, elle ne peut rien : pas d'intervention, pas de récolte, pas de
 * pesée. Mesuré avant correction, six formulations, six issues fausses :
 *
 *   « ajoute une ruche »                    → « sur quelle ruche ? »
 *   « ajoute la ruche 12 »                  → « sur quelle ruche ? »
 *   « j'ai ajouté une ruche au rucher X »   → « sur quelle ruche ? »
 *   « crée un rucher à Saint-Martin »       → la LISTE des ruchers
 *   « nouveau rucher les tilleuls »         → la LISTE des ruchers
 *   « j'ai installé 3 nouvelles ruches »    → « je n'ai pas compris »
 *
 * Les trois premières sont le comble : on demandait sur quelle ruche
 * enregistrer la ruche à créer.
 *
 * ⚠️ LA MOITIÉ DE CE BANC GARDE LES VOISINS. Un analyseur de création qui
 * réclame trop vole l'INTERVENTION (« note un contrôle ruche 3 »), la LECTURE
 * (« montre mes ruches ») et la NAVIGATION. Le verbe « note » crée et le mot
 * « ruche » est là : sans garde, rien ne sépare la fiche de l'objet.
 */

let refusCourant: string | null = null;
vi.mock('~~/server/utils/copilote-gating', () => ({
  refusDePlan: () => Promise.resolve(refusCourant),
}));

/**
 * ⚠️ `db` NE SE POSE PLUS SUR `globalThis`, ET LE BANC L'A APPRIS EN ÉCHOUANT
 * SUR « DATABASE_URL is not configured ».
 *
 * `copilote-actions.ts` importe `db` EXPLICITEMENT — c'est le correctif du
 * « db is not defined » qu'avait produit l'import circulaire. Un module qui
 * importe sa dépendance ne regarde plus `globalThis` : il faut donc doubler le
 * MODULE. C'est le prix, mérité, d'une dépendance rendue visible.
 *
 * `vi.hoisted` parce que le corps de `vi.mock` est remonté au-dessus des
 * imports : il ne peut voir ni une variable du fichier, ni `getTableName`. Le
 * nom de table se lit donc par le symbole que Drizzle y pose lui-même.
 */
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
  analyserRuche,
  analyserRucher,
  previsualiserRucher,
  previsualiserRuche,
  insererRucherTx,
  annulerRucherTx,
} = await import('~~/server/utils/copilote-actions');
const { classifierTour } = await import('~~/server/utils/copilote-local');
const { MAYA_ACTIONS } = await import('~~/app/config/maya-actions');

const t = (phrase: string) => classifierTour([{ role: 'user' as const, content: phrase }]);

/** Ce que le TRAJET COMPLET produit — pas seulement l'analyseur isolé. */
const action = (phrase: string): string => {
  const c = t(phrase);
  return c.kind === 'ecriture' ? `ecriture:${c.ecriture.action}` : c.kind;
};

const parseRuche = (phrase: string) => {
  const c = t(phrase);
  return c.kind === 'ecriture' && c.ecriture.action === 'ruche' ? c.ecriture.parse : null;
};

beforeEach(() => {
  refusCourant = null;
});

describe('le cheptel se crée à la voix', () => {
  it('garde-fou — les deux actions sont au catalogue et écrivent', () => {
    // Sans ça, tout ce banc mesurerait du vide : les phrases partiraient
    // ailleurs et les assertions ne verraient jamais de création.
    expect(MAYA_ACTIONS.ruche?.ecrit, 'l’action « ruche » a disparu').toBe(true);
    expect(MAYA_ACTIONS.rucher?.ecrit, 'l’action « rucher » a disparu').toBe(true);
    expect(MAYA_ACTIONS.ruche.domaine, 'le cheptel est du TERRAIN, pas du commerce').toBe(
      'terrain',
    );
  });

  it('les six formulations mesurées avant correction créent maintenant', () => {
    expect(action('ajoute une ruche')).toBe('ecriture:ruche');
    expect(action('ajoute la ruche 12')).toBe('ecriture:ruche');
    expect(action("j'ai ajoute une nouvelle ruche au rucher des tilleuls")).toBe('ecriture:ruche');
    expect(action('cree un rucher a Saint-Martin')).toBe('ecriture:rucher');
    expect(action('nouveau rucher les tilleuls')).toBe('ecriture:rucher');
    expect(action("j'ai installe 3 nouvelles ruches")).toBe('ecriture:ruche');
  });

  it('le numéro DICTÉ est repris, il ne se confond pas avec un compte', () => {
    // « ruche 12 » nomme ; « 3 ruches » compte. Le nombre est du même côté du
    // mot dans un cas et de l'autre dans l'autre — c'est tout ce qui les sépare.
    expect(parseRuche('ajoute la ruche 12')!.numero).toBe('12');
    expect(parseRuche('ajoute la ruche 12')!.combien).toBe(1);
    expect(parseRuche("j'ai installe 3 nouvelles ruches")!.combien).toBe(3);
    expect(
      parseRuche("j'ai installe 3 nouvelles ruches")!.numero,
      'le compte est devenu un numéro de ruche',
    ).toBeUndefined();
  });

  it('« dadant 12 » ne se range pas en Dadant 10', () => {
    /**
     * ⚠️ LE PREMIER MOT QUI CORRESPOND EST FAUX. « dadant » seul désigne la
     * Dadant 10 (le cadre standard français) : une boucle qui s'arrête au
     * premier trouvé rangeait « une dadant 12 » en `dadant_10`, en silence, sur
     * la donnée la plus structurante d'une ruche — celle qui décide de la
     * compatibilité de tout le matériel. On retient le mot le PLUS LONG.
     */
    expect(analyserRuche('ajoute une ruche dadant 12', 'ajoute une ruche dadant 12')?.type).toBe(
      'dadant_12',
    );
    expect(analyserRuche('ajoute une ruche dadant', 'ajoute une ruche dadant')?.type).toBe(
      'dadant_10',
    );
    expect(analyserRuche('ajoute une ruche warre', 'ajoute une ruche warré')?.type).toBe('warre');
  });

  it('le nom du rucher garde sa casse et perd sa préposition', () => {
    // Lu sur le texte BRUT : `normaliser` aurait effacé la majuscule d'un nom
    // propre, et un rucher s'appelle « Saint-Martin », pas « saint martin ».
    expect(
      analyserRucher('cree un rucher a saint-martin', 'crée un rucher à Saint-Martin')?.nom,
    ).toBe('Saint-Martin');
    // L'ARTICLE, lui, fait partie du nom : « les Tilleuls » n'est pas « Tilleuls ».
    expect(analyserRucher('nouveau rucher les tilleuls', 'nouveau rucher les Tilleuls')?.nom).toBe(
      'Les Tilleuls',
    );
  });

  it('un rucher sans nom se DEMANDE, il ne s’invente pas', async () => {
    const p = analyserRucher('cree un rucher', 'crée un rucher');
    expect(p).not.toBeNull();
    expect(p!.manque).toContain('nom');
    const vue = await previsualiserRucher('u1', p!);
    expect(vue.ok).toBe(false);
    if (vue.ok) return;
    expect(vue.message).toMatch(/appeler/i);
    // Jamais un mur sec : il y a toujours une porte de sortie.
    expect(vue.navigation, 'un refus sans issue est un mur').toBeTruthy();
  });
});

describe('ce que la création ne doit PAS voler', () => {
  it('une intervention reste une intervention', () => {
    /**
     * ⚠️ LE CAS QUI A DEMANDÉ UNE GARDE DE PLUS. Le verbe « note » crée, le mot
     * « ruche » est là : sans le vocabulaire de la VISITE, « note une
     * intervention ruche 5 » créait une ruche numéro 5 — un doublon dans le
     * cheptel, à la place de la visite qu'on voulait consigner.
     */
    expect(action('note un controle ruche 3'), 'le contrôle est devenu une ruche').toBe(
      'ecriture:intervention',
    );
    expect(action('nourrissement ruche 8')).toBe('ecriture:intervention');
    expect(action('ruche 3 reine vue force 4')).toBe('ecriture:intervention');
    expect(action('note une intervention ruche 5'), 'la visite est devenue une ruche').not.toBe(
      'ecriture:ruche',
    );

    /**
     * ⚠️ LES QUATRE CAS CI-DESSUS N'ATTEIGNENT PAS LA GARDE DES GESTES, ET LA
     * MUTATION L'A DIT : en retirant `GESTE_ECRITURE` et `OBS_CONTROLE` de
     * `estUneCreation`, le banc restait VERT. Deux d'entre eux sont arrêtés
     * plus tôt par le vocabulaire de la VISITE, et les deux autres n'ont même
     * pas de verbe de création.
     *
     * Il faut donc des phrases qui portent un VERBE DE CRÉATION *et* un geste
     * ou une observation — et ce sont les plus courantes du printemps. « Ajoute
     * une hausse à la ruche 5 » créant une sixième ruche, c'est un doublon dans
     * le cheptel à chaque pose de hausse.
     */
    expect(
      action('ajoute une hausse a la ruche 5'),
      'poser une hausse a créé une ruche — le geste le plus fréquent du printemps',
    ).not.toBe('ecriture:ruche');
    expect(
      action('note un nourrissement sur la ruche 8'),
      'un nourrissement a créé une ruche',
    ).not.toBe('ecriture:ruche');
    expect(action('note ruche 7 reine vue couvain'), 'un contrôle a créé une ruche').not.toBe(
      'ecriture:ruche',
    );
  });

  it('les autres écritures gardent leurs phrases', () => {
    expect(action('ajoute le client Dupont')).toBe('ecriture:client');
    expect(action('ajoute 12 pots au stock')).toBe('ecriture:stock');
    expect(action("j'ai recolte 25 kg de toutes fleurs")).toBe('ecriture:recolte');
    expect(action("j'ai vendu 12 pots a 8 euros")).toBe('ecriture:vente');
  });

  it('une lecture et une navigation ne créent rien', () => {
    expect(action('montre mes ruches')).not.toBe('ecriture:ruche');
    expect(action('combien de ruches')).not.toBe('ecriture:ruche');
    expect(action('ouvre mes ruchers')).not.toBe('ecriture:rucher');
    expect(action('liste mes ruchers')).not.toBe('ecriture:rucher');

    /**
     * ⚠️ AUCUNE DES QUATRE CI-DESSUS N'ATTEINT LES GARDES, ET LA MUTATION L'A
     * DIT : aucune ne porte de VERBE DE CRÉATION, donc `estUneCreation` les
     * écarte à la première ligne. Le cas mesurait une évidence.
     *
     * Il faut une lecture qui parle bien de créer — et c'est exactement
     * comme ça qu'on demande à revoir ce qu'on vient de faire.
     */
    expect(
      action("liste les ruchers que j'ai crees"),
      'une demande de LISTE a créé un rucher',
    ).not.toBe('ecriture:rucher');
    expect(action('montre moi le nouveau rucher'), 'une demande de VUE a créé un rucher').not.toBe(
      'ecriture:rucher',
    );
    /**
     * Et « ouvre un nouveau rucher » est une NAVIGATION — le même piège que
     * « ouvre une nouvelle vente », qui avait déjà cassé son banc une fois.
     * La navigation se reconnaît à son verbe d'ouverture EN TÊTE de phrase.
     */
    expect(
      action('ouvre un nouveau rucher'),
      'le formulaire demandé est devenu un rucher créé sans nom',
    ).not.toBe('ecriture:rucher');
  });

  it('« une ruche AU RUCHER X » crée la RUCHE, pas le rucher', () => {
    // Les deux mots sont dans la phrase ; le rucher n'y est que la destination.
    // La règle est écrite des DEUX côtés — l'ordre dans `classifierTour`, et un
    // refus explicite dans `analyserRucher` — pour qu'un appel direct à
    // l'analyseur reste juste.
    const brut = "j'ai ajoute une nouvelle ruche au rucher des tilleuls";
    expect(action(brut)).toBe('ecriture:ruche');
    expect(
      analyserRucher(brut, brut),
      'l’analyseur de rucher réclame une phrase de ruche',
    ).toBeNull();
    expect(parseRuche(brut)!.rucherQuery).toMatch(/tilleuls/i);
  });
});

function fauxExec(
  lignes: Record<string, unknown[]> = {},
  suppriméesRendues: unknown[] = [{ id: 'x' }],
) {
  const inserts: { table: string; valeurs: Record<string, unknown> }[] = [];
  const suppressions: { valeurs: string[] }[] = [];
  const exec = {
    select() {
      let table = '';
      const m = {
        from(tb: PgTable) {
          // ⚠️ `getTableName`, PAS `tb._.name` : la première version lisait une
          // propriété que Drizzle n'expose pas, donc TOUTE lecture rendait un
          // tableau vide. Le cas « un rucher habité ne se défait pas » est
          // tombé dessus immédiatement — un double silencieusement muet aurait
          // rendu vertes toutes les gardes qui dépendent d'une lecture.
          table = getTableName(tb);
          return m;
        },
        where() {
          return m;
        },
        orderBy() {
          return m;
        },
        limit() {
          return m;
        },
        then(res: (v: unknown[]) => unknown) {
          return Promise.resolve(lignes[table] ?? []).then(res);
        },
      };
      return m;
    },
    insert(tb: PgTable) {
      const table = getTableName(tb);
      const m = {
        values(v: Record<string, unknown>) {
          inserts.push({ table, valeurs: v });
          return m;
        },
        returning() {
          return Promise.resolve([{ id: 'cree' }]);
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
        returning() {
          return Promise.resolve(suppriméesRendues);
        },
      };
      return m;
    },
  };
  return { exec, inserts, suppressions };
}

describe('l’aperçu d’une ruche lit les données de l’apiculteur', () => {
  const poserDb = (lignes: Record<string, unknown[]>) => {
    feint.etat.lignes = lignes;
  };

  it('ZÉRO rucher : le refus nomme la phrase qui débloque', async () => {
    /**
     * ⚠️ C'EST LE PREMIER JOUR, ET LE PIRE MOMENT POUR UN MUR. Une ruche ne
     * peut pas exister sans emplacement (la clé étrangère est `NOT NULL`).
     * Un refus qui s'arrête au « non » laisserait l'apiculteur devant rien.
     */
    poserDb({ ruchers: [] });
    const vue = await previsualiserRuche('u1', { combien: 1, manque: [] });
    expect(vue.ok).toBe(false);
    if (vue.ok) return;
    expect(vue.message, 'le refus ne parle pas de rucher').toMatch(/rucher/i);
    expect(vue.message, 'le refus ne donne pas la phrase qui débloque').toMatch(
      /cr[ée]e un rucher/i,
    );
    expect(vue.navigation, 'un refus sans issue est un mur').toBeTruthy();
  });

  it('UN seul rucher : on ne demande pas où', async () => {
    poserDb({ ruchers: [{ id: 'ru1', nom: 'Les Tilleuls' }], ruches: [] });
    const vue = await previsualiserRuche('u1', { combien: 1, manque: [] });
    expect(vue.ok, 'Maya demande où poser la ruche alors qu’il n’y a qu’un endroit').toBe(true);
    if (!vue.ok) return;
    expect(vue.apercu).toContain('Les Tilleuls');
    // Aucune ruche encore : la suite démarre à 1, et le modèle est le défaut.
    expect(vue.params).toMatchObject({ numero: '1', rucherId: 'ru1', type: 'dadant_10' });
  });

  it('PLUSIEURS ruchers et aucun nommé : on demande, avec la liste', async () => {
    // Poser une ruche dans le mauvais rucher fausse ensuite chaque tournée et
    // chaque carte. Deviner serait pire que demander.
    poserDb({
      ruchers: [
        { id: 'ru1', nom: 'Les Tilleuls' },
        { id: 'ru2', nom: 'Le Verger' },
      ],
    });
    const vue = await previsualiserRuche('u1', { combien: 1, manque: [] });
    expect(vue.ok, 'Maya a choisi un rucher toute seule').toBe(false);
    if (vue.ok) return;
    expect(vue.suggestions, 'la question arrive sans la liste des ruchers').toEqual([
      'Les Tilleuls',
      'Le Verger',
    ]);
  });

  it('le numéro proposé CONTINUE la suite, et le modèle est le dominant', async () => {
    /**
     * Deux valeurs LUES dans les données de l'apiculteur, pas des défauts
     * globaux : sa suite de numéros, et le modèle qu'il utilise le plus. Un
     * apiculteur en Warré ne doit pas se voir proposer une Dadant.
     */
    poserDb({
      ruchers: [{ id: 'ru1', nom: 'Les Tilleuls' }],
      ruches: [
        { numero: '1', type: 'warre' },
        { numero: '7', type: 'warre' },
        { numero: '3', type: 'dadant_10' },
      ],
    });
    const vue = await previsualiserRuche('u1', { combien: 1, manque: [] });
    expect(vue.ok).toBe(true);
    if (!vue.ok) return;
    expect(vue.params).toMatchObject({ numero: '8', type: 'warre' });
  });

  it('un numéro DÉJÀ pris se refuse, il ne fabrique pas de doublon', async () => {
    poserDb({
      ruchers: [{ id: 'ru1', nom: 'Les Tilleuls' }],
      ruches: [{ numero: '12', type: 'dadant_10' }],
    });
    const vue = await previsualiserRuche('u1', { numero: '12', combien: 1, manque: [] });
    expect(vue.ok, 'deux ruches portent maintenant le numéro 12').toBe(false);
    if (vue.ok) return;
    expect(vue.message).toContain('12');
  });

  it('un LOT ne passe plus par l’aperçu d’une ruche seule', async () => {
    /**
     * ⚠️ CE CAS DISAIT L'INVERSE IL Y A UNE HEURE, ET C'EST NORMAL. Tant que le
     * lot n'existait pas, l'aperçu d'une ruche devait ANNONCER qu'il n'en
     * créait qu'une sur les trois demandées — taire l'écart aurait été pire que
     * la limite. Le lot passe maintenant par un PLAN (cf. `preparerRuchesEnLot`
     * et `lotDeRuches.test.ts`), et l'aperçu d'une ruche seule n'a plus à
     * parler de lot du tout.
     *
     * On garde le cas pour tenir l'aiguillage : si le lot repartait par ici,
     * trois ruches n'en feraient qu'une, en silence.
     */
    poserDb({ ruchers: [{ id: 'ru1', nom: 'Les Tilleuls' }], ruches: [] });
    const vue = await previsualiserRuche('u1', { combien: 3, manque: [] });
    expect(vue.ok).toBe(true);
    if (!vue.ok) return;
    expect(
      vue.params,
      'l’aperçu d’une ruche seule prépare encore UNE ruche alors qu’on en demandait trois',
    ).toMatchObject({ numero: '1' });
  });
});

// ─── Le double de transaction : `insert`/`delete`/`select` ───────────────────

describe('ce qui part vraiment en base', () => {
  it('le rucher s’écrit au bon propriétaire', async () => {
    const { exec, inserts } = fauxExec();
    const r = await insererRucherTx(exec as never, 'u1', { nom: 'Les Tilleuls' }, 'pro');
    expect(r.ok, r.texte).toBe(true);
    expect(inserts.length).toBe(1);
    expect(inserts[0]!.valeurs.userId, 'le rucher a changé de propriétaire').toBe('u1');
    expect(inserts[0]!.valeurs.nom).toBe('Les Tilleuls');
    expect(r.cree?.actionId, 'sans ça, rien n’entre au journal d’annulation').toBe('rucher');
  });

  it('un refus de plan n’écrit RIEN — comportement, pas message', async () => {
    refusCourant = 'Le plan Starter permet 3 ruchers (Réglages › Abonnement).';
    const { exec, inserts } = fauxExec();
    const r = await insererRucherTx(exec as never, 'u1', { nom: 'Les Tilleuls' }, 'decouverte');
    expect(r.ok).toBe(false);
    expect(inserts.length, 'le plan refuse et la ligne part quand même').toBe(0);
    expect(r.texte).toMatch(/Abonnement/);
  });

  it('un rucher qui porte DÉJÀ une ruche ne se défait pas', async () => {
    /**
     * ⚠️ LA CLÉ ÉTRANGÈRE DES RUCHES EST EN `ON DELETE CASCADE`. Défaire un
     * rucher habité emporterait ses ruches — donc leur historique entier. Et
     * « Annuler » doit défaire ce que MAYA vient d'écrire, jamais le travail de
     * l'apiculteur qui a suivi.
     */
    const { exec, suppressions } = fauxExec({ ruches: [{ id: 'r1' }] });
    const n = await annulerRucherTx(exec as never, 'u1', 'rucher-1');
    expect(n, 'un rucher habité a été supprimé').toBe(0);
    expect(suppressions.length, 'la suppression est partie quand même').toBe(0);
  });

  it('un rucher vide se défait, borné au propriétaire', async () => {
    const { exec, suppressions } = fauxExec({});
    const n = await annulerRucherTx(exec as never, 'u1', 'rucher-1');
    expect(n).toBe(1);
    expect(suppressions[0]!.valeurs, 'la suppression n’est plus bornée au propriétaire').toContain(
      'u1',
    );
  });

  it('une annulation qui ne défait RIEN répond zéro', async () => {
    const { exec } = fauxExec({}, []);
    expect(
      await annulerRucherTx(exec as never, 'u1', 'deja-parti'),
      'l’annulation annonce une suppression qui n’a pas eu lieu',
    ).toBe(0);
  });
});
