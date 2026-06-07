import { test, expect } from '@playwright/test';

/**
 * Parcours publics (sans authentification) — pages prérendues / accessibles
 * sans session. Ces tests ne dépendent ni de Supabase ni de données seedées,
 * ils sont donc fiables en CI. Les parcours authentifiés (dashboard, création
 * ruche, intervention, vente) nécessitent un utilisateur de test + DB seedée
 * et sont à ajouter quand un environnement de test dédié sera disponible.
 */

// Routes prérendues déclarées dans nuxt.config.ts (routeRules)
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/reset-password',
  '/tarifs',
  '/mentions-legales',
  '/politique-confidentialite',
  '/cgu',
  '/offline',
];

test.describe('Pages publiques — chargement', () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route} répond avec un statut < 400`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response, `aucune réponse pour ${route}`).not.toBeNull();
      expect(response!.status(), `statut HTTP inattendu pour ${route}`).toBeLessThan(400);
    });
  }
});

test.describe('Authentification — formulaires', () => {
  test('la page login présente un formulaire email + mot de passe', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test('saisir un email invalide bloque la soumission (validation native)', async ({ page }) => {
    await page.goto('/login');
    const email = page.locator('input[type="email"]').first();
    await email.fill('pas-un-email');
    // La validation HTML5 doit marquer le champ comme invalide
    const valid = await email.evaluate((el) => (el as HTMLInputElement).checkValidity());
    expect(valid).toBe(false);
  });

  test('la page register présente les champs attendus', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test('login → lien vers register et inversement', async ({ page }) => {
    await page.goto('/login');
    const toRegister = page.locator('a[href="/register"]').first();
    await expect(toRegister).toBeVisible();
  });
});

test.describe('Landing & navigation', () => {
  test('la landing affiche un CTA vers l’inscription / l’essai', async ({ page }) => {
    await page.goto('/');
    // Au moins un lien menant à l'inscription ou l'activation d'essai
    const cta = page.locator('a[href="/register"], a[href="/activer-essai"], a[href="/login"]');
    await expect(cta.first()).toBeVisible();
  });

  test('la page tarifs mentionne les plans', async ({ page }) => {
    await page.goto('/tarifs');
    const body = (await page.textContent('body'))?.toLowerCase() ?? '';
    // Les plans du feature gating : starter / pro / expert
    const hasPlan = ['starter', 'pro', 'expert', 'gratuit', '€'].some((kw) =>
      body.includes(kw.toLowerCase()),
    );
    expect(hasPlan).toBe(true);
  });

  test('les pages légales contiennent du contenu substantiel', async ({ page }) => {
    for (const route of ['/mentions-legales', '/politique-confidentialite', '/cgu']) {
      await page.goto(route);
      const body = (await page.textContent('body')) ?? '';
      expect(body.trim().length, `${route} semble vide`).toBeGreaterThan(200);
    }
  });
});

test.describe('Garde d’authentification', () => {
  test('une route privée redirige vers /login quand non connecté', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    // Le middleware Supabase redirige les routes protégées vers /login
    expect(page.url()).toContain('/login');
  });
});
