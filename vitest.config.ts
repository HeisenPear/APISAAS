import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    include: ['tests/unit/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],

      // Le périmètre précédent — `server/**` + `app/composables/**` — donnait un
      // chiffre faux dans LES DEUX SENS : il excluait `app/utils` et
      // `app/config`, la zone la mieux testée du dépôt (plans, route-gates,
      // quantités de stock…), et incluait les 54 composables dont un seul a un
      // banc. On mesurait donc à la fois moins de mérite et plus de dette que
      // la réalité.
      //
      // Règle retenue : tout le code qui PORTE UNE DÉCISION entre ici. Les
      // composables y restent — ils sont testables, leur absence de couverture
      // est une dette réelle qu'il faut voir, pas masquer.
      include: [
        'server/**/*.ts',
        'app/utils/**/*.ts',
        'app/config/**/*.ts',
        'app/composables/**/*.ts',
      ],

      // N'excluent QUE le déclaratif sans branche : y laisser ces fichiers
      // ferait bouger le pourcentage au gré du nombre de colonnes ajoutées à
      // une table, ce qui ne dit rien sur la qualité du filet.
      exclude: [
        'server/database/migrations/**',
        'server/database/seed.ts',
        'server/database/schema.ts',
        '**/*.d.ts',
      ],
    },
    setupFiles: ['tests/setup.ts'],
  },
  resolve: {
    alias: {
      // Alias plus spécifiques d'abord : dans le code Nuxt `~` pointe vers app/,
      // mais le code serveur est référencé via `~/server/...` (racine).
      '~/types': fileURLToPath(new URL('./app/types', import.meta.url)),
      '~/utils': fileURLToPath(new URL('./app/utils', import.meta.url)),
      '~/config': fileURLToPath(new URL('./app/config', import.meta.url)),
      '~/components': fileURLToPath(new URL('./app/components', import.meta.url)),
      '~': rootDir,
      '~~': rootDir,
      '#supabase/server': fileURLToPath(
        new URL('./tests/mocks/supabase-server.ts', import.meta.url),
      ),
    },
  },
});
