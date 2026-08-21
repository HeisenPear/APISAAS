<template>
  <section class="py-16 sm:py-24 md:py-32" style="background: var(--surface-primary)">
    <div class="mx-auto max-w-5xl px-4 sm:px-6">
      <!-- Header -->
      <div class="mx-auto mb-10 max-w-2xl text-center">
        <p
          class="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em]"
          style="color: var(--honey-deep)"
        >
          Notre approche
        </p>
        <h2
          v-reveal
          class="text-[30px] font-bold tracking-[-0.025em] sm:text-[38px]"
          style="color: var(--text-primary)"
        >
          Conçu avec et pour<br class="hidden sm:block" />
          les apiculteurs
        </h2>
        <p
          class="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed"
          style="color: var(--text-secondary)"
        >
          APIGO est construit main dans la main avec des apiculteurs testeurs. Pas de promesses :
          des engagements concrets, vérifiables dès la première utilisation.
        </p>
      </div>

      <!-- Engagements — grille minimaliste -->
      <div v-reveal.cascade="140" class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div
          v-for="engagement in engagements"
          :key="engagement.id"
          class="flex flex-col rounded-[16px] border p-6"
          style="border-color: var(--border-default); background: white"
        >
          <div
            class="mb-4 flex h-10 w-10 items-center justify-center rounded-[12px]"
            style="background: var(--honey-soft)"
          >
            <UIcon :name="engagement.icon" class="h-5 w-5" style="color: var(--honey-deep)" />
          </div>
          <h3 class="mb-2 text-[15px] font-semibold" style="color: var(--text-primary)">
            {{ engagement.title }}
          </h3>
          <p class="flex-1 text-[13.5px] leading-relaxed" style="color: var(--text-secondary)">
            {{ engagement.text }}
          </p>
        </div>
      </div>

      <!-- CTA -->
      <div class="mt-10 text-center">
        <NuxtLink
          to="/register"
          class="inline-flex items-center gap-2 rounded-[12px] px-6 py-2.5 text-[14px] font-semibold text-[var(--text-primary)] transition-all hover:-translate-y-0.5"
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
const engagements = [
  {
    id: 1,
    icon: 'i-lucide-users',
    title: 'Pensé avec le terrain',
    text: "Chaque fonctionnalité répond à un vrai besoin d'apiculteur — saisie au rucher en 30 s, même hors-ligne. Pas de cases à cocher inutiles.",
  },
  {
    id: 2,
    icon: 'i-lucide-shield-check',
    title: 'Vos données vous appartiennent',
    text: 'Hébergement en Europe (UE), conformité RGPD, export complet à tout moment. Vous partez quand vous voulez, avec toutes vos données.',
  },
  {
    id: 3,
    icon: 'i-lucide-workflow',
    title: 'Du rucher à la facturation',
    text: 'Registre et déclarations automatisés, facturation Factur-X 2026 intégrée. Tout au même endroit, sans ressaisie.',
  },
];
</script>
