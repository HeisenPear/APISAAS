<template>
  <section class="bg-white py-12 sm:py-20 md:py-28">
    <div class="mx-auto max-w-4xl px-4 sm:px-6">
      <div
        class="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-amber-500 to-amber-600 px-4 sm:px-8 py-10 sm:py-14 text-center shadow-xl shadow-amber-200/60"
      >
        <!-- Decorative pattern -->
        <div class="pointer-events-none absolute inset-0 opacity-10">
          <svg class="h-full w-full" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
            <path d="M50 50 L100 50 L125 93 L100 136 L50 136 L25 93 Z" fill="white" />
            <path d="M150 0 L200 0 L225 43 L200 86 L150 86 L125 43 Z" fill="white" />
            <path d="M250 50 L300 50 L325 93 L300 136 L250 136 L225 93 Z" fill="white" />
            <path d="M350 0 L400 0 L425 43 L400 86 L350 86 L325 43 Z" fill="white" />
            <path d="M50 200 L100 200 L125 243 L100 286 L50 286 L25 243 Z" fill="white" />
            <path d="M150 150 L200 150 L225 193 L200 236 L150 236 L125 193 Z" fill="white" />
            <path d="M250 200 L300 200 L325 243 L300 286 L250 286 L225 243 Z" fill="white" />
            <path d="M350 150 L400 150 L425 193 L400 236 L350 236 L325 193 Z" fill="white" />
          </svg>
        </div>

        <div class="relative">
          <h2 class="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
            Prêt à moderniser votre exploitation ?
          </h2>
          <p class="mt-3 sm:mt-4 text-sm sm:text-lg text-amber-100">
            Rejoignez les premiers apiculteurs à gérer tout depuis une seule application.
            <br class="hidden sm:block">
            Aucune carte bancaire requise.
          </p>

          <div
            class="mt-8 sm:mt-10 flex flex-col items-center gap-3 sm:gap-4 sm:flex-row sm:justify-center"
          >
            <NuxtLink
              to="/register"
              class="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl bg-white px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-bold text-amber-600 shadow-lg transition-all duration-200 hover:bg-amber-50 hover:shadow-xl hover:-translate-y-0.5"
            >
              <UIcon name="i-lucide-zap" class="h-5 w-5" />
              Commencer gratuitement
            </NuxtLink>
            <NuxtLink
              to="/login"
              class="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl border border-white/30 bg-white/10 px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20"
            >
              J'ai déjà un compte
            </NuxtLink>
          </div>

          <p class="mt-4 sm:mt-6 text-xs sm:text-sm text-amber-200">
            Plan Découverte gratuit à vie · Essai Pro 14 jours sans CB · Annulation à tout moment
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
