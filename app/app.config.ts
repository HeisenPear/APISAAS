/**
 * Configuration Nuxt UI.
 *
 * ⚠️ EMPLACEMENT CRITIQUE : ce fichier DOIT rester dans `app/`. En mode
 * compatibilité Nuxt 4, un `app.config.ts` posé à la RACINE du dépôt est
 * silencieusement ignoré, et Nuxt UI retombe sur ses défauts — primary ET
 * success en VERT, neutral en slate. C'est exactement ce qui s'était produit
 * ici : tous les `<UButton color="primary">` sortaient verts malgré ce
 * fichier, simplement parce qu'il n'était pas au bon endroit.
 *
 * Décision produit : la palette APIGO est 100 % chaude, aucun vert nulle part.
 * `success` est donc en ambre lui aussi — on perd la distinction verte
 * « c'est bon », mais l'icône et le libellé portent déjà ce sens.
 *
 * (L'ancien bloc `apiculture.plans` a été retiré : il n'était lu nulle part
 * — aucun `useAppConfig()` dans le dépôt — et ses tarifs étaient périmés.
 * La source de vérité des plans est `app/config/plans.ts`.)
 */
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'amber',
      secondary: 'blue',
      success: 'amber',
      info: 'blue',
      warning: 'orange',
      error: 'red',
      neutral: 'stone',
    },
    /**
     * Les popovers (sélecteur de date, listes de suggestions) sont téléportés
     * dans <body> sans z-index. Ouverts depuis une modale posée en z-50, ils
     * étaient peints DERRIÈRE le voile : le champ « Date d'installation »
     * paraissait mort alors qu'il s'ouvrait, invisible et hors de portée du
     * clic. On les place donc au-dessus des voiles de modale.
     */
    popover: {
      slots: {
        content: 'z-[60]',
      },
    },
  },
});
