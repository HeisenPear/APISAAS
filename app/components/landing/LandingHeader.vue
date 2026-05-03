<template>
  <header
    class="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
    :class="
      scrolled
        ? 'bg-white/95 backdrop-blur-sm shadow-sm border-b border-stone-200/60'
        : 'bg-transparent'
    "
  >
    <!-- DESKTOP NAV (md+) -->
    <div class="mx-auto max-w-6xl px-4 sm:px-6 hidden md:block">
      <div class="flex h-16 items-center justify-between">
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center gap-2.5">
          <img
            src="/logo_apigo.webp"
            alt="APIGO"
            class="h-8 w-8 rounded-xl shadow-sm object-cover"
          >
          <span class="text-base font-bold tracking-tight text-stone-900">APIGO</span>
        </NuxtLink>

        <!-- Nav desktop -->
        <nav class="flex items-center gap-6">
          <a
            href="#fonctionnalites"
            class="text-sm font-medium text-stone-600 transition-colors hover:text-stone-900"
          >
            Fonctionnalités
          </a>
          <a
            href="#tarifs"
            class="text-sm font-medium text-stone-600 transition-colors hover:text-stone-900"
          >
            Tarifs
          </a>
          <a
            href="#conformite"
            class="text-sm font-medium text-stone-600 transition-colors hover:text-stone-900"
          >
            Conformité
          </a>
          <NuxtLink
            to="/notre-histoire"
            class="text-sm font-medium text-stone-600 transition-colors hover:text-stone-900"
          >
            Notre histoire
          </NuxtLink>
          <UDropdownMenu :items="supportItems">
            <button
              type="button"
              class="text-sm font-medium text-stone-600 transition-colors hover:text-stone-900"
            >
              Support
            </button>
          </UDropdownMenu>
        </nav>

        <!-- CTA desktop -->
        <div class="flex items-center gap-3">
          <NuxtLink
            to="/login"
            class="text-sm font-medium text-stone-600 transition-colors hover:text-stone-900"
          >
            Connexion
          </NuxtLink>
          <NuxtLink
            to="/register"
            class="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-amber-600 hover:shadow-md"
          >
            <UIcon name="i-lucide-zap" class="h-4 w-4" />
            Essai gratuit
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- MOBILE NAV (< md) -->
    <div class="md:hidden px-4 h-14 flex items-center justify-between">
      <!-- Logo mobile -->
      <NuxtLink to="/" class="flex items-center gap-2">
        <img src="/logo_apigo.webp" alt="APIGO" class="h-7 w-7 rounded-lg shadow-sm object-cover" />
        <span class="text-sm font-bold tracking-tight text-stone-900">APIGO</span>
      </NuxtLink>

      <!-- Right actions -->
      <div class="flex items-center gap-2">
        <!-- Connexion button (always visible on mobile) -->
        <NuxtLink
          to="/login"
          class="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 text-white hover:bg-amber-600 active:scale-95 transition-all duration-150 shadow-sm"
        >
          Connexion
        </NuxtLink>

        <!-- Mobile menu toggle -->
        <button
          type="button"
          class="p-2 rounded-lg text-stone-500 hover:bg-stone-100 transition-colors duration-150 active:scale-95"
          :aria-label="menuOpen ? 'Fermer menu' : 'Ouvrir menu'"
          @click="menuOpen = !menuOpen"
        >
          <UIcon v-if="!menuOpen" name="i-lucide-menu" class="w-5 h-5" />
          <UIcon v-else name="i-lucide-x" class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- Mobile menu drawer -->
    <Transition name="menu-slide">
      <div
        v-if="menuOpen"
        class="fixed inset-0 top-14 md:hidden z-40 bg-white/95 backdrop-blur-sm overflow-y-auto"
        @click.self="menuOpen = false"
      >
        <div class="px-4 pt-4 pb-8 flex flex-col gap-1">
          <!-- Navigation items -->
          <LandingMobileNavItem
            to="/#fonctionnalites"
            label="Fonctionnalités"
            icon="i-lucide-grid-3x3"
            @click="menuOpen = false"
          />
          <LandingMobileNavItem
            to="/#tarifs"
            label="Tarifs"
            icon="i-lucide-credit-card"
            @click="menuOpen = false"
          />
          <LandingMobileNavItem
            to="/notre-histoire"
            label="Notre histoire"
            icon="i-lucide-book-open"
            @click="menuOpen = false"
          />

          <!-- Separator -->
          <div class="my-3 border-t border-stone-100" />

          <!-- Support accordion -->
          <LandingMobileNavAccordion label="Support" icon="i-lucide-help-circle">
            <LandingMobileNavSubItem to="/support" label="Centre d'aide" />
            <LandingMobileNavSubItem
              to="https://wa.me/33XXXXXXXXX"
              label="Nous écrire sur WhatsApp"
              external
            />
            <LandingMobileNavSubItem
              to="mailto:support@apigo.fr"
              label="Signaler un bug"
              external
            />
          </LandingMobileNavAccordion>

          <!-- CTA section -->
          <div class="mt-6 flex flex-col gap-3">
            <NuxtLink
              to="/register"
              class="w-full text-center py-3 rounded-xl bg-amber-500 text-white font-semibold text-sm shadow-md hover:bg-amber-600 active:scale-95 transition-all"
              @click="menuOpen = false"
            >
              Commencer l'essai gratuit
            </NuxtLink>
          </div>
        </div>
      </div>
    </Transition>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const scrolled = ref(false);
const menuOpen = ref(false);

const supportItems = [
  [
    {
      label: "Centre d'aide",
      icon: 'i-lucide-help-circle',
      to: '/support',
    },
    {
      label: 'Nous contacter',
      icon: 'i-lucide-mail',
      href: 'https://wa.me/33XXXXXXXXX',
      target: '_blank',
    },
    {
      label: 'Signaler un bug',
      icon: 'i-lucide-bug',
      href: 'mailto:support@apigo.fr',
    },
  ],
];

onMounted(() => {
  const handler = () => {
    scrolled.value = window.scrollY > 20;
  };
  window.addEventListener('scroll', handler, { passive: true });
  onUnmounted(() => window.removeEventListener('scroll', handler));
});
</script>

<style scoped>
.menu-slide-enter-active,
.menu-slide-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.25s ease;
}

.menu-slide-enter-from,
.menu-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
