import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getTableName } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import { alertes, messagesForum, profils, sujetsForum } from '~~/server/database/schema';
import { CATEGORIES_DEFAUT, CATEGORIES_NOTIF } from '~~/server/utils/alertesCategories';

// ═══════════════════════════════════════════════════════════════════════════
// PRÉVENIR SANS HARCELER.
//
// Trois règles, et chacune ferme un défaut qui vide un forum ou une boîte de
// réception :
//   1. jamais pour son PROPRE message ;
//   2. une alerte par FIL et par JOUR, pas une par réponse ;
//   3. seulement si le compte n'a pas coupé la catégorie.
//
// ⚠️ ET UNE QUATRIÈME, QUI NE SE VOIT PAS : la fonction NE LÈVE JAMAIS. Le
// message est publié avant elle ; la faire échouer ferait répondre une erreur
// pour une réponse pourtant enregistrée, et l'apiculteur la réécrirait.
// ═══════════════════════════════════════════════════════════════════════════

const AUTEUR = '00000000-0000-4000-8000-00000000000a';
const REPONDEUR = '00000000-0000-4000-8000-00000000000b';
const SUJET = '11111111-1111-4111-8111-111111111111';
const MAINTENANT = new Date('2026-03-10T09:00:00Z');

let lignes: Record<string, Array<Record<string, unknown>>>;
let comptes: Record<string, number>;
let inserts: Array<{ table: string; valeurs: Record<string, unknown> }>;
let leveALaLecture: boolean;

function faireDb() {
  return {
    select: (cols?: unknown) => {
      const compte = estComptage(cols);
      let nom = '(inconnue)';
      const chaine = {
        from: (t: PgTable) => {
          nom = getTableName(t);
          return chaine;
        },
        where: () => chaine,
        limit: () => chaine,
        then: (ok: (v: unknown[]) => unknown, ko?: (e: unknown) => unknown) => {
          if (leveALaLecture) return Promise.reject(new Error('base indisponible')).then(ok, ko);
          if (compte) {
            const cle = Object.keys(cols as Record<string, unknown>)[0]!;
            return Promise.resolve([{ [cle]: comptes[nom] ?? 0 }]).then(ok, ko);
          }
          return Promise.resolve(lignes[nom] ?? []).then(ok, ko);
        },
      };
      return chaine;
    },
    insert: (t: PgTable) => ({
      values: async (valeurs: Record<string, unknown>) => {
        inserts.push({ table: getTableName(t), valeurs });
        return [];
      },
    }),
  };
}

function estComptage(cols: unknown): boolean {
  if (!cols || typeof cols !== 'object') return false;
  return Object.values(cols as Record<string, unknown>).some((v) => {
    const chunks = (v as { queryChunks?: unknown[] })?.queryChunks;
    if (!Array.isArray(chunks)) return false;
    return chunks.some((c) => {
      const brut = (c as { value?: unknown })?.value;
      const morceaux = Array.isArray(brut) ? brut : [brut, c];
      return morceaux.some((m) => typeof m === 'string' && m.includes('count('));
    });
  });
}

/** Le monde par défaut : un sujet visible, écrit par AUTEUR, sans alerte récente. */
function monde(surcharges: Record<string, unknown> = {}) {
  lignes = {
    [getTableName(sujetsForum)]: [
      {
        id: SUJET,
        titre: 'Varroa fin août',
        slug: 'varroa-fin-aout',
        auteurId: AUTEUR,
        statut: 'visible',
        ...surcharges,
      },
    ],
    [getTableName(profils)]: [{ prefs: surcharges.prefs ?? {} }],
  };
  comptes = { [getTableName(alertes)]: 0, [getTableName(messagesForum)]: 1 };
}

beforeEach(() => {
  inserts = [];
  leveALaLecture = false;
  monde();
  vi.resetModules();
  Object.assign(globalThis, { db: faireDb() });
});

async function notifier(auteurDuMessage = REPONDEUR) {
  const { notifierReponseAuSujet } = await import('~~/server/utils/forumNotification');
  return notifierReponseAuSujet(SUJET, auteurDuMessage, MAINTENANT);
}

describe('garde-fou du harnais', () => {
  it('dans le cas NORMAL, une alerte part', () => {
    // Sans ce cas, toutes les règles « n'écrit rien » seraient vertes sur une
    // fonction qui n'écrit JAMAIS — c'est-à-dire sur un forum muet.
    return notifier().then((envoyee) => {
      expect(envoyee).toBe(true);
      expect(inserts.filter((i) => i.table === getTableName(alertes))).toHaveLength(1);
    });
  });
});

describe('1 · jamais pour son PROPRE message', () => {
  it('répondre à son propre sujet ne se notifie pas soi-même', async () => {
    /**
     * C'est le premier réflexe de quiconque complète sa question : « ah, et
     * j'oubliais… ». Se recevoir une notification pour son propre message
     * apprend en une fois que ces notifications ne veulent rien dire.
     */
    expect(await notifier(AUTEUR)).toBe(false);
    expect(inserts).toEqual([]);
  });
});

describe('2 · une par FIL et par JOUR', () => {
  it('une alerte récente sur ce fil en empêche une seconde', async () => {
    /**
     * Un fil vivant reçoit dix messages dans l'après-midi. Dix notifications
     * pour la même conversation font désinstaller l'application — pas revenir
     * au forum.
     */
    comptes[getTableName(alertes)] = 1;
    expect(await notifier()).toBe(false);
    expect(inserts).toEqual([]);
  });

  it('le message COMPTE les réponses au lieu d’annoncer « une »', async () => {
    // « 3 réponses » dit s'il vaut la peine d'ouvrir ; « une réponse » répété
    // trois fois ne dit rien de plus que la première fois.
    comptes[getTableName(messagesForum)] = 3;
    await notifier();
    expect(String(inserts[0]!.valeurs.message)).toContain('3 réponses');
  });
});

describe('3 · seulement si le compte le veut', () => {
  it('la catégorie coupée fait taire la notification', async () => {
    monde({ prefs: { communaute: false } });
    expect(await notifier()).toBe(false);
    expect(inserts).toEqual([]);
  });

  it('un compte SANS préférence enregistrée reçoit quand même', async () => {
    /**
     * ⚠️ `!== false`, ET NON `=== true`. Les préférences sont un JSON qui n'a
     * pas forcément la clé : aucun compte existant n'a rien d'écrit pour une
     * catégorie créée aujourd'hui. Exiger `true` aurait privé de notification
     * TOUS les comptes actuels, en silence — le forum n'aurait réveillé
     * personne, et rien n'aurait expliqué pourquoi.
     */
    monde({ prefs: { sante: true } });
    expect(await notifier()).toBe(true);
  });

  it('couper une AUTRE catégorie ne coupe pas celle-ci', async () => {
    monde({ prefs: { sante: false, gestion: false } });
    expect(await notifier()).toBe(true);
  });
});

describe('l’alerte écrite dit ce qu’il faut', () => {
  it('porte le type, la référence et le lien vers le fil', async () => {
    await notifier();
    const a = inserts[0]!.valeurs;
    expect(a.userId, 'l’alerte doit viser l’AUTEUR du sujet').toBe(AUTEUR);
    expect(a.type).toBe('forum_reponse');
    expect(a.referenceId, 'sans référence, l’anti-doublon ne peut pas fonctionner').toBe(SUJET);
    expect(a.actionUrl, 'le lien doit mener AU FIL, pas à la liste').toBe('/forum/varroa-fin-aout');
  });

  it('reste en priorité BASSE', async () => {
    /**
     * La priorité gouverne le push et le résumé du matin. Mettre une
     * conversation au rang d'une alerte sanitaire, c'est apprendre à ignorer
     * les deux.
     */
    await notifier();
    expect(inserts[0]!.valeurs.priorite).toBe('basse');
  });
});

describe('un sujet masqué ne notifie plus', () => {
  it('rien ne part sur un fil retiré de la lecture publique', async () => {
    monde({ statut: 'masque' });
    expect(await notifier()).toBe(false);
  });
});

describe('la notification NE FAIT JAMAIS ÉCHOUER la réponse', () => {
  it('une base indisponible rend `false`, elle ne lève pas', async () => {
    /**
     * ⚠️ LE MESSAGE EST DÉJÀ PUBLIÉ QUAND CETTE FONCTION S'EXÉCUTE. Laisser
     * remonter l'erreur ferait répondre 500 à la route : l'apiculteur croirait
     * son message perdu et le réécrirait, alors qu'il est bien enregistré. Un
     * fil se retrouverait avec le même message deux fois, par la faute d'une
     * notification.
     */
    leveALaLecture = true;
    await expect(notifier()).resolves.toBe(false);
  });
});

describe('la catégorie est déclarée partout où il faut', () => {
  it('« communaute » a son défaut ET figure dans la liste des interrupteurs', () => {
    /**
     * ⚠️ LA LISTE EST DÉRIVÉE DES DÉFAUTS, ET CE CAS LE VÉRIFIE. Elle était
     * une seconde énumération des mêmes clés : une catégorie ajoutée d'un côté
     * et pas de l'autre aurait produit des notifications qu'aucun interrupteur
     * ne coupe.
     */
    expect(CATEGORIES_DEFAUT.communaute).toBe(true);
    expect(CATEGORIES_NOTIF).toContain('communaute');
    expect(CATEGORIES_NOTIF.length).toBe(Object.keys(CATEGORIES_DEFAUT).length);
  });
});
