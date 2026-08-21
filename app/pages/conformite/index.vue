<template>
  <div class="min-h-screen bg-[#FAFAF8]">
    <LandingHeader />

    <main class="pt-14">
      <!-- Hero -->
      <section class="mx-auto max-w-3xl px-4 pt-16 pb-2 text-center sm:px-6">
        <p
          class="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em]"
          style="color: var(--honey-deep)"
        >
          Conformité
        </p>
        <h1
          class="text-[30px] font-bold tracking-[-0.025em] sm:text-[40px]"
          style="color: var(--text-primary)"
        >
          La conformité réglementaire, intégrée dès le départ
        </h1>
        <p class="mt-4 text-[15px] leading-relaxed" style="color: var(--text-secondary)">
          L'apiculture est réglementée. APIGO a été conçu en intégrant chaque exigence légale
          française et européenne — registre d'élevage, facturation, Factur-X 2026, TVA apicole,
          traçabilité des lots, RGPD. Vous restez en règle sans y penser.
        </p>
      </section>

      <!-- Détail conformité (section réutilisée de la landing) -->
      <LandingCompliance />

      <!-- CTA -->
      <section class="mx-auto max-w-3xl px-4 pb-24 text-center sm:px-6">
        <h2 class="text-[22px] font-bold tracking-[-0.02em]" style="color: var(--text-primary)">
          Prêt à démarrer sereinement ?
        </h2>
        <p class="mt-2 text-[14px]" style="color: var(--text-secondary)">
          Le plan Découverte est gratuit, sans carte bancaire.
        </p>
        <div class="mt-6 flex flex-wrap items-center justify-center gap-3">
          <NuxtLink
            to="/register"
            class="inline-flex items-center gap-1.5 rounded-[10px] px-5 py-2.5 text-[14px] font-semibold text-[var(--text-primary)] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            style="background: var(--honey)"
          >
            <UiBeeIcon class="h-4 w-4" />
            Commencer gratuitement
          </NuxtLink>
          <NuxtLink
            to="/tarifs"
            class="inline-flex items-center gap-1.5 rounded-[10px] border px-5 py-2.5 text-[14px] font-semibold transition-colors hover:bg-white"
            style="border-color: var(--border-default); color: var(--text-primary)"
          >
            Voir les tarifs
          </NuxtLink>
        </div>
      </section>
    </main>

    <LandingFooter />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

useSeoMeta({
  title: 'Conformité réglementaire — APIGO, logiciel apicole conforme',
  description:
    "APIGO intègre chaque obligation légale de l'apiculture française et européenne : registre d'élevage, facturation Factur-X 2026, TVA apicole multi-taux, traçabilité des lots (CE 178/2002) et RGPD (hébergement UE).",
});
</script>
