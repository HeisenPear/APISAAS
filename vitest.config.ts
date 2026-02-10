import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

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
      '~': '/Users/antoine/Desktop/Antoine/work code/saas_apiculture',
      '#supabase/server':
        '/Users/antoine/Desktop/Antoine/work code/saas_apiculture/tests/mocks/supabase-server.ts',
    },
  },
});
