export default defineAppConfig({
  ui: {
    colors: {
      primary: 'amber',
      neutral: 'stone',
    },
  },
  apiculture: {
    name: 'Apiculture 360°',
    description: 'Gestion apicole tout-en-un',
    plans: {
      decouverte: { label: 'Découverte', maxRuches: 10, prix: 0 },
      starter: { label: 'Starter', maxRuches: 20, prix: 19 },
      pro: { label: 'Pro', maxRuches: 100, prix: 49 },
      expert: { label: 'Expert', maxRuches: Infinity, prix: 99 },
    },
  },
});
