<template>
  <section class="py-16 sm:py-20 bg-white">
    <div class="mx-auto max-w-5xl px-4 sm:px-6">
      <div
        class="relative overflow-hidden rounded-[24px] p-10 sm:p-16 text-center"
        style="background: var(--surface-sidebar)"
      >
        <!-- Honey glow -->
        <div class="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            class="absolute -bottom-24 left-1/2 h-[400px] w-[600px] -translate-x-1/2 rounded-full opacity-20 blur-[80px]"
            style="background: var(--honey)"
          />
        </div>

        <!-- Honeycomb pattern -->
        <div class="pointer-events-none absolute inset-0 opacity-[0.04]">
          <svg class="h-full w-full" viewBox="0 0 600 280" preserveAspectRatio="xMidYMid slice">
            <path d="M50 40L100 40L125 83L100 126L50 126L25 83Z" fill="white" />
            <path d="M150 0L200 0L225 43L200 86L150 86L125 43Z" fill="white" />
            <path d="M250 40L300 40L325 83L300 126L250 126L225 83Z" fill="white" />
            <path d="M350 0L400 0L425 43L400 86L350 86L325 43Z" fill="white" />
            <path d="M450 40L500 40L525 83L500 126L450 126L425 83Z" fill="white" />
            <path d="M550 0L600 0L625 43L600 86L550 86L525 43Z" fill="white" />
            <path d="M50 166L100 166L125 209L100 252L50 252L25 209Z" fill="white" />
            <path d="M150 126L200 126L225 169L200 212L150 212L125 169Z" fill="white" />
            <path d="M250 166L300 166L325 209L300 252L250 252L225 209Z" fill="white" />
            <path d="M350 126L400 126L425 169L400 212L350 212L325 169Z" fill="white" />
            <path d="M450 166L500 166L525 209L500 252L450 252L425 209Z" fill="white" />
          </svg>
        </div>

        <div class="relative">
          <!-- Label -->
          <div
            class="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 px-3.5 py-1 text-[11px] font-semibold"
            style="
              color: var(--honey);
              background: color-mix(in srgb, var(--honey) 12%, transparent);
            "
          >
            <span class="h-1.5 w-1.5 animate-pulse rounded-full" style="background: var(--honey)" />
            Que vous soyez amateur ou pro — essai gratuit 60 jours
          </div>

          <h2
            class="mb-4 text-[28px] font-bold tracking-[-0.03em] text-white sm:text-[36px] md:text-[44px]"
          >
            Un outil. Tout votre rucher.<br />
            <span style="color: var(--honey)">Dès aujourd'hui.</span>
          </h2>

          <p
            class="mx-auto mb-10 max-w-xl text-[15px] leading-relaxed sm:text-[17px]"
            style="color: rgba(255, 255, 255, 0.6)"
          >
            Rejoignez les premiers apiculteurs pros qui ont remplacé carnets, tableurs et logiciels
            de facturation par une seule application.
          </p>

          <!-- CTAs -->
          <div class="flex flex-col items-center gap-3.5 sm:flex-row sm:justify-center">
            <NuxtLink
              to="/register"
              class="inline-flex w-full items-center justify-center gap-2 rounded-[14px] px-8 py-3.5 text-[15px] font-bold transition-all duration-200 hover:-translate-y-0.5 sm:w-auto"
              style="
                background: var(--honey);
                color: white;
                box-shadow: 0 6px 24px color-mix(in srgb, var(--honey) 40%, transparent);
              "
            >
              <span class="text-[17px] leading-none" aria-hidden="true">🐝</span>
              Commencer gratuitement
            </NuxtLink>
            <NuxtLink
              to="/demo"
              class="inline-flex w-full items-center justify-center gap-2 rounded-[14px] bg-white px-8 py-3.5 text-[15px] font-bold transition-all hover:-translate-y-0.5 sm:w-auto"
              style="color: var(--honey-deep)"
            >
              <UIcon name="i-lucide-calendar-check" class="h-5 w-5" />
              Réserver une démo
            </NuxtLink>
            <NuxtLink
              to="/login"
              class="inline-flex w-full items-center justify-center gap-2 rounded-[14px] border border-white/20 px-8 py-3.5 text-[15px] font-semibold text-white transition-all hover:bg-white/10 sm:w-auto"
            >
              J'ai déjà un compte
            </NuxtLink>
          </div>

          <!-- Social proof row -->
          <div class="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <div v-for="proof in proofs" :key="proof" class="flex items-center gap-1.5">
              <UIcon name="i-lucide-check-circle" class="h-3.5 w-3.5" style="color: var(--honey)" />
              <span class="text-[12.5px]" style="color: rgba(255, 255, 255, 0.5)">{{ proof }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const proofs = [
  '2 mois Pro offerts',
  'Sans engagement',
  'Données hébergées en France',
  'Annulation à tout moment',
];
</script>
