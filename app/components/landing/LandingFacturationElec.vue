<!--
  LandingFacturationElec — mise en avant DÉDIÉE de la facturation électronique
  (réforme 2026), avec le logo officiel fourni. Ton « fort mais vrai » : on génère
  du Factur-X conforme (EN 16931), on ne prétend PAS gérer le raccordement PDP /
  l'e-reporting à la place de l'apiculteur. Argument massue : c'est INCLUS, pas un
  module payant en plus.
-->
<template>
  <section
    id="facturation"
    class="py-16 sm:py-24 md:py-32"
    style="background: var(--surface-primary)"
  >
    <div class="mx-auto max-w-6xl px-4 sm:px-6">
      <div
        class="overflow-hidden rounded-[24px] border shadow-[0_20px_60px_rgba(40,30,20,0.06)]"
        style="border-color: var(--border-default); background: white"
      >
        <div class="grid lg:grid-cols-2">
          <!-- Message -->
          <div class="order-2 p-8 sm:p-12 lg:order-1 lg:p-14">
            <div
              class="mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em]"
              style="background: var(--honey-soft); color: var(--honey-deep)"
            >
              <span class="relative flex h-2 w-2">
                <span
                  class="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
                  style="background: var(--honey)"
                />
                <span
                  class="relative inline-flex h-2 w-2 rounded-full"
                  style="background: var(--honey)"
                />
              </span>
              Réforme 2026
            </div>

            <h2
              class="text-[27px] font-bold leading-tight tracking-[-0.025em] sm:text-[34px]"
              style="color: var(--text-primary)"
            >
              Prêt pour la facturation électronique
            </h2>
            <p class="mt-4 text-[14.5px] leading-relaxed" style="color: var(--text-secondary)">
              À partir de <strong>septembre 2026</strong>, la facture électronique devient
              obligatoire. APIGO génère déjà vos factures au format
              <strong>Factur-X</strong> conforme (norme EN&nbsp;16931) — vous prenez de l'avance,
              sans logiciel de facturation en plus.
            </p>

            <ul class="mt-7 space-y-3.5">
              <li v-for="point in points" :key="point" class="flex items-start gap-3">
                <div
                  class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                  style="background: var(--honey-soft)"
                >
                  <UIcon name="i-lucide-check" class="h-3 w-3" style="color: var(--honey-deep)" />
                </div>
                <span class="text-[13.5px] leading-snug" style="color: var(--text-primary)">
                  {{ point }}
                </span>
              </li>
            </ul>

            <div class="mt-8 flex flex-wrap items-center gap-4">
              <NuxtLink
                to="/register"
                class="inline-flex items-center gap-2 rounded-[12px] px-6 py-3 text-[14px] font-semibold text-white transition-all hover:-translate-y-0.5"
                style="background: var(--honey)"
              >
                Créer mon compte
                <UIcon name="i-lucide-arrow-right" class="h-4 w-4" />
              </NuxtLink>
              <NuxtLink
                to="/fonctionnalites#conformite"
                class="text-[13px] font-medium transition-colors hover:underline"
                style="color: var(--honey-deep)"
              >
                Voir le détail de la conformité
              </NuxtLink>
            </div>
          </div>

          <!-- Vitrine du logo officiel -->
          <div
            class="relative order-1 flex flex-col items-center justify-center gap-6 p-10 lg:order-2 lg:p-14"
            style="background: linear-gradient(160deg, #fdf8ef, #fbf3e4)"
          >
            <div
              class="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full opacity-40"
              style="background: radial-gradient(circle, rgba(245, 166, 35, 0.35), transparent 70%)"
            />
            <img
              src="/FACTURATION_ELECTRONIQUE.png"
              alt="Facturation électronique — conforme à la réforme française 2026"
              class="relative w-full max-w-[360px]"
              width="360"
              loading="lazy"
            />
            <p
              class="relative text-center text-[12px] font-medium leading-relaxed"
              style="color: var(--text-tertiary)"
            >
              Format Factur-X (PDF&nbsp;+&nbsp;XML&nbsp;CII, profil BASIC) · norme EN&nbsp;16931 ·
              décret n°&nbsp;2022-1299
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// Points « fort mais vrai » : ce qu'on fait VRAIMENT, sans promettre le
// raccordement PDP / l'e-reporting à la place de l'apiculteur.
const points = [
  'Factur-X (PDF + XML CII) généré sur chaque facture',
  'Numérotation séquentielle et mentions légales obligatoires intégrées',
  'Prêt à déposer sur votre plateforme (Chorus Pro, PDP…)',
  'Inclus dans l’abonnement — aucun module de facturation à payer en plus',
];
</script>
