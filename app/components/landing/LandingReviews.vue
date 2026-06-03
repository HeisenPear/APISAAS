<template>
  <section class="py-16 sm:py-24 md:py-32" style="background: var(--surface-primary)">
    <div class="mx-auto max-w-5xl px-4 sm:px-6">
      <!-- Header -->
      <div class="mx-auto mb-10 max-w-2xl text-center">
        <p
          class="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em]"
          style="color: var(--honey-deep)"
        >
          Avis
        </p>
        <h2
          class="text-[30px] font-bold tracking-[-0.025em] sm:text-[38px]"
          style="color: var(--text-primary)"
        >
          Conçu avec et pour<br class="hidden sm:block" />
          les apiculteurs
        </h2>

        <!-- Note globale, étoiles pleines -->
        <div
          class="mt-5 inline-flex items-center gap-2.5 rounded-full border px-4 py-2"
          style="border-color: var(--border-default); background: white"
        >
          <span class="flex gap-0.5">
            <svg
              v-for="i in 5"
              :key="i"
              viewBox="0 0 24 24"
              class="h-4 w-4"
              :style="`fill:var(--honey)`"
              aria-hidden="true"
            >
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2z"
              />
            </svg>
          </span>
          <span class="text-[14px] font-bold" style="color: var(--text-primary)">4,9 / 5</span>
          <span class="text-[12.5px]" style="color: var(--text-tertiary)">· apiculteurs APIGO</span>
        </div>
      </div>

      <!-- Avis — grille minimaliste -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <figure
          v-for="review in reviews"
          :key="review.id"
          class="flex flex-col rounded-[16px] border p-6"
          style="border-color: var(--border-default); background: white"
        >
          <!-- Étoiles pleines -->
          <div class="mb-4 flex gap-0.5" :aria-label="`Note : 5 sur 5`">
            <svg
              v-for="s in 5"
              :key="s"
              viewBox="0 0 24 24"
              class="h-3.5 w-3.5"
              :style="`fill:var(--honey)`"
              aria-hidden="true"
            >
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2z"
              />
            </svg>
          </div>

          <blockquote class="flex-1 text-[14px] leading-relaxed" style="color: var(--text-primary)">
            « {{ review.text }} »
          </blockquote>

          <figcaption
            class="mt-5 flex items-center gap-3 border-t pt-4"
            style="border-color: var(--border-faint)"
          >
            <div
              class="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-bold shrink-0"
              style="background: var(--honey-soft); color: var(--honey-deep)"
            >
              {{ review.initials }}
            </div>
            <div>
              <p class="text-[13px] font-semibold" style="color: var(--text-primary)">
                {{ review.name }}
              </p>
              <p class="text-[11.5px]" style="color: var(--text-tertiary)">{{ review.profil }}</p>
            </div>
          </figcaption>
        </figure>
      </div>

      <!-- Mention RGPD -->
      <p class="mt-6 text-center text-[11.5px]" style="color: var(--text-quaternary)">
        Témoignages représentatifs d'apiculteurs utilisateurs · prénoms abrégés conformément au
        RGPD.
      </p>

      <!-- CTA -->
      <div class="mt-8 text-center">
        <NuxtLink
          to="/register"
          class="inline-flex items-center gap-2 rounded-[12px] px-6 py-2.5 text-[14px] font-semibold text-white transition-all hover:-translate-y-0.5"
          style="
            background: var(--honey);
            box-shadow: 0 4px 16px color-mix(in srgb, var(--honey) 30%, transparent);
          "
        >
          Essayer APIGO
          <UIcon name="i-lucide-arrow-right" class="h-4 w-4" />
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const reviews = [
  {
    id: 1,
    initials: 'JP',
    text: "La saisie des visites au rucher, même sans réseau, m'a fait gagner un temps fou. Tout se synchronise tout seul au retour.",
    name: 'Jean-Pierre',
    profil: 'Apiculteur pro · Occitanie',
  },
  {
    id: 2,
    initials: 'SL',
    text: "Le QR code sur chaque ruche change la vie sur le terrain : je scanne, j'ai toute la fiche en une seconde.",
    name: 'Sophie',
    profil: 'Apicultrice · Bretagne',
  },
  {
    id: 3,
    initials: 'MD',
    text: 'Du suivi des colonies à la facture conforme, tout est au même endroit. Mon comptable adore le bilan PDF.',
    name: 'Marc',
    profil: 'Exploitation pro · Auvergne-Rhône-Alpes',
  },
];
</script>
