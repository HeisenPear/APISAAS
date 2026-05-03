<template>
  <section class="py-16 sm:py-24 md:py-32" style="background:var(--surface-primary)">
    <div class="mx-auto max-w-6xl px-4 sm:px-6">

      <!-- Header -->
      <div class="mx-auto mb-12 max-w-2xl text-center">
        <p class="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em]" style="color:var(--honey-deep)">Ils utilisent APIGO</p>
        <h2 class="text-[30px] font-bold tracking-[-0.025em] sm:text-[38px]" style="color:var(--text-primary)">
          Des apiculteurs de toute la France
        </h2>
        <p class="mt-4 text-[15px]" style="color:var(--text-secondary)">
          Amateurs ou professionnels, ils ont fait le choix d'une gestion moderne.
        </p>
      </div>

      <!-- Stars global -->
      <div class="mb-8 flex items-center justify-center gap-1.5">
        <div class="flex gap-0.5">
          <UIcon v-for="i in 5" :key="i" name="i-lucide-star" class="h-5 w-5" style="color:var(--honey);fill:var(--honey)" />
        </div>
        <span class="text-[14px] font-semibold" style="color:var(--text-primary)">5,0</span>
        <span class="text-[13px]" style="color:var(--text-tertiary)">· Bêta testeurs</span>
      </div>

      <!-- Reviews grid -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="review in reviews"
          :key="review.id"
          class="flex flex-col rounded-[16px] border p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
          style="border-color:var(--border-default);background:white"
        >
          <!-- Stars -->
          <div class="mb-3 flex gap-0.5">
            <UIcon v-for="i in 5" :key="i" name="i-lucide-star" class="h-3.5 w-3.5" style="color:var(--honey);fill:var(--honey)" />
          </div>

          <!-- Quote -->
          <p class="flex-1 text-[13.5px] leading-relaxed" style="color:var(--text-primary)">
            "{{ review.text }}"
          </p>

          <!-- Author -->
          <div class="mt-4 flex items-center gap-3 border-t pt-4" style="border-color:var(--border-default)">
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
    </div>
  </section>
</template>

<script setup lang="ts">
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
