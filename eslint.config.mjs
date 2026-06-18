import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt(
  // Ignore GLOBAL (objet dédié, sans autre clé) : design/ = miroir du handoff Maya
  // (référence design→code, hors build Nuxt). Ne jamais le linter/compiler.
  { ignores: ['design/**'] },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      'vue/no-v-html': 'error',
      'vue/multi-word-component-names': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // Prettier formate les void elements en self-closing (<input/>) — on aligne ESLint
      'vue/html-self-closing': [
        'warn',
        { html: { void: 'any', normal: 'always', component: 'always' } },
      ],
    },
  },
);
