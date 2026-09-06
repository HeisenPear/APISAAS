import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { creerFauxDb } from '~~/tests/helpers/fauxDb';
import { construireExportPersonnel, MENTION_CENSURE } from '~~/server/utils/exportPersonnel';

/**
 * L'ASSEMBLAGE, pas seulement l'inventaire.
 *
 * `exportPersonnel.test.ts` vérifie QUELLES tables sont classées. Ici on vérifie
 * que la charge utile est assemblée juste — et il y a un vrai risque : les
 * résultats reviennent d'un `Promise.all` et sont réattribués PAR INDICE
 * (`resultats[i]` → `sources[i].cle`), après un `[profilRows, ...resultats]`
 * qui décale déjà de un. Une erreur d'un cran ne casse rien, ne lève rien : elle
 * range les interventions sous la clé « clients ». La personne recevrait un
 * fichier cohérent en apparence et faux en substance.
 *
 * On donne donc à CHAQUE table une ligne-marqueur qui la nomme, et on exige que
 * chaque clé de sortie porte le marqueur de sa propre table.
 */

const USER_ID = '3f6c1e2a-0000-4000-8000-abcdefabcdef';
const EMAIL = 'apicultrice@exemple.fr';
const INSTANT = new Date('2026-08-20T06:00:00.000Z');

let dbOriginal: unknown;

beforeEach(() => {
  dbOriginal = (globalThis as Record<string, unknown>).db;
});
afterEach(() => {
  (globalThis as Record<string, unknown>).db = dbOriginal;
});

/** Pose le double sur `globalThis` — `db` est un auto-import Nuxt. */
function poser(faux: ReturnType<typeof creerFauxDb>) {
  (globalThis as Record<string, unknown>).db = faux.db;
}

/** 1re passe : on apprend les noms SQL réellement interrogés, dans l'ordre. */
async function tablesInterrogees(): Promise<string[]> {
  const faux = creerFauxDb();
  poser(faux);
  await construireExportPersonnel(USER_ID, EMAIL, INSTANT);
  return faux.requetes.map((r) => r.table);
}

describe('construireExportPersonnel — assemblage', () => {
  it('range chaque table sous SA propre clé (aucun décalage d’indice)', async () => {
    const noms = await tablesInterrogees();

    // Chaque table rend une ligne qui se nomme elle-même.
    const lignes: Record<string, unknown[]> = {};
    for (const n of noms) lignes[n] = [{ marqueur: n }];
    // `balances` porte en plus un jeton, pour vérifier la censure au passage.
    if (lignes.balances) lignes.balances = [{ marqueur: 'balances', ingestToken: 'tok_reel' }];

    const faux = creerFauxDb(lignes);
    poser(faux);
    const payload = await construireExportPersonnel(USER_ID, EMAIL, INSTANT);

    // requetes[0] = profils (interrogée à part), puis les sources dans l'ordre.
    expect(faux.requetes[0]!.table).toBe('profils');

    const desordre: string[] = [];
    const cles = Object.keys(payload.data).filter((c) => c !== 'profil');
    cles.forEach((cle, i) => {
      const tableAttendue = faux.requetes[i + 1]!.table;
      const rangees = payload.data[cle] as { marqueur?: string }[];
      const vu = rangees[0]?.marqueur;
      if (vu !== tableAttendue) desordre.push(`${cle} ← ${vu} (attendu ${tableAttendue})`);
    });

    expect(
      desordre,
      'Des lignes sont rangées sous la mauvaise clé — décalage d’indice dans l’assemblage :',
    ).toEqual([]);
  });

  it('n’oublie aucune source dans la sortie', async () => {
    const noms = await tablesInterrogees();
    const faux = creerFauxDb();
    poser(faux);
    const payload = await construireExportPersonnel(USER_ID, EMAIL, INSTANT);

    // une clé par source + la clé `profil`
    expect(Object.keys(payload.data).length).toBe(noms.length);
  });

  it('filtre TOUTES les requêtes sur l’utilisateur demandeur', async () => {
    const faux = creerFauxDb();
    poser(faux);
    await construireExportPersonnel(USER_ID, EMAIL, INSTANT);

    const sansFiltre = faux.requetes.filter((r) => !r.valeurs.includes(USER_ID));
    expect(
      sansFiltre.map((r) => r.table),
      'Ces requêtes ne filtrent pas sur l’utilisateur : elles exporteraient les ' +
        'données d’autrui. L’isolation de ce produit ne tient qu’à ces `eq(userId, …)`.',
    ).toEqual([]);
  });

  it('censure le jeton d’ingestion des balances dans la charge assemblée', async () => {
    const faux = creerFauxDb({ balances: [{ id: 'b1', ingestToken: 'tok_reel' }] });
    poser(faux);
    const payload = await construireExportPersonnel(USER_ID, EMAIL, INSTANT);

    const balances = payload.data.balances as Record<string, unknown>[];
    expect(balances[0]!.ingestToken).toBe(MENTION_CENSURE);
    expect(JSON.stringify(payload)).not.toContain('tok_reel');
  });

  it('rend le profil seul, pas un tableau', async () => {
    const faux = creerFauxDb({ profils: [{ id: USER_ID, nom: 'Martin' }] });
    poser(faux);
    const payload = await construireExportPersonnel(USER_ID, EMAIL, INSTANT);
    expect(payload.data.profil).toEqual({ id: USER_ID, nom: 'Martin' });
  });

  it('rend `profil: null` plutôt que de lever, si le profil manque', async () => {
    poser(creerFauxDb());
    const payload = await construireExportPersonnel(USER_ID, EMAIL, INSTANT);
    expect(payload.data.profil).toBeNull();
  });

  it('horodate avec l’instant fourni, et porte l’identité du demandeur', async () => {
    poser(creerFauxDb());
    const payload = await construireExportPersonnel(USER_ID, EMAIL, INSTANT);
    expect(payload.exportedAt).toBe('2026-08-20T06:00:00.000Z');
    expect(payload.user).toEqual({ id: USER_ID, email: EMAIL });
  });

  it('emporte les motifs d’exclusion — l’omission voyage avec le fichier', async () => {
    poser(creerFauxDb());
    const payload = await construireExportPersonnel(USER_ID, EMAIL, INSTANT);
    expect(Object.keys(payload.exclusions).length).toBeGreaterThan(0);
    for (const motif of Object.values(payload.exclusions)) {
      expect(motif.length).toBeGreaterThan(40);
    }
  });
});
