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

const { analyserRuche, analyserRucher, previsualiserRucher, insererRucherTx, annulerRucherTx } =
  await import('~~/server/utils/copilote-actions');
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

// ─── Le double de transaction : `insert`/`delete`/`select` ───────────────────

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
