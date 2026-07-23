import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function useStripe(): Stripe {
  if (!_stripe) {
    const config = useRuntimeConfig();
    if (!config.stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    _stripe = new Stripe(config.stripeSecretKey, {
      apiVersion: '2025-02-24.acacia',
    });
  }
  return _stripe;
}

/** Première valeur non vide parmi les candidates (ignore '' et undefined). */
function firstConfigured(...candidates: (string | undefined)[]): string | undefined {
  return candidates.find((v) => typeof v === 'string' && v.trim() !== '');
}

/**
 * Résout le Stripe price ID d'un plan pour une période donnée.
 * `billing` sélectionne le prix mensuel (défaut) ou annuel (−20 %).
 *
 * Tolérant au nommage des variables d'env : runtimeConfig
 * (NUXT_STRIPE_PRICE_*[_ANNUAL]) en priorité, puis les conventions
 * historiques NUXT_PRICE_*_MONTHLY / _YEARLY et NUXT_STRIPE_PRICE_*.
 * Évite qu'un prix pourtant configuré sous un autre nom soit ignoré.
 */
export function getPriceId(
  plan: 'starter' | 'pro' | 'expert',
  billing: 'mois' | 'an' = 'mois',
): string {
  const config = useRuntimeConfig();
  const KEY = plan.toUpperCase(); // STARTER | PRO | EXPERT
  const env = process.env;

  const monthly: Record<string, string | undefined> = {
    starter: firstConfigured(
      config.stripePriceStarter,
      env.NUXT_PRICE_STARTER_MONTHLY,
      env.NUXT_STRIPE_PRICE_STARTER,
    ),
    pro: firstConfigured(
      config.stripePricePro,
      env.NUXT_PRICE_PRO_MONTHLY,
      env.NUXT_STRIPE_PRICE_PRO,
    ),
    expert: firstConfigured(
      config.stripePriceExpert,
      env.NUXT_PRICE_EXPERT_MONTHLY,
      env.NUXT_STRIPE_PRICE_EXPERT,
    ),
  };
  const yearly: Record<string, string | undefined> = {
    starter: firstConfigured(
      config.stripePriceStarterAnnual,
      env.NUXT_PRICE_STARTER_YEARLY,
      env.NUXT_STRIPE_PRICE_STARTER_ANNUAL,
    ),
    pro: firstConfigured(
      config.stripePriceProAnnual,
      env.NUXT_PRICE_PRO_YEARLY,
      env.NUXT_STRIPE_PRICE_PRO_ANNUAL,
    ),
    expert: firstConfigured(
      config.stripePriceExpertAnnual,
      env.NUXT_PRICE_EXPERT_YEARLY,
      env.NUXT_STRIPE_PRICE_EXPERT_ANNUAL,
    ),
  };

  const priceId = billing === 'an' ? yearly[plan] : monthly[plan];
  if (!priceId) {
    throw new Error(`No Stripe price ID configured for plan: ${KEY} (${billing})`);
  }
  return priceId;
}

/**
 * Traduit une erreur de création de session Stripe en réponse propre.
 *
 * MOTIVATION : un `NUXT_STRIPE_PRICE_*` qui pointe un tarif dont le PRODUIT est
 * archivé (ou un identifiant périmé) fait échouer `checkout.sessions.create`
 * avec un `StripeInvalidRequestError`. Sans traitement, l'apiculteur reçoit un
 * 500 « Server Error » opaque, et personne ne sait que c'est une variable d'env
 * à corriger. C'est arrivé en vrai sur la formule Expert.
 *
 * Cette fonction est PURE et testable : on lui donne une erreur, elle rend un
 * `{ statusCode, messageClient, messageOps }` si elle sait la reconnaître, sinon
 * `null` (l'appelant relaie alors l'erreur telle quelle).
 *
 *  - `messageClient` : lisible, honnête, sans jargon — s'affiche à l'apiculteur.
 *  - `messageOps` : précis, avec l'identifiant fautif — part dans les logs.
 */
export function classifierErreurCheckout(
  err: unknown,
): { statusCode: number; messageClient: string; messageOps: string } | null {
  const e = err as { type?: string; code?: string; message?: string; param?: string } | null;
  if (!e || typeof e.message !== 'string') return null;

  const msg = e.message;
  const estRequeteInvalide =
    e.type === 'StripeInvalidRequestError' || e.code === 'resource_missing';

  // Produit archivé : le tarif existe mais sa vente est refusée.
  if (/product is not active|not available to be purchased/i.test(msg)) {
    return {
      statusCode: 422,
      messageClient:
        'Cette formule n’est pas disponible à la souscription pour le moment. ' +
        'Réessaie plus tard ou choisis-en une autre — je te tiens au courant dès que c’est réglé.',
      messageOps: `[stripe] tarif injouable (produit archivé) — vérifier NUXT_STRIPE_PRICE_* : ${msg}`,
    };
  }

  // Identifiant de tarif inexistant / révoqué.
  if (estRequeteInvalide && /no such price|resource_missing/i.test(`${msg} ${e.code ?? ''}`)) {
    return {
      statusCode: 422,
      messageClient:
        'Cette formule n’est pas disponible à la souscription pour le moment. ' +
        'Réessaie plus tard ou choisis-en une autre.',
      messageOps: `[stripe] identifiant de tarif inconnu — NUXT_STRIPE_PRICE_* périmé : ${msg}`,
    };
  }

  return null;
}
