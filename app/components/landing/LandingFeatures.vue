<template>
  <section id="fonctionnalites" class="py-16 sm:py-24 md:py-32" style="background:var(--surface-primary)">
    <div class="mx-auto max-w-6xl px-4 sm:px-6">

      <!-- Section header -->
      <div class="mx-auto mb-14 max-w-2xl text-center">
        <p class="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em]" style="color:var(--honey-deep)">
          Fonctionnalités
        </p>
        <h2 class="text-[30px] font-bold leading-tight tracking-[-0.025em] sm:text-[38px] md:text-[44px]" style="color:var(--text-primary)">
          Tout ce dont un apiculteur<br class="hidden sm:block"> a vraiment besoin
        </h2>
        <p class="mt-4 text-[15px] sm:text-[17px] leading-relaxed" style="color:var(--text-secondary)">
          63 000 apiculteurs en France. Zéro outil complet.<br class="hidden sm:block"> Jusqu'à aujourd'hui.
        </p>
      </div>

      <!-- Feature pills (top 3 highlights) -->
      <div class="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div
          v-for="highlight in highlights"
          :key="highlight.title"
          class="group relative overflow-hidden rounded-[16px] border p-6 transition-all duration-250 hover:-translate-y-0.5 hover:shadow-lg"
          style="border-color:var(--border-default);background:white"
        >
          <div class="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-[12px]" :style="`background:${highlight.bgColor}`">
            <UIcon :name="highlight.icon" class="h-5 w-5" :style="`color:${highlight.iconColor}`" />
          </div>
          <div class="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em]" :style="`color:${highlight.labelColor}`">{{ highlight.label }}</div>
          <h3 class="mb-2 text-[17px] font-bold tracking-[-0.02em]" style="color:var(--text-primary)">{{ highlight.title }}</h3>
          <p class="text-[13.5px] leading-relaxed" style="color:var(--text-secondary)">{{ highlight.description }}</p>
          <div class="absolute right-0 top-0 h-24 w-24 translate-x-10 -translate-y-10 rounded-full opacity-[0.06] transition-all group-hover:opacity-[0.1]" :style="`background:${highlight.iconColor}`" />
        </div>
      </div>

      <!-- Feature grid (6 features) -->
      <div class="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="feature in features"
          :key="feature.title"
          class="flex items-start gap-4 rounded-[14px] border p-5 transition-all hover:shadow-sm"
          style="border-color:var(--border-default);background:white"
        >
          <div class="mt-0.5 shrink-0 flex h-9 w-9 items-center justify-center rounded-[10px]" style="background:var(--honey-soft)">
            <UIcon :name="feature.icon" class="h-4.5 w-4.5" style="color:var(--honey-deep)" />
          </div>
          <div>
            <h3 class="mb-1 text-[14px] font-semibold tracking-[-0.01em]" style="color:var(--text-primary)">{{ feature.title }}</h3>
            <p class="text-[12.5px] leading-relaxed" style="color:var(--text-secondary)">{{ feature.description }}</p>
          </div>
        </div>
      </div>

      <!-- CTA inline -->
      <div class="mt-12 text-center">
        <NuxtLink
          to="/register"
          class="inline-flex items-center gap-2 rounded-[12px] px-6 py-2.5 text-[14px] font-semibold text-white transition-all hover:-translate-y-0.5"
          style="background:var(--text-primary)"
        >
          Tout découvrir gratuitement
          <UIcon name="i-lucide-arrow-right" class="h-4 w-4" />
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const highlights = [
  {
    icon: 'i-lucide-map-pin',
    label: 'Terrain',
    title: 'Intervenir en 30 secondes',
    description: '14 formulaires adaptés à chaque visite — contrôle, varroa, pesée, reine, récolte… Saisissez au rucher, même sans réseau.',
    bgColor: 'var(--honey-soft)',
    iconColor: 'var(--honey)',
    labelColor: 'var(--honey-deep)',
  },
  {
    icon: 'i-lucide-file-text',
    label: 'Commerce',
    title: 'Facturer en 2 clics',
    description: 'Factures PDF + Factur-X (norme EN 16931) prêt pour 2026. TVA apicole automatique, mentions légales, SIREN — tout est pré-rempli.',
    bgColor: 'var(--sage-soft)',
    iconColor: 'var(--sage)',
    labelColor: 'var(--sage-deep)',
  },
  {
    icon: 'i-lucide-trending-up',
    label: 'Vision',
    title: 'Rentabilité par ruche',
    description: 'Score prédictif de santé, coût par kg de miel, comparaison inter-ruchers — pilotez votre exploitation comme un chef d\'entreprise.',
    bgColor: 'var(--clay-soft)',
    iconColor: 'var(--clay)',
    labelColor: 'var(--clay-deep)',
  },
];

const features = [
  {
    icon: 'i-lucide-wifi-off',
    title: 'Mode hors-ligne natif',
    description: 'Travaillez au rucher sans connexion. Synchronisation silencieuse dès que vous retrouvez du réseau.',
  },
  {
    icon: 'i-lucide-qr-code',
    title: 'QR code par ruche',
    description: 'Scannez une ruche, accédez à sa fiche complète en 1 seconde — historique, interventions, état de la reine.',
  },
  {
    icon: 'i-lucide-shield-check',
    title: 'Conformité totale',
    description: 'Registre d\'élevage PDF (arrêté 2000), déclaration NAPI, ordonnances vétérinaires — toutes vos obligations en un endroit.',
  },
  {
    icon: 'i-lucide-crown',
    title: 'Suivi reine avancé',
    description: 'Naissance, fécondation, marquage, essaimage, remplacement — l\'état de chaque colonie en un coup d\'œil.',
  },
  {
    icon: 'i-lucide-users',
    title: 'Multi-utilisateurs',
    description: 'Invitez associés, salariés ou comptable. Chacun accède uniquement à ce qui le concerne.',
  },
  {
    icon: 'i-lucide-truck',
    title: 'Transhumance',
    description: 'Planifiez vos déplacements, gérez vos emplacements, suivez les miellées — tout votre calendrier apicole centralisé.',
  },
];
</script>
