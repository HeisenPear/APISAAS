// ═══════════════════════════════════════════════════════════════════════════
// ENVOYER UNE FACTURE, C'EST L'ÉMETTRE — donc on ne le fait pas à l'aveugle.
//
// ─── CE QUI SE JOUAIT ICI ──────────────────────────────────────────────────
// `POST /api/finances/factures/<id>/email` ne se contente pas d'expédier un
// PDF : si la facture est un brouillon, elle lui attribue son NUMÉRO LÉGAL et
// la passe en « envoyée ». Le numéro de facture est à séquence continue
// (art. 242 nonies A du CGI) : le graver, c'est le consommer.
//
// Or la route le gravait sur un envoi dont elle ignorait le sort.
// `sendFactureAuClient` rendait `true` sans condition — le SDK Resend ne lève
// jamais d'exception, il rend `{ data, error }` — si bien que le
// `if (!ok) internalError(...)` ne se déclenchait QUE quand la clé d'API
// manquait. Domaine non vérifié, adresse rejetée, quota dépassé, 500 : la
// route répondait `sent: true`, écrivait le numéro, et l'écran affichait
// « Facture envoyée à … ».
//
// Le commentaire de la route promettait pourtant déjà l'inverse : « si l'email
// échoue, on ne brûle pas de numéro et la facture reste un brouillon
// modifiable ». C'était une intention, pas un comportement.
//
// ─── LES MUTATIONS QUI DOIVENT FAIRE ROUGIR ────────────────────────────────
//   · remplacer `if (!envoi.ok)` par `if (false)` dans la route ;
//   · retirer `emailDernierEchec` de l'écriture de refus ;
//   · rendre l'écriture de succès inconditionnelle (statut/numéro hors du
//     `facture.statut === 'brouillon'`).
// ═══════════════════════════════════════════════════════════════════════════

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { getTableName } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import { clients, profils, transactions } from '~~/server/database/schema';
import type { ResultatEnvoi } from '~~/server/utils/refusEnvoi';

// ─── Ce que l'envoi rendra, et ce que la route en fera ─────────────────────

let envoi: ResultatEnvoi;
/** Les envois RÉELLEMENT tentés — la route ne doit pas court-circuiter. */
let envoisTentes: Record<string, unknown>[];

vi.mock('~~/server/utils/email', () => ({
  sendFactureAuClient: async (opts: Record<string, unknown>) => {
    envoisTentes.push(opts);
    return envoi;
  },
}));

vi.mock('~~/server/utils/factureNumero', () => ({
  genererNumeroFacture: async () => 'FA-2026-0042',
}));

// ─── Le double de base : il ENREGISTRE ce qui part en écriture ─────────────

interface Ecriture {
  table: string;
  valeurs: Record<string, unknown>;
}
let ecritures: Ecriture[];
let facture: Record<string, unknown> | undefined;
let clientLigne: Record<string, unknown> | undefined;
/** Le profil de l'ÉMETTEUR — pilotable par cas depuis que le repli « APIGO » a disparu. */
let vendeur: Record<string, unknown> | undefined;
let echouerEcriture: boolean;

/**
 * ⚠️ LES NOMS DE TABLE SONT DÉRIVÉS DU SCHÉMA, pas écrits en dur. Un
 * `nom === 'transactions'` recopié ici survivrait à un renommage de la table :
 * le double rendrait alors une liste vide, la route répondrait « facture
 * introuvable », et les huit cas seraient « vérifiés » sur rien.
 */
function lignesPour(table: PgTable): Record<string, unknown>[] {
  const nom = getTableName(table);
  if (nom === getTableName(transactions)) return facture ? [facture] : [];
  if (nom === getTableName(clients)) return clientLigne ? [clientLigne] : [];
  if (nom === getTableName(profils)) return vendeur ? [vendeur] : [];
  throw new Error(`[banc] table non prévue par le double : ${nom}`);
}

const faussDb = {
  select: () => ({
    from: (table: PgTable) => ({
      where: () => ({
        limit: async () => lignesPour(table),
      }),
    }),
  }),
  update: (table: PgTable) => ({
    set: (valeurs: Record<string, unknown>) => ({
      where: async () => {
        if (echouerEcriture) throw new Error('base indisponible');
        ecritures.push({ table: getTableName(table), valeurs });
      },
    }),
  }),
};

// ─── Les auto-imports Nitro dont la route se sert ──────────────────────────

function poser() {
  envoisTentes = [];
  ecritures = [];
  echouerEcriture = false;
  envoi = { ok: true, messageId: 'msg_ok' };
  clientLigne = { email: 'client@exemple.fr' };
  vendeur = { nom: 'Dupont', prenom: 'Jean', nomCommercial: null, email: 'jean@exemple.fr' };
  facture = {
    id: 'f1',
    type: 'vente',
    statut: 'brouillon',
    numero: null,
    clientId: 'c1',
    total: '120.00',
  };

  Object.assign(globalThis, {
    defineEventHandler: (fn: unknown) => fn,
    requireAuth: async () => ({ email: 'jean@exemple.fr' }),
    assertCanWrite: async () => ({ ownerId: 'owner-1' }),
    getRouterParam: () => '3f1c9c1e-0000-4000-8000-000000000001',
    readValidatedBody: async (_e: unknown, parse: (v: unknown) => unknown) =>
      parse({ pdfBase64: 'data:application/pdf;base64,' + 'J'.repeat(200) }),
    uuidSchema: z.string().uuid(),
    db: faussDb,
    badRequest: (m: string) => {
      throw Object.assign(new Error(m), { statusCode: 400 });
    },
    notFound: (m: string) => {
      throw Object.assign(new Error(m), { statusCode: 404 });
    },
    badGateway: (m: string) => {
      throw Object.assign(new Error(m), { statusCode: 502 });
    },
    internalError: (m: string) => {
      throw Object.assign(new Error(m), { statusCode: 500 });
    },
  });
}

beforeEach(() => {
  poser();
  vi.resetModules();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

async function appeler(): Promise<{
  data?: Record<string, unknown>;
  erreur?: Error & { statusCode?: number };
}> {
  const module = await import('~~/server/api/finances/factures/[id]/email.post');
  const handler = module.default as unknown as (
    e: unknown,
  ) => Promise<{ data: Record<string, unknown> }>;
  try {
    return { data: (await handler({ context: {} })).data };
  } catch (e) {
    return { erreur: e as Error & { statusCode?: number } };
  }
}

/** Les valeurs écrites sur `transactions` (une seule écriture attendue). */
const ecrit = () => ecritures.find((e) => e.table === getTableName(transactions))?.valeurs;

describe('la facture n’est émise QUE si l’email est vraiment parti', () => {
  it('GARDE-FOU : un envoi accepté grave bien le numéro et la trace', async () => {
    // Sans ce cas, une route qui refuserait TOUT passerait pour un correctif —
    // « le balayage vide » de CLAUDE.md, transposé à une garde.
    const { data, erreur } = await appeler();
    expect(erreur).toBeUndefined();
    expect(envoisTentes, 'l’envoi a bien été tenté').toHaveLength(1);
    expect(data).toMatchObject({ sent: true, numero: 'FA-2026-0042' });
    expect(ecrit()).toMatchObject({
      statut: 'envoyee',
      numero: 'FA-2026-0042',
      emailMessageId: 'msg_ok',
      emailDernierEchec: null,
    });
    expect(ecrit()?.emailEnvoyeLe).toBeInstanceOf(Date);
  });

  it('LA RÈGLE : un refus n’écrit NI statut NI numéro', async () => {
    // Le défaut, dans sa forme exacte : Resend refuse, et la facture partait
    // quand même en « envoyée » avec son numéro légal consommé.
    envoi = { ok: false, code: 'invalid_from_address', technique: 'Domain not verified' };
    const { data, erreur } = await appeler();

    expect(data, 'la route ne doit pas répondre en succès').toBeUndefined();
    expect(erreur?.statusCode).toBe(502);
    expect(ecrit()).not.toHaveProperty('statut');
    expect(ecrit()).not.toHaveProperty('numero');
  });

  it('un refus laisse une TRACE lisible sur la facture', async () => {
    envoi = { ok: false, code: 'daily_quota_exceeded', technique: 'Quota exceeded' };
    await appeler();
    const trace = ecrit()?.emailDernierEchec;
    expect(typeof trace).toBe('string');
    expect(String(trace).length, 'une phrase, pas un code').toBeGreaterThan(40);
    expect(String(trace), 'jamais le code technique').not.toContain('daily_quota_exceeded');
  });

  it('le message rendu à l’écran est la PHRASE, pas le motif technique', async () => {
    // « Domain not verified » ne dit rien à un apiculteur, et le laisser
    // remonter le renverrait chercher l'erreur dans sa fiche client.
    envoi = { ok: false, code: 'validation_error', technique: 'Domain not verified' };
    const { erreur } = await appeler();
    expect(erreur?.message).not.toContain('Domain not verified');
    expect(erreur?.message).toMatch(/adresse email du client/i);
  });

  it('même si la trace ne peut pas s’écrire, la route REFUSE', async () => {
    // Perdre la trace est moins grave que laisser croire que c'est parti.
    envoi = { ok: false, code: 'application_error', technique: 'boom' };
    echouerEcriture = true;
    const { data, erreur } = await appeler();
    expect(data).toBeUndefined();
    expect(erreur?.statusCode).toBe(502);
  });
});

describe('ce que la route ne doit PAS toucher', () => {
  it('une facture déjà émise garde son statut et son numéro', async () => {
    // Renvoyer une facture au client (il l'a perdue) est légitime ; la
    // renuméroter ne l'est pas.
    facture = {
      id: 'f1',
      type: 'vente',
      statut: 'payee',
      numero: 'FA-2026-0007',
      clientId: 'c1',
      total: '120.00',
    };
    const { data } = await appeler();
    expect(data).toMatchObject({ numero: 'FA-2026-0007' });
    expect(ecrit()).not.toHaveProperty('statut');
    expect(ecrit()).not.toHaveProperty('numero');
    expect(ecrit()?.emailEnvoyeLe, 'la trace, elle, est bien posée').toBeInstanceOf(Date);
  });

  it('sans adresse email sur la fiche client, RIEN n’est tenté', async () => {
    clientLigne = { email: null };
    const { erreur } = await appeler();
    expect(erreur?.statusCode).toBe(400);
    expect(envoisTentes).toHaveLength(0);
    expect(ecritures).toHaveLength(0);
  });

  it('sans nom d’émetteur, RIEN n’est tenté — on n’invente pas de vendeur', async () => {
    /**
     * ⚠️ LE REPLI VALAIT `|| 'APIGO'`. Un compte au profil vide envoyait au
     * client un email intitulé « Votre facture FA-2026-0007 — APIGO », signé du
     * nom de l'ÉDITEUR du logiciel. Le client n'a jamais acheté à APIGO, et le
     * numéro légal était gravé au passage.
     */
    vendeur = { nom: null, prenom: null, nomCommercial: null, email: 'jean@exemple.fr' };
    const { erreur } = await appeler();
    expect(erreur?.statusCode).toBe(400);
    expect(erreur?.message, 'la sortie doit être nommée').toContain('Réglages');
    expect(envoisTentes).toHaveLength(0);
    expect(ecritures).toHaveLength(0);
  });

  it('le nom COMMERCIAL est celui que le client voit dans l’email', async () => {
    vendeur = {
      nom: 'Dupont',
      prenom: 'Maël',
      nomCommercial: 'Le Rucher de Maël',
      email: 'mael@exemple.fr',
    };
    await appeler();
    expect(envoisTentes[0]).toMatchObject({ vendeurNom: 'Le Rucher de Maël' });
  });

  it('une facture d’achat n’est pas envoyable', async () => {
    facture = { ...facture!, type: 'achat' };
    const { erreur } = await appeler();
    expect(erreur?.statusCode).toBe(400);
    expect(envoisTentes).toHaveLength(0);
  });
});
