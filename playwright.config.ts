import { defineConfig, devices } from '@playwright/test';

/**
 * Chromium fourni par l'environnement, quand il y en a un.
 *
 * Les bacs à sable de CI préinstallent souvent un Chromium et interdisent
 * `playwright install` (pas de réseau sortant). Si son numéro de build ne
 * correspond pas à celui qu'attend la version de `@playwright/test`, Playwright
 * réclame un téléchargement impossible et TOUS les bancs échouent — sur un
 * défaut d'outillage qu'on lirait comme un défaut de produit.
 *
 * Renseigner `PLAYWRIGHT_CHROMIUM_PATH` pointe alors sur le binaire existant.
 * Non renseignée, la variable ne change rien : le chemin par défaut de
 * Playwright s'applique, sur le poste comme en CI.
 *
 * ⚠️ CHROMIUM UNIQUEMENT. Le projet `mobile` vise WebKit — c'est un iPhone,
 * donc Mobile Safari, et ce dépôt a un historique fourni de bugs qui n'y
 * existent QUE là (bottom-nav en dvh, overflow-hidden, AbortError). Lui passer
 * un binaire Chromium le fait planter au lancement, et le basculer sur
 * Chromium « pour que ça passe » supprimerait la seule couverture du
 * navigateur où cette application casse vraiment.
 */
const chromiumFourni = process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], launchOptions: { executablePath: chromiumFourni } },
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 14'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    // Le défaut de Playwright est 60 s. Insuffisant ici : au démarrage à FROID,
    // Nuxt compile 108 pages et 215 composants avant de répondre, et la CI part
    // toujours d'un cache vide. Sans cette valeur, les bancs de bout en bout
    // échouent sur « Timed out waiting from config.webServer » — un échec
    // d'infrastructure qu'on lirait comme un échec de test.
    timeout: 300_000,
    // ═══════════════════════════════════════════════════════════════════════
    // CEINTURE DE SÉCURITÉ — le serveur de test ne doit atteindre AUCUN
    // service réel. Le `.env` du poste porte la base de PRODUCTION.
    //
    // Ces valeurs gagnent sur le fichier : c12 (le chargeur de Nuxt) ne pose
    // une variable que si elle est absente de `process.env`. Les passer ici
    // est donc la seule façon fiable de neutraliser un `.env` local — et
    // c'est pourquoi on ne crée SURTOUT pas un `.env.e2e` de plus (le
    // .gitignore explique déjà pourquoi un fichier nommé « test » est un
    // piège dans ce dépôt).
    //
    // Le port 1 est réservé et refuse la connexion instantanément : une
    // requête qui échapperait à l'interception meurt en ECONNREFUSED au lieu
    // d'attendre un timeout. L'hôte Supabase ne résout pas, pour la même
    // raison. Les deux sont OBLIGATOIRES : @supabase/ssr lève une exception
    // si l'URL ou la clé est vide, et la page ne rendrait pas.
    // ═══════════════════════════════════════════════════════════════════════
    env: {
      DATABASE_URL: 'postgres://e2e:e2e@127.0.0.1:1/interdit',
      SUPABASE_URL: 'https://e2e.supabase.co',
      SUPABASE_KEY: 'e2e-anon-key',
      SUPABASE_SERVICE_KEY: 'e2e-service-key',
      NUXT_STRIPE_SECRET_KEY: 'sk_test_e2e',
      NUXT_CRON_SECRET: 'e2e-cron-secret',
      NODE_ENV: 'development',
    },
  },
});
