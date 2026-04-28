<template>
  <section id="fonctionnalites" class="bg-white py-12 sm:py-20 md:py-28">
    <div class="mx-auto max-w-6xl px-4 sm:px-6">
      <!-- Section header -->
      <div class="mx-auto mb-12 md:mb-16 max-w-2xl text-center">
        <p class="mb-3 text-xs font-semibold uppercase tracking-widest text-amber-500">
          Fonctionnalités
        </p>
        <h2 class="text-xl font-bold tracking-tight text-stone-900 sm:text-3xl md:text-4xl">
          Tout ce dont un apiculteur a besoin
        </h2>
        <p class="mt-4 text-sm sm:text-lg text-stone-500">
          63 000 apiculteurs en France. Zéro outil complet. Jusqu'à aujourd'hui.
        </p>
      </div>

      <!-- Features grid -->
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="feature in features"
          :key="feature.title"
          class="group relative overflow-hidden rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm transition-all duration-250 hover:-translate-y-1 hover:shadow-lg hover:border-amber-200/60"
        >
          <!-- Icon -->
          <div
            class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 transition-colors group-hover:bg-amber-100"
          >
            <UIcon :name="feature.icon" class="h-6 w-6 text-amber-600" />
          </div>

          <!-- Content -->
          <h3 class="mb-2 text-base font-semibold text-stone-900">{{ feature.title }}</h3>
          <p class="text-sm leading-relaxed text-stone-500">{{ feature.description }}</p>

          <!-- Decorative accent -->
          <div
            class="absolute right-0 top-0 h-16 w-16 translate-x-8 -translate-y-8 rounded-full bg-amber-500/5 transition-all group-hover:bg-amber-500/10"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const features = [
  {
    icon: 'i-lucide-clipboard-check',
    title: "14 types d'interventions",
    description:
      'Contrôle, varroa, pesée, récolte, reine, rendez-vous pro… Saisissez chaque visite en 30 secondes avec des formulaires adaptés.',
  },
  {
    icon: 'i-lucide-bar-chart-3',
    title: 'Analytics intelligents',
    description:
      'Score prédictif par colonie, rentabilité par ruche, corrélation météo-production, suggestions saisonnières automatiques.',
  },
  {
    icon: 'i-lucide-file-check',
    title: 'Facturation électronique 2026',
    description:
      'Factures PDF + export Factur-X (XML CII, norme EN 16931) prêt pour la réforme sept. 2026. SIREN, TVA intracommunautaire, adresse livraison — tout est automatique.',
  },
  {
    icon: 'i-lucide-wifi-off',
    title: 'Mode hors-ligne',
    description:
      'Saisissez vos interventions au rucher même sans réseau. Les données se synchronisent dès votre retour.',
  },
  {
    icon: 'i-lucide-wallet',
    title: 'Comptabilité conforme',
    description:
      'TVA multi-taux automatique (5,5% / 10% / 20%), export FEC, toutes mentions légales art. L441-9 du Code de commerce.',
  },
  {
    icon: 'i-lucide-users',
    title: 'Multi-utilisateurs',
    description:
      'Invitez vos associés, salariés ou comptable avec des rôles et permissions dédiés.',
  },
];
</script>
