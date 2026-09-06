import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

/**
 * `import.meta.client` / `import.meta.server` sont posés par NUXT, pas par
 * Vite : sous Vitest ils valaient `undefined`, donc FAUX tous les deux.
 *
 * Conséquence, jusqu'ici invisible : tout composable client commence par
 * `if (!import.meta.client) return …`. Un banc qui l'importait mesurait donc
 * le RETOUR ANTICIPÉ, jamais la branche qui part en production — la forme
 * « le balayage vide » de CLAUDE.md, déplacée dans le harnais : vert, et vide.
 *
 * ⚠️ `define: { 'import.meta.client': 'true' }` NE MARCHE PAS ici, et c'est un
 * faux ami : la configuration se charge, rien ne proteste, et la valeur reste
 * `undefined`. La transformation SSR de Vite réécrit `import.meta` en
 * `__vite_ssr_import_meta__` AVANT que le greffon `define` ne le voie. Il faut
 * donc passer en `enforce: 'pre'`, sur la source.
 *
 * PÉRIMÈTRE VOLONTAIREMENT ÉTROIT — `app/` seulement :
 *   · c'est le code qui tourne dans un navigateur, donc le seul pour qui ces
 *     deux valeurs sont connues d'avance ;
 *   · `server/` n'écrit jamais `import.meta.client`, et forcer son
 *     `import.meta.server` à `false` mentirait sur son contexte ;
 *   · les fichiers de `tests/` gardent leur texte intact — plusieurs bancs
 *     lisent des sources et cherchent des motifs, ils ne doivent pas voir un
 *     code réécrit sous eux.
 */
function drapeauxNuxt() {
  return {
    name: 'apigo:drapeaux-nuxt',
    enforce: 'pre' as const,
    transform(code: string, id: string) {
      const chemin = id.split('?')[0] ?? id;
      if (!/\/app\/.*\.(ts|vue)$/.test(chemin) || chemin.includes('node_modules')) return null;
      if (!code.includes('import.meta.client') && !code.includes('import.meta.server')) return null;
      return {
        code: code
          .replace(/\bimport\.meta\.client\b/g, 'true')
          .replace(/\bimport\.meta\.server\b/g, 'false'),
        map: null,
      };
    },
  };
}

export default defineConfig({
  plugins: [vue(), drapeauxNuxt()],
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
