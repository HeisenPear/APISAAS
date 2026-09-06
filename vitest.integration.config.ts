import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

/**
 * Configuration SÉPARÉE des tests d'intégration.
 *
 * Volontairement hors de `npm test` : ces bancs ouvrent une vraie connexion
 * Postgres. Les mêler aux tests unitaires rendrait la suite dépendante d'une
 * base — donc lente, et rouge sur un poste qui n'en a pas.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    setupFiles: ['tests/integration/setup.ts'],
    // Les invariants de lecture comptent des lignes à l'échelle de la base :
    // deux fichiers écrivant en parallèle se verraient mutuellement. Et une
    // base distante n'aime pas quinze connexions simultanées.
    poolOptions: { threads: { singleThread: true } },
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
  resolve: {
    alias: {
      '~/types': fileURLToPath(new URL('./app/types', import.meta.url)),
      '~/utils': fileURLToPath(new URL('./app/utils', import.meta.url)),
      '~/config': fileURLToPath(new URL('./app/config', import.meta.url)),
      '~': rootDir,
      '~~': rootDir,
    },
  },
});
