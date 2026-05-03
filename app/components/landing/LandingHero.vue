<template>
  <section class="relative overflow-hidden pt-8 pb-12 md:pt-24 md:pb-0">
    <!-- Background gradient -->
    <div class="absolute inset-0 bg-gradient-to-b from-[#FAFAF8] to-[#F0EDE8]" />
    <div
      class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(245,166,35,0.10)_0%,_transparent_55%)]"
    />

    <!-- Decorative hexagon pattern (hidden on mobile) -->
    <div class="pointer-events-none absolute right-0 top-0 opacity-[0.04] hidden md:block">
      <svg width="600" height="400" viewBox="0 0 600 400" fill="none">
        <path d="M100 50 L150 50 L175 93 L150 136 L100 136 L75 93 Z" fill="#F5A623" />
        <path d="M200 0 L250 0 L275 43 L250 86 L200 86 L175 43 Z" fill="#F5A623" />
        <path d="M300 50 L350 50 L375 93 L350 136 L300 136 L275 93 Z" fill="#F5A623" />
        <path d="M400 0 L450 0 L475 43 L450 86 L400 86 L375 43 Z" fill="#F5A623" />
        <path d="M500 50 L550 50 L575 93 L550 136 L500 136 L475 93 Z" fill="#F5A623" />
      </svg>
    </div>

    <div class="relative mx-auto max-w-6xl px-4 sm:px-6">
      <!-- MOBILE HERO (< md) -->
      <div class="md:hidden mx-auto max-w-sm text-center">
        <!-- Badge -->
        <div
          class="mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium"
        >
          <span>🐝</span> Bêta active · Apiculture pro
        </div>

        <!-- Titre mobile -->
        <h1 class="mb-3 text-2xl font-bold tracking-tight text-stone-900 leading-snug">
          Gérez tous vos ruchers<br>depuis un seul outil
        </h1>

        <!-- Sous-titre mobile -->
        <p class="text-sm text-stone-500 leading-relaxed mb-6 max-w-xs mx-auto">
          Interventions, facturation, traçabilité sanitaire — APIGO remplace vos carnets et
          tableurs.
        </p>

        <!-- CTA principal (pleine largeur) -->
        <NuxtLink
          to="/register"
          class="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3.5 text-white font-semibold text-sm shadow-lg shadow-amber-200 hover:bg-amber-600 active:scale-95 transition-all mb-3"
        >
          <UIcon name="i-lucide-zap" class="h-4 w-4" />
          Commencer l'essai gratuit
        </NuxtLink>

        <!-- CTA secondaire (lien texte) -->
        <NuxtLink
          to="/#tarifs"
          class="text-sm text-stone-500 underline underline-offset-2 hover:text-stone-700"
        >
          Voir les tarifs →
        </NuxtLink>

        <!-- PhoneMockup -->
        <div class="mt-8 flex justify-center">
          <PhoneMockup :has-asset="false" />
        </div>

        <!-- Preuve sociale -->
        <div class="mt-6 flex items-center justify-center gap-2 text-xs text-stone-400">
          <span class="text-amber-400 tracking-tight">★★★★★</span>
          <span>Déjà utilisé par des apiculteurs pros</span>
        </div>
      </div>

      <!-- DESKTOP TEXT BLOCK (md+) -->
      <div class="hidden md:block mx-auto max-w-3xl text-center">
        <!-- Badge -->
        <div
          class="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-sm font-medium text-amber-700"
        >
            <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500"></span>
        <!-- Title -->
        <h1 class="mb-6 text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl lg:text-6xl">
          Gérez votre exploitation apicole,
          <span class="text-amber-500">du rucher à la comptabilité</span>
        </h1>

        <!-- Subtitle -->
        <p class="mb-10 text-lg leading-relaxed text-stone-500 sm:text-xl">
          14 types d'interventions, suivi sanitaire, facturation électronique 2026 (Factur-X),
          analytics — tout dans une seule app. Mode hors-ligne inclus pour travailler au rucher.
        </p>

        <!-- CTA buttons -->
        <div class="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <NuxtLink
            to="/register"
            class="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-amber-200 transition-all duration-200 hover:bg-amber-600 hover:shadow-xl hover:shadow-amber-200 hover:-translate-y-0.5"
          >
            <UIcon name="i-lucide-zap" class="h-5 w-5" />
            Essayer gratuitement
          </NuxtLink>
          <NuxtLink
            to="/#tarifs"
            class="inline-flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-8 py-4 text-base font-semibold text-stone-700 shadow-sm transition-all duration-200 hover:bg-stone-50 hover:shadow-md"
          >
            Voir les tarifs
            <UIcon name="i-lucide-arrow-right" class="h-5 w-5 text-stone-400" />
          </NuxtLink>
        </div>

        <!-- Social proof -->
        <p class="mt-6 text-sm text-stone-400">
          Aucune carte bancaire requise · 2 mois Pro offerts · Annulation à tout moment
        </p>
      </div>

      <!-- Dashboard mockup (desktop only) -->
      <div class="hidden md:block relative mt-14 mx-auto max-w-5xl">
        <!-- Ambient glow -->
        <div
          class="pointer-events-none absolute -inset-x-8 top-0 h-40 bg-gradient-to-b from-amber-100/50 to-transparent blur-3xl"
        />

        <!-- Browser window -->
        <div
          class="relative overflow-hidden rounded-t-2xl border border-stone-200/80 border-b-0 shadow-[0_-8px_40px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)]"
        >
          <!-- Chrome bar -->
          <div
            class="flex items-center gap-2 border-b border-stone-100 bg-stone-50/95 px-4 py-3 backdrop-blur-sm"
          >
            <span class="h-2.5 w-2.5 rounded-full bg-red-400/80" />
            <span class="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
            <span class="h-2.5 w-2.5 rounded-full bg-green-400/80" />
            <div
              class="mx-auto flex items-center gap-1.5 rounded-md bg-white border border-stone-200 px-3 py-1 text-[11px] text-stone-400 shadow-sm"
            >
              <UIcon name="i-lucide-lock" class="h-2.5 w-2.5 text-stone-300" />
              app.apigo.fr/dashboard
            </div>
            <div class="w-14" />
          </div>

          <!-- Screenshot -->
          <img
            src="/screen%20pour%20saas/dashboard.jpeg"
            alt="Dashboard APIGO"
            class="w-full block"
            loading="eager"
          >
        </div>

        <!-- Fade bottom -->
        <div
          class="pointer-events-none absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#F0EDE8] to-transparent"
        />
      </div>
    </div>

    <!-- Stats bar -->
    <div class="relative mt-0 border-t border-stone-200/60 bg-white/80 backdrop-blur-sm">
      <div
        class="mx-auto grid max-w-4xl grid-cols-3 gap-4 md:gap-0 md:divide-x divide-stone-100 px-4 md:px-0 py-4 md:py-5"
      >
        <div class="text-center">
          <p class="text-xl md:text-2xl font-bold text-stone-900">14</p>
          <p class="mt-1 md:mt-0.5 text-xs font-medium text-stone-500">types d'interventions</p>
        </div>
        <div class="text-center">
          <p class="text-xl md:text-2xl font-bold text-stone-900">100%</p>
          <p class="mt-1 md:mt-0.5 text-xs font-medium text-stone-500">conforme — RGPD + 2026</p>
        </div>
        <div class="text-center">
          <p class="text-xl md:text-2xl font-bold text-stone-900">0€</p>
          <p class="mt-1 md:mt-0.5 text-xs font-medium text-stone-500">pour commencer</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import PhoneMockup from '../ui/PhoneMockup.vue';
</script>
