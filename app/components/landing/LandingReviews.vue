<template>
  <section class="py-16 sm:py-24 md:py-32" style="background:var(--surface-primary)">
    <div class="mx-auto max-w-6xl px-4 sm:px-6">

      <!-- Header -->
      <div class="mx-auto mb-12 max-w-2xl text-center">
        <p class="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em]" style="color:var(--honey-deep)">Témoignages</p>
        <h2 class="text-[30px] font-bold tracking-[-0.025em] sm:text-[38px]" style="color:var(--text-primary)">
          Ils ont quitté Excel<br class="hidden sm:block"> pour ne plus y revenir
        </h2>
        <p class="mt-4 text-[15px]" style="color:var(--text-secondary)">
          Amateurs ou professionnels, ils gèrent leur exploitation sereinement.
        </p>
      </div>

      <!-- Stats row -->
      <div class="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="rounded-[14px] border p-5 text-center"
          style="border-color:var(--border-default);background:white"
        >
          <p class="text-[26px] font-bold leading-none tracking-[-0.03em]" :style="`color:${stat.color}`">{{ stat.value }}</p>
          <p class="mt-1.5 text-[12px] font-medium" style="color:var(--text-tertiary)">{{ stat.label }}</p>
        </div>
      </div>

      <!-- Stars global -->
      <div class="mb-8 flex items-center justify-center gap-2">
        <div class="flex gap-0.5">
          <UIcon v-for="i in 5" :key="i" name="i-lucide-star" class="h-5 w-5" style="color:var(--honey);fill:var(--honey)" />
        </div>
        <span class="text-[15px] font-bold" style="color:var(--text-primary)">5,0</span>
        <span class="text-[13px]" style="color:var(--text-tertiary)">· Apiculteurs APIGO</span>
      </div>

      <!-- Reviews grid -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="(review, i) in reviews"
          :key="review.id"
          class="flex flex-col rounded-[16px] border p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
          :class="i >= 3 ? 'hidden sm:flex' : 'flex'"
          style="border-color:var(--border-default);background:white"
        >
          <!-- Stars -->
          <div class="mb-3 flex gap-0.5">
            <UIcon v-for="s in 5" :key="s" name="i-lucide-star" class="h-3.5 w-3.5" style="color:var(--honey);fill:var(--honey)" />
          </div>

          <!-- Quote -->
          <p class="flex-1 text-[13.5px] leading-relaxed" style="color:var(--text-primary)">
            "{{ review.text }}"
          </p>

          <!-- Author -->
          <div class="mt-4 flex items-center gap-3 border-t pt-4" style="border-color:var(--border-faint)">
            <div class="flex h-9 w-9 items-center justify-center rounded-full text-[15px] shrink-0" style="background:var(--honey-soft)">
              {{ review.avatar }}
            </div>
            <div>
              <p class="text-[13px] font-semibold" style="color:var(--text-primary)">{{ review.name }}</p>
              <p class="text-[11.5px]" style="color:var(--text-tertiary)">{{ review.region }} · {{ review.hives }} ruches</p>
            </div>
          </div>
        </div>
      </div>

      <!-- CTA -->
      <div class="mt-10 text-center">
        <NuxtLink
          to="/register"
          class="inline-flex items-center gap-2 rounded-[12px] px-6 py-2.5 text-[14px] font-semibold text-white transition-all hover:-translate-y-0.5"
          style="background:var(--honey);box-shadow:0 4px 16px color-mix(in srgb,var(--honey) 30%,transparent)"
        >
          Rejoindre la communauté
          <UIcon name="i-lucide-arrow-right" class="h-4 w-4" />
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const stats = [
  { value: '63k', label: 'Apiculteurs en France', color: 'var(--honey-deep)' },
  { value: '14', label: 'Types d\'interventions', color: 'var(--text-primary)' },
  { value: '30s', label: 'Par visite terrain', color: 'var(--honey-deep)' },
  { value: '100%', label: 'Conforme NAPI 2026', color: 'var(--sage-deep)' },
];

const reviews = [
  {
    id: 1,
    avatar: '🧑‍🌾',
    text: 'Enfin un outil fait pour les apiculteurs. La saisie des interventions au rucher, même sans réseau, m\'a fait gagner un temps précieux.',
    name: 'Jean-Pierre M.',
    region: 'Occitanie',
    hives: '120',
  },
  {
    id: 2,
    avatar: '👩‍🌾',
    text: 'Le QR code sur chaque ruche change tout sur le terrain. Plus besoin de chercher la fiche, tout est là en 2 secondes.',
    name: 'Sophie L.',
    region: 'Bretagne',
    hives: '85',
  },
  {
    id: 3,
    avatar: '🧑',
    text: 'La facturation automatique m\'a évité des heures de saisie. Le bilan annuel PDF pour mon comptable, c\'est du bonheur.',
    name: 'Marc D.',
    region: 'Auvergne-Rhône-Alpes',
    hives: '210',
  },
  {
    id: 4,
    avatar: '👩',
    text: 'Interface claire, équipe à l\'écoute. On sent que ça a été conçu par quelqu\'un qui connaît le métier.',
    name: 'Claire B.',
    region: 'Nouvelle-Aquitaine',
    hives: '60',
  },
  {
    id: 5,
    avatar: '🧑‍💻',
    text: 'J\'ai migré depuis Excel. La différence est énorme, surtout pour la déclaration NAPI et le suivi sanitaire. Zéro oubli.',
    name: 'Thierry V.',
    region: 'Normandie',
    hives: '150',
  },
  {
    id: 6,
    avatar: '👩‍🔬',
    text: 'Le score prédictif de santé par colonie, c\'est bluffant. J\'anticipe maintenant les problèmes avant qu\'ils arrivent.',
    name: 'Nathalie P.',
    region: 'Provence',
    hives: '95',
  },
];
</script>
