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

/**
 * Cible des bancs. Vide (le cas normal) → serveur de dev local, démarré et
 * neutralisé par le bloc `webServer` plus bas.
 *
 * Renseignée avec l'URL d'un preview Vercel, les MÊMES specs s'exécutent contre
 * le déploiement réel — c'est ce qui permet de vérifier ce que le build produit
 * vraiment, et pas seulement ce que le dev server rend. Deux défauts de ce lot
 * n'étaient visibles que là : neuf pages privées servies en fichier statique,
 * et une page du sitemap interdite aux robots.
 *
 * ⚠️ À CONNAÎTRE : un preview Vercel tape la base de PRODUCTION (vérifié —
 * `/api/public/demo/slots` y renvoie les vrais créneaux). Une spec authentifiée
 * lancée contre lui écrit donc dans les vraies données. C'est la raison pour
 * laquelle les bancs authentifiés ne créent que des objets préfixés et les
 * suppriment, et pourquoi ils ne tournent jamais en CI.
 */
const cibleExterne = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: cibleExterne ?? 'http://localhost:3000',
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
  // Contre une cible externe, il n'y a RIEN à démarrer. Sans cette condition,
  // Playwright lancerait un serveur de dev complet (jusqu'à 300 s de compilation)
  // que pas une seule requête n'atteindrait.
  webServer: cibleExterne
    ? undefined
    : {
        // ═══════════════════════════════════════════════════════════════════
        // ON TESTE LE BUILD, PAS LE SERVEUR DE DEV.
        //
        // `npm run dev` a été essayé et écarté sur preuve : il MEURT en cours
        // de série. Cinq bancs sont tombés sur `ERR_CONNECTION_REFUSED` et des
        // délais dépassés après ~4 minutes — Nuxt recompile à la demande
        // pendant que Playwright tape en parallèle, et le processus ne tient
        // pas. Un échec d'infrastructure qu'on lirait comme un échec produit.
        //
        // Le serveur construit ne compile rien : il sert. Il est stable, plus
        // rapide, et surtout il sert LA SORTIE RÉELLE — dont les 54 pages
        // prérendues, que le serveur de dev ne produit jamais. C'est
        // précisément là que vivaient les deux défauts de ce lot qu'aucun
        // banc local ne voyait : neuf pages privées figées en statique, et une
        // page du sitemap interdite aux robots.
        //
        // `NITRO_PRESET` prime sur `nitro.preset: 'vercel'` de nuxt.config.ts,
        // qui produirait `.vercel/output` — non servable directement.
        // (Syntaxe `VAR=x cmd` : Linux et macOS. La CI est ubuntu, le
        // déploiement Vercel aussi.)
        // ═══════════════════════════════════════════════════════════════════
        command: 'npm run build:e2e && node .output/server/index.mjs',
        url: 'http://localhost:3000',
        // ⚠️ PIÈGE VÉRIFIÉ, pas théorique. `reuseExistingServer` reprend TOUT
        // serveur qui répond déjà sur le port — y compris un `node
        // .output/server/index.mjs` oublié par une session précédente, qui sert
        // un build ANTÉRIEUR. Sept bancs sont ainsi tombés sur « Passeport
        // introuvable » : exactement le défaut corrigé en b0d38d1, rejoué par un
        // binaire d'avant le correctif. Il s'en est fallu de peu que je le
        // rapporte comme une régression.
        //
        // Avant de conclure quoi que ce soit d'un échec local : vérifier QUI
        // écoute (`ps aux | grep '.output/server'`) et le tuer au besoin.
        reuseExistingServer: !process.env.CI,
        // Le build complet tient dans cette fenêtre : ~3 min à froid, cache
        // vide. En local, `reuseExistingServer` évite de le refaire à chaque
        // passage.
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
          // `production` depuis qu'on sert le build : c'est le mode dans
          // lequel le code part chez les apiculteurs, donc celui qu'il faut
          // exercer. En `development`, Nitro active des chemins de debug que
          // la production n'a pas.
          NODE_ENV: 'production',
        },
      },
});
