// ═══════════════════════════════════════════════════════════════════════════
// stripe-plans — la traduction « ce que le client a payé » → « ce qu'il obtient ».
//
// Une seule fonction, quarante lignes, aucun banc. Et c'est elle que le webhook
// interroge pour décider du plan d'un abonné : `planFromPriceId(priceId)`.
//
// Son mode de défaillance est silencieux et coûteux. Si un identifiant de prix
// n'est pas reconnu, la fonction rend `null` — le webhook retombe alors sur
// `subscription.metadata.plan`, et si ce repli est vide lui aussi, l'abonnement
// n'est tout simplement PAS appliqué. Le client a payé, Stripe a encaissé, et
// l'apiculteur reste en Découverte. Rien ne lève d'erreur.
//
// Le cas le plus exposé est l'ANNUEL : les six identifiants (trois formules ×
// deux cycles) doivent tous être reconnus. Un oubli sur les annuels ne se voit
// qu'au premier client qui choisit ce cycle.
// ═══════════════════════════════════════════════════════════════════════════

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** Identifiants factices, de la forme que Stripe produit. */
const PRIX = {
  starterMensuel: 'price_starter_mensuel',
  starterAnnuel: 'price_starter_annuel',
  proMensuel: 'price_pro_mensuel',
  proAnnuel: 'price_pro_annuel',
  expertMensuel: 'price_expert_mensuel',
  expertAnnuel: 'price_expert_annuel',
};

function poserConfig(valeurs: Record<string, string> = {}) {
  Object.assign(globalThis, {
    useRuntimeConfig: () => ({
      stripePriceStarter: valeurs.starterMensuel ?? PRIX.starterMensuel,
      stripePriceStarterAnnual: valeurs.starterAnnuel ?? PRIX.starterAnnuel,
      stripePricePro: valeurs.proMensuel ?? PRIX.proMensuel,
      stripePriceProAnnual: valeurs.proAnnuel ?? PRIX.proAnnuel,
      stripePriceExpert: valeurs.expertMensuel ?? PRIX.expertMensuel,
      stripePriceExpertAnnual: valeurs.expertAnnuel ?? PRIX.expertAnnuel,
    }),
  });
}

beforeEach(() => poserConfig());
afterEach(() => vi.unstubAllEnvs());

describe('les six identifiants vendus sont reconnus', () => {
  const ATTENDU: [string, string][] = [
    [PRIX.starterMensuel, 'starter'],
    [PRIX.starterAnnuel, 'starter'],
    [PRIX.proMensuel, 'pro'],
    [PRIX.proAnnuel, 'pro'],
    [PRIX.expertMensuel, 'expert'],
    [PRIX.expertAnnuel, 'expert'],
  ];

  for (const [prix, plan] of ATTENDU) {
    it(`${prix} → ${plan}`, async () => {
      const { planFromPriceId } = await import('~~/server/utils/stripe-plans');
      expect(planFromPriceId(prix)).toBe(plan);
    });
  }

  it('les DEUX cycles mènent à la même formule', async () => {
    // Le cas le plus exposé : un oubli sur les annuels ne se voit qu'au premier
    // client qui choisit ce cycle — et il aura déjà payé.
    const { planFromPriceId } = await import('~~/server/utils/stripe-plans');
    for (const [mensuel, annuel] of [
      [PRIX.starterMensuel, PRIX.starterAnnuel],
      [PRIX.proMensuel, PRIX.proAnnuel],
      [PRIX.expertMensuel, PRIX.expertAnnuel],
    ]) {
      expect(planFromPriceId(annuel!), `annuel de ${mensuel}`).toBe(planFromPriceId(mensuel!));
    }
  });
});

describe('ce qui n’est pas reconnu', () => {
  it('rend null sur un identifiant inconnu', async () => {
    // `null` fait retomber le webhook sur `subscription.metadata.plan`. C'est un
    // repli VOULU — mais si ce repli est vide, l'abonnement n'est pas appliqué
    // du tout : le client a payé et reste en Découverte, sans qu'aucune erreur
    // ne soit levée.
    const { planFromPriceId } = await import('~~/server/utils/stripe-plans');
    expect(planFromPriceId('price_qui_nexiste_pas')).toBeNull();
  });

  it('ne confond pas une chaîne vide avec une formule', async () => {
    const { planFromPriceId } = await import('~~/server/utils/stripe-plans');
    expect(planFromPriceId('')).toBeNull();
  });

  it('n’invente rien quand la configuration est vide', async () => {
    // Déploiement mal configuré : aucun prix renseigné. La fonction doit rendre
    // `null` partout plutôt que d'attribuer une formule par défaut — accorder
    // Expert à un identifiant inconnu serait pire que ne rien accorder.
    poserConfig({
      starterMensuel: '',
      starterAnnuel: '',
      proMensuel: '',
      proAnnuel: '',
      expertMensuel: '',
      expertAnnuel: '',
    });
    vi.resetModules();
    const { planFromPriceId } = await import('~~/server/utils/stripe-plans');
    expect(planFromPriceId(PRIX.proMensuel)).toBeNull();
  });
});

describe('les variables d’environnement de compatibilité', () => {
  it('sont encore honorées quand la configuration ne porte rien', async () => {
    // Le module accepte d'anciens noms (`NUXT_PRICE_PRO_MONTHLY`…). Ce banc les
    // documente : ils existent pour ne pas casser un déploiement dont les
    // variables datent d'avant la centralisation dans `runtimeConfig`.
    poserConfig({ proMensuel: '' });
    vi.stubEnv('NUXT_PRICE_PRO_MONTHLY', 'price_ancien_pro');
    vi.resetModules();

    const { planFromPriceId } = await import('~~/server/utils/stripe-plans');
    expect(planFromPriceId('price_ancien_pro')).toBe('pro');
  });

  it('PRENNENT le pas sur la configuration courante — et c’est un risque', async () => {
    // ─── COMPORTEMENT RÉEL, DOCUMENTÉ PARCE QU'IL SURPREND ──────────────
    // `buildPriceToPlan` ajoute les variables héritées APRÈS celles de
    // `runtimeConfig`. Sur une même clé, la dernière écriture gagne : une
    // ancienne variable d'environnement écrase donc la configuration actuelle.
    //
    // Conséquence concrète : si `NUXT_STRIPE_PRICE_STARTER` traîne encore dans
    // l'environnement Vercel avec l'identifiant devenu celui d'Expert, un
    // client qui paie Expert est enregistré en Starter. Il paie le prix fort et
    // reçoit moins — sans erreur, sans log, sans rien.
    //
    // Ce banc ne juge pas : il FIGE le comportement pour qu'un changement d'ordre
    // se voie. Le risque, lui, est signalé à part — il se règle en nettoyant
    // l'environnement, pas en réécrivant cette fonction à l'aveugle.
    poserConfig();
    vi.stubEnv('NUXT_STRIPE_PRICE_STARTER', PRIX.expertMensuel);
    vi.resetModules();

    const { planFromPriceId } = await import('~~/server/utils/stripe-plans');
    expect(planFromPriceId(PRIX.expertMensuel)).toBe('starter');
  });
});
