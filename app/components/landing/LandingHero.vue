<template>
  <section class="relative overflow-hidden pt-24 pb-0 sm:pt-32">
    <!-- Background gradient -->
    <div class="absolute inset-0 bg-gradient-to-b from-[#FAFAF8] to-[#F0EDE8]" />
    <div
      class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(245,166,35,0.10)_0%,_transparent_55%)]"
    />

    <!-- Decorative hexagon pattern -->
    <div class="pointer-events-none absolute right-0 top-0 opacity-[0.04]">
      <svg width="600" height="400" viewBox="0 0 600 400" fill="none">
        <path d="M100 50 L150 50 L175 93 L150 136 L100 136 L75 93 Z" fill="#F5A623" />
        <path d="M200 0 L250 0 L275 43 L250 86 L200 86 L175 43 Z" fill="#F5A623" />
        <path d="M300 50 L350 50 L375 93 L350 136 L300 136 L275 93 Z" fill="#F5A623" />
        <path d="M400 0 L450 0 L475 43 L450 86 L400 86 L375 43 Z" fill="#F5A623" />
        <path d="M500 50 L550 50 L575 93 L550 136 L500 136 L475 93 Z" fill="#F5A623" />
      </svg>
    </div>

    <div class="relative mx-auto max-w-6xl px-4 sm:px-6">
      <!-- Text block -->
      <div class="mx-auto max-w-3xl text-center">
        <!-- Badge -->
        <div
          class="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-sm font-medium text-amber-700"
        >
          <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
          Bêta — Rejoignez les premiers apiculteurs
        </div>

        <!-- Title -->
        <h1 class="mb-6 text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl lg:text-6xl">
          Gérez votre exploitation apicole,
          <span class="text-amber-500">du rucher à la comptabilité</span>
        </h1>

        <!-- Subtitle -->
        <p class="mb-10 text-lg leading-relaxed text-stone-500 sm:text-xl">
          14 types d'interventions, suivi sanitaire, facturation conforme, analytics — tout dans une
          seule app. Mode hors-ligne inclus pour travailler au rucher.
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
          <a
            href="#fonctionnalites"
            class="inline-flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-8 py-4 text-base font-semibold text-stone-700 shadow-sm transition-all duration-200 hover:bg-stone-50 hover:shadow-md"
          >
            <UIcon name="i-lucide-play-circle" class="h-5 w-5 text-amber-500" />
            Découvrir les fonctionnalités
          </a>
        </div>

        <!-- Social proof -->
        <p class="mt-6 text-sm text-stone-400">
          Aucune carte bancaire requise · Essai Pro 14 jours gratuit · Annulation à tout moment
        </p>
      </div>

      <!-- Dashboard mockup -->
      <div class="relative mt-14 mx-auto max-w-5xl">
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
          />
        </div>

        <!-- Fade bottom (pour intégration propre avec la section suivante) -->
        <div
          class="pointer-events-none absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#F0EDE8] to-transparent"
        />
      </div>
    </div>

    <!-- Stats bar (en dehors du container, pleine largeur) -->
    <div class="relative mt-0 border-t border-stone-200/60 bg-white/80 backdrop-blur-sm">
      <div class="mx-auto grid max-w-4xl grid-cols-3 divide-x divide-stone-100">
        <div class="px-6 py-5 text-center">
          <p class="text-2xl font-bold text-stone-900">14</p>
          <p class="mt-0.5 text-xs font-medium text-stone-500">types d'interventions</p>
        </div>
        <div class="px-6 py-5 text-center">
          <p class="text-2xl font-bold text-stone-900">100%</p>
          <p class="mt-0.5 text-xs font-medium text-stone-500">conforme RGPD</p>
        </div>
        <div class="px-6 py-5 text-center">
          <p class="text-2xl font-bold text-stone-900">0€</p>
          <p class="mt-0.5 text-xs font-medium text-stone-500">pour commencer</p>
        </div>
      </div>
    </div>
  </section>
</template>
