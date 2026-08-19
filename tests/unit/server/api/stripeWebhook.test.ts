// ═══════════════════════════════════════════════════════════════════════════
// WEBHOOK STRIPE — le seul endroit où un paiement devient un droit d'usage.
//
// 288 lignes, 0 % de couverture, et tout le chiffre d'affaires passe par là.
// Ses défaillances ne se voient JAMAIS dans les logs applicatifs : Stripe
// encaisse, le webhook se trompe, et c'est l'apiculteur qui découvre au bout
// de trois jours qu'il paie Expert en étant resté en Découverte.
//
// ─── LE CHOIX PRODUIT QUE CE BANC VERROUILLE ──────────────────────────────
// Quand un prélèvement échoue, Stripe passe l'abonnement en `past_due` et
// relance la carte deux à trois semaines, puis en `unpaid` quand il abandonne.
//
// La décision retenue : on ne touche à rien en `past_due`, on rétrograde en
// `unpaid`. Une carte expirée ne doit pas couper son rucher à un apiculteur qui
// réglera dès la première relance ; un abonnement qui ne se paie plus du tout
// ne doit pas rester ouvert indéfiniment.
//
// Les deux moitiés sont testées. Verrouiller seulement la seconde laisserait
// quelqu'un « corriger » la première en croyant fermer une fuite, et couper
// l'accès à un client fidèle dont la banque a simplement refusé une fois.
// ═══════════════════════════════════════════════════════════════════════════

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createError } from 'h3';

// Ces trois-là sont importés EXPLICITEMENT par le webhook (pas des auto-imports
// Nuxt) : un double posé sur `globalThis` ne les atteindrait pas. Le vrai
// `useStripe` lève « STRIPE_SECRET_KEY is not configured » à l'import — c'est
// ainsi que la première version de ce banc a échoué, sur six cas d'un coup.
vi.mock('~~/server/utils/stripe', () => ({
  useStripe: () => (globalThis as { useStripe: () => unknown }).useStripe(),
}));
vi.mock('~~/server/utils/posthog', () => ({
  useServerPostHog: () => (globalThis as { useServerPostHog: () => unknown }).useServerPostHog(),
}));
vi.mock('~~/server/utils/stripe-plans', () => ({
  planFromPriceId: () => null,
}));

const UTILISATEUR = '11111111-1111-1111-1111-111111111111';

/** Ce que le webhook a écrit : mises à jour de profil et alertes insérées. */
interface Trace {
  majProfil: Record<string, unknown>[];
  alertes: Record<string, unknown>[];
  evenements: string[];
}
let trace: Trace;

/** Événement Stripe courant, rendu par la vérification de signature. */
let evenementStripe: unknown;
/** La signature est-elle acceptée ? */
let signatureValide: boolean;
/** Corps brut reçu — `null` simule une requête sans corps. */
let corpsBrut: string | null;
/** En-tête `stripe-signature` — `undefined` simule son absence. */
let entetesSignature: string | undefined;
/** Statut de réponse posé par le handler. */
let statutReponse: number | null;

function poser() {
  trace = { majProfil: [], alertes: [], evenements: [] };
  signatureValide = true;
  corpsBrut = '{}';
  entetesSignature = 'sig_test';
  statutReponse = null;

  const chaineUpdate = {
    set(valeurs: Record<string, unknown>) {
      trace.majProfil.push(valeurs);
      return { where: () => Promise.resolve() };
    },
  };

  Object.assign(globalThis, {
    createError,
    defineEventHandler: (fn: unknown) => fn,
    readRawBody: async () => corpsBrut,
    getHeader: () => entetesSignature,
    setResponseStatus: (_e: unknown, code: number) => {
      statutReponse = code;
    },
    useRuntimeConfig: () => ({ stripeWebhookSecret: 'whsec_test' }),
    useStripe: () => ({
      webhooks: {
        constructEvent: () => {
          if (!signatureValide) throw new Error('signature invalide');
          return evenementStripe;
        },
      },
      subscriptions: { cancel: async () => null },
    }),
    useServerPostHog: () => ({
      capture: ({ event }: { event: string }) => trace.evenements.push(event),
    }),
    db: {
      update: () => chaineUpdate,
      insert: () => ({
        values: (v: Record<string, unknown>) => {
          trace.alertes.push(v);
          return { onConflictDoNothing: () => Promise.resolve() };
        },
      }),
      select: () => ({
        from: () => ({ where: () => ({ limit: () => Promise.resolve([]) }) }),
      }),
      query: { profils: { findFirst: async () => ({ createdAt: new Date('2026-01-01') }) } },
    },
  });
}

/** Fabrique un événement `customer.subscription.updated` d'un statut donné. */
function abonnement(status: string, extra: Record<string, unknown> = {}) {
  return {
    type: 'customer.subscription.updated',
    created: 1_700_000_000,
    data: {
      object: {
        status,
        metadata: { userId: UTILISATEUR, plan: 'pro' },
        items: { data: [{ price: { id: 'price_inconnu' } }] },
        ...extra,
      },
    },
  };
}

async function livrer(evenement: unknown) {
  evenementStripe = evenement;
  const module = await import('~~/server/api/stripe/webhook.post');
  const handler = module.default as unknown as (e: unknown) => Promise<unknown>;
  return handler({ context: {}, node: { req: {}, res: {} } });
}

beforeEach(() => {
  poser();
  vi.resetModules();
});

describe('la signature fait foi', () => {
  it('refuse une signature invalide, sans rien écrire', async () => {
    // C'est la seule barrière : sans elle, n'importe qui peut s'offrir Expert
    // en postant un faux événement sur l'URL du webhook, qui est publique.
    signatureValide = false;
    const reponse = await livrer(abonnement('active'));

    expect(statutReponse).toBe(400);
    expect(reponse).toMatchObject({ error: 'Invalid signature' });
    expect(trace.majProfil, 'aucune écriture sur signature refusée').toEqual([]);
  });

  it('refuse une requête sans corps', async () => {
    corpsBrut = null;
    await livrer(abonnement('active'));
    expect(statutReponse).toBe(400);
    expect(trace.majProfil).toEqual([]);
  });

  it('refuse une requête sans en-tête de signature', async () => {
    entetesSignature = undefined;
    await livrer(abonnement('active'));
    expect(statutReponse).toBe(400);
    expect(trace.majProfil).toEqual([]);
  });
});

describe('échec de paiement — les deux moitiés du choix', () => {
  it('`past_due` ne touche à RIEN : Stripe relance encore', async () => {
    // LA moitié qu'on oublie de tester. Une carte expirée ne doit pas couper
    // son rucher à un apiculteur qui réglera dès la première relance. Il est
    // prévenu par l'alerte d'`invoice.payment_failed` et garde tout pendant
    // qu'il corrige.
    //
    // Sans ce banc, quelqu'un « fermerait la fuite » en rétrogradant dès le
    // premier échec, et couperait l'accès à un client fidèle.
    await livrer(abonnement('past_due'));

    expect(trace.majProfil, 'aucune modification de formule en past_due').toEqual([]);
    expect(trace.alertes).toEqual([]);
  });

  it('`unpaid` rétrograde : Stripe a épuisé ses relances', async () => {
    await livrer(abonnement('unpaid'));

    expect(trace.majProfil).toHaveLength(1);
    expect(trace.majProfil[0]).toMatchObject({ plan: 'decouverte', trialActive: false });
  });

  it('`unpaid` conserve l’abonnement Stripe — le retour reste possible', async () => {
    // Contrairement à `deleted`, on ne vide PAS `stripeSubscriptionId` :
    // l'abonnement existe toujours chez Stripe et reprend si le client met sa
    // carte à jour. L'effacer couperait ce retour en arrière.
    await livrer(abonnement('unpaid'));

    expect(trace.majProfil[0]).not.toHaveProperty('stripeSubscriptionId');
  });

  it('`unpaid` explique et donne la sortie', async () => {
    // Jamais de blocage sans porte de sortie.
    await livrer(abonnement('unpaid'));

    expect(trace.alertes).toHaveLength(1);
    expect(trace.alertes[0]).toMatchObject({
      userId: UTILISATEUR,
      priorite: 'critique',
      actionUrl: '/parametres/abonnement',
    });
    expect(String(trace.alertes[0]?.message)).toMatch(/préservées/i);
  });
});

describe('transitions ordinaires', () => {
  it('`active` applique la formule et clôt l’essai', async () => {
    await livrer(abonnement('active'));

    expect(trace.majProfil).toHaveLength(1);
    expect(trace.majProfil[0]).toMatchObject({ plan: 'pro', trialActive: false });
  });

  it('`trialing` ouvre l’essai et le marque consommé', async () => {
    // `trialUsed` empêche un second essai gratuit. Sans lui, il suffit
    // d'annuler et de recommencer pour ne jamais payer.
    await livrer(abonnement('trialing', { trial_end: 1_700_100_000 }));

    expect(trace.majProfil[0]).toMatchObject({
      plan: 'pro',
      trialActive: true,
      trialUsed: true,
    });
  });

  it('`deleted` rétrograde ET détache l’abonnement', async () => {
    await livrer({
      type: 'customer.subscription.deleted',
      created: 1_700_000_000,
      data: { object: { metadata: { userId: UTILISATEUR } } },
    });

    expect(trace.majProfil[0]).toMatchObject({
      plan: 'decouverte',
      stripeSubscriptionId: null,
      trialActive: false,
    });
    expect(trace.alertes).toHaveLength(1);
  });

  it('ignore un événement sans identifiant d’utilisateur', async () => {
    // Métadonnée manquante : on ne devine pas à qui appartient l'abonnement.
    // Écrire au hasard serait pire que ne rien faire.
    await livrer({
      type: 'customer.subscription.updated',
      created: 1_700_000_000,
      data: { object: { status: 'unpaid', metadata: {} } },
    });

    expect(trace.majProfil).toEqual([]);
  });
});

describe('protection contre les webhooks en désordre', () => {
  it('chaque écriture de profil borne le prochain événement', async () => {
    // Stripe ne garantit pas l'ordre de livraison. Un `updated` arrivé en
    // retard écraserait un état plus récent. La parade est un `WHERE` atomique
    // qui n'applique que si l'événement est postérieur au dernier vu — et il ne
    // fonctionne QUE si chaque écriture repose `lastStripeEventAt`.
    await livrer(abonnement('active'));

    expect(trace.majProfil[0]).toHaveProperty('lastStripeEventAt');
    expect(trace.majProfil[0]?.lastStripeEventAt).toBeInstanceOf(Date);
    // L'horodatage vient de l'ÉVÉNEMENT, pas de l'horloge du serveur : sinon
    // deux webhooks traités dans la même seconde deviendraient indiscernables.
    expect((trace.majProfil[0]?.lastStripeEventAt as Date).getTime()).toBe(1_700_000_000 * 1000);
  });
});
