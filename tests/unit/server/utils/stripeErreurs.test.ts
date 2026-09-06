import { describe, expect, it } from 'vitest';
import { classifierErreurCheckout } from '../../../../server/utils/stripe';

// ═══════════════════════════════════════════════════════════════════════════
// Le bug vécu : `NUXT_STRIPE_PRICE_EXPERT` pointait un tarif dont le produit
// était archivé → 500 opaque au clic de l'apiculteur. Ces tests garantissent
// qu'une telle erreur est désormais traduite en réponse claire et actionnable.
// ═══════════════════════════════════════════════════════════════════════════

describe('classifierErreurCheckout', () => {
  it('reconnaît un produit archivé et le rend actionnable', () => {
    const err = {
      type: 'StripeInvalidRequestError',
      message:
        'Price `price_1T677I2f9YWjRVDEbXQvYMWt` is not available to be purchased because its product is not active.',
    };
    const r = classifierErreurCheckout(err)!;
    expect(r.statusCode).toBe(422);
    // Message apiculteur : lisible, sans identifiant technique.
    expect(r.messageClient).not.toMatch(/price_|product|Stripe/);
    expect(r.messageClient.length).toBeGreaterThan(20);
    // Message ops : précis, avec l'indice de correction et l'identifiant fautif.
    expect(r.messageOps).toMatch(/NUXT_STRIPE_PRICE/);
    expect(r.messageOps).toMatch(/price_1T677I/);
  });

  it('reconnaît un identifiant de tarif inexistant', () => {
    const err = {
      type: 'StripeInvalidRequestError',
      code: 'resource_missing',
      message: 'No such price: price_perime',
    };
    const r = classifierErreurCheckout(err)!;
    expect(r.statusCode).toBe(422);
    expect(r.messageOps).toMatch(/périmé|NUXT_STRIPE_PRICE/);
  });

  it('laisse passer ce qu’elle ne connaît pas (retourne null)', () => {
    // Panne réseau Stripe, carte refusée… ne doivent PAS devenir un 422 trompeur :
    // l'appelant relaie l'erreur d'origine.
    expect(
      classifierErreurCheckout({ type: 'StripeConnectionError', message: 'network down' }),
    ).toBeNull();
    expect(classifierErreurCheckout(new Error('boom'))).toBeNull();
    expect(classifierErreurCheckout(null)).toBeNull();
    expect(classifierErreurCheckout(undefined)).toBeNull();
    expect(classifierErreurCheckout({})).toBeNull();
  });

  it('ne prétend jamais que la faute vient de l’apiculteur', () => {
    const err = {
      type: 'StripeInvalidRequestError',
      message: 'its product is not active',
    };
    const r = classifierErreurCheckout(err)!;
    // On n'accuse pas l'utilisateur : c'est une config à corriger côté APIGO.
    expect(r.messageClient).not.toMatch(/votre|ta carte|refus|erreur de saisie/i);
  });
});
