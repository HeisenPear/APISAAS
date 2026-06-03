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
      include: ['server/**/*.ts', 'app/composables/**/*.ts'],
      exclude: ['server/database/migrations/**', 'server/database/seed.ts'],
    },
    setupFiles: ['tests/setup.ts'],
  },
  resolve: {
    alias: {
      // Alias plus spécifiques d'abord : dans le code Nuxt `~` pointe vers app/,
      // mais le code serveur est référencé via `~/server/...` (racine).
      '~/types': fileURLToPath(new URL('./app/types', import.meta.url)),
      '~/utils': fileURLToPath(new URL('./app/utils', import.meta.url)),
      '~': rootDir,
      '~~': rootDir,
      '#supabase/server': fileURLToPath(
        new URL('./tests/mocks/supabase-server.ts', import.meta.url),
      ),
    },
  },
});
