<template>
  <section
    class="relative overflow-hidden bg-[var(--surface-primary)] pt-20 pb-0 sm:pt-28 md:pt-32"
  >
    <!-- Ambient honey glow -->
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        class="absolute -top-40 left-1/2 h-[700px] w-[1000px] -translate-x-1/2 rounded-full opacity-[0.07] blur-[120px]"
        style="background: var(--honey)"
      />
    </div>

    <!-- Honeycomb pattern top-right (desktop) -->
    <div class="pointer-events-none absolute right-0 top-0 opacity-[0.035] hidden xl:block">
      <svg width="520" height="420" viewBox="0 0 520 420" fill="none">
        <path d="M80 40L130 40L155 83L130 126L80 126L55 83Z" fill="#F5A623" />
        <path d="M180 0L230 0L255 43L230 86L180 86L155 43Z" fill="#F5A623" />
        <path d="M280 40L330 40L355 83L330 126L280 126L255 83Z" fill="#F5A623" />
        <path d="M380 0L430 0L455 43L430 86L380 86L355 43Z" fill="#F5A623" />
        <path d="M80 166L130 166L155 209L130 252L80 252L55 209Z" fill="#F5A623" />
        <path d="M180 126L230 126L255 169L230 212L180 212L155 169Z" fill="#F5A623" />
        <path d="M280 166L330 166L355 209L330 252L280 252L255 209Z" fill="#F5A623" />
        <path d="M380 126L430 126L455 169L430 212L380 212L355 169Z" fill="#F5A623" />
        <path d="M480 40L530 40L555 83L530 126L480 126L455 83Z" fill="#F5A623" />
      </svg>
    </div>

    <div class="relative mx-auto max-w-6xl px-4 sm:px-6">
      <!-- MOBILE HERO -->
      <div class="md:hidden mx-auto max-w-sm pb-10 text-center">
        <div
          class="mb-5 inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-[12px] font-semibold"
          style="
            background: var(--honey-soft);
            border-color: color-mix(in srgb, var(--honey) 25%, transparent);
            color: var(--honey-deep);
          "
        >
          <span class="h-1.5 w-1.5 animate-pulse rounded-full" style="background: var(--honey)" />
          L'apiculture tout-en-un · Amateur & Pro
        </div>

        <h1
          class="mb-4 text-[30px] font-bold leading-[1.15] tracking-[-0.03em]"
          style="color: var(--text-primary)"
        >
          Parce que chaque abeille<br />
          <span style="color: var(--honey)">compte chez APIGO</span>
        </h1>

        <p class="mb-7 text-[14px] leading-relaxed" style="color: var(--text-secondary)">
          Suivez, soignez et pilotez vos ruches depuis le terrain — même sans réseau. La gestion, la
          conformité et la facturation suivent, automatiquement.
        </p>

        <NuxtLink
          to="/register"
          class="mb-3 inline-flex w-full items-center justify-center gap-2 rounded-[13px] py-3.5 text-[14px] font-bold text-white shadow-lg transition-all active:scale-[0.97]"
          style="
            background: var(--honey);
            box-shadow: 0 8px 20px color-mix(in srgb, var(--honey) 35%, transparent);
          "
        >
          <UiBeeIcon class="h-4 w-4" />
          Commencer gratuitement
        </NuxtLink>

        <NuxtLink
          to="/demo"
          class="mb-3 inline-flex w-full items-center justify-center gap-2 rounded-[13px] border bg-white py-3.5 text-[14px] font-semibold transition-all active:scale-[0.97]"
          style="border-color: var(--border-default); color: var(--text-primary)"
        >
          <UIcon name="i-lucide-calendar-check" class="h-4 w-4" style="color: var(--honey-deep)" />
          Réserver une démo
        </NuxtLink>

        <NuxtLink
          to="/#tarifs"
          class="block text-[12.5px] transition-colors"
          style="color: var(--text-tertiary)"
        >
          Voir les tarifs →
        </NuxtLink>
      </div>

      <!-- DESKTOP HERO -->
      <div class="hidden md:block mx-auto max-w-3xl text-center">
        <div
          class="mb-7 inline-flex items-center gap-2.5 rounded-full border px-4 py-1.5 text-[13px] font-semibold"
          style="
            background: var(--honey-soft);
            border-color: color-mix(in srgb, var(--honey) 25%, transparent);
            color: var(--honey-deep);
          "
        >
          <span class="h-1.5 w-1.5 animate-pulse rounded-full" style="background: var(--honey)" />
          Amateur ou Pro — Gérez vos ruches, stocks &amp; ventes en un seul endroit
        </div>

        <h1
          class="mb-6 text-[56px] font-bold leading-[1.08] tracking-[-0.04em] sm:text-[64px]"
          style="color: var(--text-primary)"
        >
          Parce que chaque abeille<br />
          <span style="color: var(--honey)">compte chez APIGO</span>
        </h1>

        <p
          class="mb-10 max-w-2xl mx-auto text-[18px] leading-relaxed"
          style="color: var(--text-secondary)"
        >
          Suivez, soignez et pilotez vos ruches depuis le terrain — même sans réseau. Chaque visite
          saisie en 30 secondes. La gestion, la conformité et la facturation suivent,
          automatiquement.
        </p>

        <div class="flex items-center justify-center gap-4">
          <NuxtLink
            to="/register"
            class="inline-flex items-center gap-2.5 rounded-[14px] px-8 py-3.5 text-[15px] font-bold text-white transition-all duration-200 hover:-translate-y-0.5"
            style="
              background: var(--honey);
              box-shadow: 0 6px 24px color-mix(in srgb, var(--honey) 35%, transparent);
            "
          >
            <UiBeeIcon class="h-5 w-5" />
            Commencer gratuitement
          </NuxtLink>
          <NuxtLink
            to="/demo"
            class="inline-flex items-center gap-2 rounded-[14px] border bg-white px-8 py-3.5 text-[15px] font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            style="border-color: var(--border-default); color: var(--text-primary)"
          >
            <UIcon
              name="i-lucide-calendar-check"
              class="h-5 w-5"
              style="color: var(--honey-deep)"
            />
            Réserver une démo
          </NuxtLink>
        </div>

        <p class="mt-4 text-[13px]" style="color: var(--text-tertiary)">
          <NuxtLink
            to="/#tarifs"
            class="font-medium hover:underline"
            style="color: var(--text-secondary)"
          >
            Voir les tarifs →
          </NuxtLink>
        </p>

        <p class="mt-3 text-[12.5px]" style="color: var(--text-tertiary)">
          2 mois offerts sur Pro & Expert · −20% à l'année · Sans engagement
        </p>
      </div>

      <!-- Mockup web interactif desktop -->
      <div class="hidden md:block relative mt-14 mx-auto max-w-5xl">
        <WebMockup />
        <div
          class="pointer-events-none absolute bottom-0 left-0 right-0 h-24"
          style="background: linear-gradient(to top, var(--surface-primary), transparent)"
        />
      </div>
    </div>

    <!-- Stats bar -->
    <div
      class="relative mt-0 border-t"
      style="
        border-color: var(--border-default);
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(8px);
      "
    >
      <div class="mx-auto flex max-w-4xl px-4 py-5">
        <div class="flex-1 text-center border-r" style="border-color: var(--border-default)">
          <p class="text-[22px] font-bold" style="color: var(--text-primary)">14</p>
          <p class="mt-0.5 text-[12px] font-medium" style="color: var(--text-secondary)">
            types d'interventions
          </p>
        </div>
        <div class="flex-1 text-center border-r" style="border-color: var(--border-default)">
          <p class="text-[22px] font-bold" style="color: var(--text-primary)">100%</p>
          <p class="mt-0.5 text-[12px] font-medium" style="color: var(--text-secondary)">
            conforme RGPD + 2026
          </p>
        </div>
        <div class="flex-1 text-center">
          <p class="text-[22px] font-bold" style="color: var(--honey)">0€</p>
          <p class="mt-0.5 text-[12px] font-medium" style="color: var(--text-secondary)">
            pour commencer
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import WebMockup from '../ui/WebMockup.vue';
</script>
