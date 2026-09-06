// ═══════════════════════════════════════════════════════════════════════════
// FERMER UNE BANNIÈRE NE DOIT PAS EFFACER UN SOLDE DE TRÉSORERIE.
//
// ─── CE QUI SE JOUAIT ICI ──────────────────────────────────────────────────
// `PUT /api/profils/me` faisait `.set({ ...body })` : le blob jsonb
// `preferences` envoyé par le navigateur REMPLAÇAIT celui de la base, en
// entier.
//
// Or ce blob-là vient d'un instantané restauré SYNCHRONEMENT depuis
// `localStorage` à la création du magasin d'authentification, et il n'est
// presque jamais rafraîchi : le plugin de persistance ne relit le profil que
// `si (session && !profil)` — or il n'est justement pas nul, puisqu'il vient
// d'être restauré. Dans un onglet resté ouvert plusieurs jours, l'instantané a
// plusieurs jours.
//
// Pendant ce temps, le SERVEUR écrit dans le même blob sans que le client le
// sache : abonnements push, solde de départ de trésorerie, marqueur d'e-mail de
// bienvenue, marqueurs de campagnes déjà envoyées.
//
// Conséquence : fermer une bannière d'accueil dans le vieil onglet rembobinait
// TOUT. L'écran de trésorerie redemandait un solde déjà saisi ; un e-mail de
// bienvenue repartait une seconde fois.
//
// ⚠️ LE DÉPÔT CONNAISSAIT DÉJÀ LE PIÈGE. `webPush.ts` l'évite côté serveur par
// un `jsonb_set` chirurgical, et son commentaire le nomme : « ce qui clobbait
// un abonnement ou une préférence écrits en parallèle ». C'est le chemin
// CLIENT qui restait ouvert — et c'est celui que tous les écrans empruntent.
//
// ─── LES MUTATIONS QUI DOIVENT FAIRE ROUGIR ────────────────────────────────
//   · rétablir `.set({ ...body })` sans la fusion ;
//   · fusionner aussi quand `preferences` vaut `null` (le geste « efface
//     tout » deviendrait impossible).
// ═══════════════════════════════════════════════════════════════════════════

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getTableName } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import { profils } from '~~/server/database/schema';

/** Ce que la base contient AVANT l'appel — dont des clés écrites par le serveur. */
let enBase: Record<string, unknown>;
/** Ce qui part réellement en écriture. */
let ecrit: Record<string, unknown> | undefined;

const faussDb = {
  select: () => ({
    from: (_t: PgTable) => ({
      where: () => ({
        limit: async () => [{ preferences: enBase }],
      }),
    }),
  }),
  update: (table: PgTable) => ({
    set: (valeurs: Record<string, unknown>) => ({
      where: () => ({
        returning: async () => {
          expect(getTableName(table)).toBe(getTableName(profils));
          ecrit = valeurs;
          return [{ id: 'p1', ...valeurs }];
        },
      }),
    }),
  }),
};

let corps: Record<string, unknown>;

beforeEach(() => {
  ecrit = undefined;
  corps = {};
  enBase = {
    // Écrites par le SERVEUR, que le navigateur n'a jamais vues.
    tresorerieSoldeDepart: 4250.5,
    welcomeEmailEnvoye: true,
    webPushSubscriptions: [{ endpoint: 'https://push.example/abc' }],
    // Écrite par le client, il y a longtemps.
    tutorialsCompleted: ['premiers_pas'],
  };
  vi.resetModules();
  Object.assign(globalThis, {
    defineEventHandler: (fn: unknown) => fn,
    requireAuth: async () => ({ id: 'p1' }),
    readValidatedBody: async (_e: unknown, parse: (v: unknown) => unknown) => parse(corps),
    db: faussDb,
    notFound: (m: string) => {
      throw Object.assign(new Error(m), { statusCode: 404 });
    },
  });
});

async function appeler() {
  const mod = await import('~~/server/api/profils/me.put');
  const handler = mod.default as unknown as (e: unknown) => Promise<unknown>;
  return handler({ context: {} });
}

describe('les préférences se fusionnent, elles ne s’écrasent pas', () => {
  it('GARDE-FOU : une écriture ordinaire passe bien', async () => {
    // Sans ce cas, une route qui refuserait tout passerait pour un correctif.
    corps = { nom: 'Dupont' };
    await appeler();
    expect(ecrit?.nom).toBe('Dupont');
    expect(ecrit?.updatedAt).toBeInstanceOf(Date);
  });

  it('LA RÈGLE : un instantané périmé n’efface pas ce que le serveur a écrit', async () => {
    /**
     * Le scénario exact : un onglet ouvert depuis des jours ferme la bannière
     * d'accueil. Il renvoie le blob qu'il connaissait — sans le solde de
     * trésorerie ni le marqueur d'e-mail, écrits depuis.
     */
    corps = {
      preferences: {
        tutorialsCompleted: ['premiers_pas'],
        welcomeBannerDismissed: true,
      },
    };
    await appeler();
    const prefs = ecrit?.preferences as Record<string, unknown>;

    expect(prefs.welcomeBannerDismissed, 'ce que le client voulait écrire').toBe(true);
    expect(prefs.tresorerieSoldeDepart, 'un solde saisi ne se perd pas').toBe(4250.5);
    expect(prefs.welcomeEmailEnvoye, 'sinon l’e-mail de bienvenue repart').toBe(true);
    expect(prefs.webPushSubscriptions, 'ni les abonnements push').toEqual([
      { endpoint: 'https://push.example/abc' },
    ]);
  });

  it('le client garde le dernier mot sur les clés qu’il envoie', async () => {
    // La fusion n'est pas une lecture seule : ce que le client écrit gagne.
    corps = { preferences: { tutorialsCompleted: ['premiers_pas', 'production'] } };
    await appeler();
    expect((ecrit?.preferences as Record<string, unknown>).tutorialsCompleted).toEqual([
      'premiers_pas',
      'production',
    ]);
  });

  it('`null` reste un geste explicite : il efface', async () => {
    // Il faut qu'un « remets tout à zéro » demeure possible. Aucun écran ne
    // l'envoie aujourd'hui — d'où le commentaire dans la route, qui dit que
    // cette branche est un contrat, pas un usage.
    corps = { preferences: null };
    await appeler();
    expect(ecrit?.preferences).toBeNull();
  });

  it('sans `preferences` dans le corps, la colonne n’est pas touchée', async () => {
    corps = { telephone: '0600000000' };
    await appeler();
    expect(ecrit).not.toHaveProperty('preferences');
  });
});
