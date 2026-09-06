// ═══════════════════════════════════════════════════════════════════════════
// ACCÈS AUX PAGES PRIVÉES SANS SESSION.
//
// Cette maj a beaucoup touché à l'authentification : redirection SSR du module
// Supabase désactivée parce qu'elle était peu fiable, profil qu'on n'efface
// plus sur une erreur transitoire, session restaurée au démarrage à froid,
// paiement Stripe préservé au retour dans l'onboarding. Chacun de ces
// correctifs a déplacé la frontière entre « connecté » et « pas connecté ».
//
// Ce que ces bancs vérifient est modeste et non négociable : un visiteur SANS
// session qui ouvre une page privée doit ARRIVER QUELQUE PART. Pas un écran
// blanc, pas une erreur serveur, pas une boucle de redirection — trois pannes
// que ce dépôt a déjà connues (« PWA auth redirect loop », « bots 404 Pinia
// crash », « le rucher masqué par une pagination silencieuse »).
//
// Aucune donnée n'est simulée : le serveur de test n'atteint AUCUN service
// réel (cf. la ceinture dans playwright.config.ts). C'est précisément la
// situation à couvrir — la couche d'auth doit se comporter proprement même
// quand rien derrière elle ne répond.
// ═══════════════════════════════════════════════════════════════════════════

import { test, expect } from '@playwright/test';

/** Les surfaces privées introduites ou remaniées par cette mise à jour. */
const PAGES_PRIVEES = [
  { chemin: '/dashboard', nom: 'tableau de bord à widgets' },
  { chemin: '/copilote', nom: 'page Maya' },
  { chemin: '/onboarding', nom: 'onboarding cinématique' },
  { chemin: '/ruches', nom: 'cheptel' },
  { chemin: '/production/tracabilite', nom: 'traçabilité des lots' },
  { chemin: '/transhumance/emplacements', nom: 'emplacements' },
  { chemin: '/parametres/abonnement', nom: 'abonnement' },
];

test.describe('pages privées sans session', () => {
  for (const { chemin, nom } of PAGES_PRIVEES) {
    test(`${nom} (${chemin}) ne casse pas et mène quelque part`, async ({ page }) => {
      const reponse = await page.goto(chemin);

      // Aucune 5xx : une page privée visitée sans session est un cas NORMAL,
      // pas une panne serveur. C'est aussi ce que voient les robots.
      expect(reponse, 'aucune réponse').not.toBeNull();
      expect(reponse!.status(), `${chemin} a répondu ${reponse!.status()}`).toBeLessThan(500);

      // PAS `networkidle` : en mode dev, Vite sert plus de mille modules en
      // requêtes séparées et le réseau ne se tait jamais — mesuré à 1080 sur
      // /dashboard. Le banc échouerait sur l'outillage, pas sur le produit.
      // On attend le signal qui a du sens : le routeur s'est posé.
      await page.waitForLoadState('domcontentloaded');
      await expect
        .poll(() => page.url(), { timeout: 15_000, message: 'le routeur ne se pose pas' })
        .not.toBe('about:blank');

      // On n'exige PAS une destination précise — /login, la page d'accueil ou
      // la page elle-même en état vide sont toutes des réponses défendables.
      // On exige qu'il y ait quelque chose à lire, et pas une page nue.
      const corps = (await page.textContent('body')) ?? '';
      expect(corps.trim().length, `${chemin} rend une page vide`).toBeGreaterThan(50);
    });
  }

  test('n’entre pas dans une boucle de redirection', async ({ page }) => {
    // La panne historique de ce dépôt : le service worker et le garde d'auth
    // se renvoyaient la balle. On compte les navigations réellement engagées.
    const navigations: string[] = [];
    page.on('framenavigated', (f) => {
      if (f === page.mainFrame()) navigations.push(new URL(f.url()).pathname);
    });

    await page.goto('/dashboard');
    await page.waitForURL(/\/login/, { timeout: 15_000 });

    // Un aller simple, ou un renvoi vers la connexion : deux ou trois étapes.
    // Au-delà, c'est que ça tourne.
    expect(
      navigations.length,
      `chaîne de navigation : ${navigations.join(' → ')}`,
    ).toBeLessThanOrEqual(4);
  });

  test('renvoie vers la connexion EN GARDANT la destination', async ({ page }) => {
    // Mesuré : /dashboard mène à /login?redirect=/dashboard. Sans ce paramètre,
    // l'apiculteur qui se connecte retombe sur l'accueil et doit refaire son
    // chemin — c'est le genre de perte que personne ne signale mais que tout
    // le monde subit.
    await page.goto('/dashboard');
    await page.waitForURL(/\/login/, { timeout: 15_000 });
    expect(new URL(page.url()).searchParams.get('redirect')).toBe('/dashboard');
  });

  test('la page de connexion s’affiche et propose de saisir ses identifiants', async ({ page }) => {
    // Le bout du parcours : si la redirection marche mais que /login est
    // cassée, l'apiculteur est tout aussi bloqué.
    await page.goto('/login');
    await expect(page.getByRole('textbox').first()).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });
});

test.describe('surfaces publiques remaniées', () => {
  // Ces pages sont visitées par des inconnus et par les moteurs. Elles n'ont
  // pas de session, donc rien ne les empêche d'être couvertes ici.
  const PAGES_PUBLIQUES = ['/fonctionnalites', '/outils', '/tarifs', '/guide'];

  for (const chemin of PAGES_PUBLIQUES) {
    test(`${chemin} répond et rend du contenu`, async ({ page }) => {
      const reponse = await page.goto(chemin);
      expect(reponse!.status(), `${chemin} a répondu ${reponse!.status()}`).toBeLessThan(400);

      const corps = (await page.textContent('body')) ?? '';
      expect(corps.trim().length, `${chemin} rend une page vide`).toBeGreaterThan(200);
    });
  }

  test('la page tarifs annonce les trois formules payantes', async ({ page }) => {
    // Le catalogue est la source de vérité du gating : si la page tarifs ne
    // les nomme plus, c'est que quelque chose a dérivé entre config et vitrine.
    await page.goto('/tarifs');
    for (const formule of ['Starter', 'Pro', 'Expert']) {
      await expect(page.getByText(formule, { exact: false }).first()).toBeVisible();
    }
  });
});
