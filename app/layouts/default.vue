<template>
  <div class="flex h-dvh overflow-x-hidden bg-[var(--surface-primary)]">
    <!-- Mobile backdrop -->
    <Transition
      enter-active-class="transition-opacity duration-[var(--duration-base)]"
      leave-active-class="transition-opacity duration-[var(--duration-base)]"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div v-if="isMobile && mobileOpen" class="fixed inset-0 z-40 bg-black/40" @click="toggle" />
    </Transition>

    <UiAppSidebar
      :collapsed="collapsed"
      :mobile-open="mobileOpen"
      :is-mobile="isMobile"
      @toggle-collapse="toggle"
    />

    <div
      class="flex h-dvh flex-1 flex-col overflow-y-auto overflow-x-hidden transition-[margin] duration-[var(--duration-base)]"
      :class="[
        isMobile
          ? 'ml-0'
          : collapsed
            ? 'ml-[var(--sidebar-collapsed-width)]'
            : 'ml-[var(--sidebar-width)]',
      ]"
    >
      <UiAppHeader
        :title="pageTitle"
        :show-menu-button="isMobile"
        :show-back="isSubPage"
        @toggle-menu="isMobile ? (mobileMenuOpen = true) : toggle()"
        @open-search="commandPaletteOpen = true"
        @go-back="handleBack"
      />

      <!-- Bannière trial (masquée pour admin) -->
      <UiTrialBanner />

      <main
        class="app-content flex-1 px-4 py-4 lg:px-8 lg:py-8"
        :class="{ 'pb-bottom-nav': isMobile }"
      >
        <div class="mx-auto max-w-[var(--content-max-width)]">
          <slot />
        </div>
      </main>
    </div>

    <UiAppCommandPalette :open="commandPaletteOpen" @close="commandPaletteOpen = false" />

    <!-- Bottom nav (mobile uniquement) -->
    <ClientOnly>
      <UiBottomNav v-if="isMobile" @open-drawer="mobileMenuOpen = true" />
    </ClientOnly>

    <!-- Mobile menu overlay — burger, slide depuis droite, ne push rien -->
    <ClientOnly>
      <UiMobileMenu v-if="isMobile" :open="mobileMenuOpen" @close="mobileMenuOpen = false" />
    </ClientOnly>

    <ClientOnly>
      <UiOfflineBanner />
      <UiPwaInstallPrompt />
      <UiFeedbackModal />
      <UiTutorialOverlay />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
const { isMobile, collapsed, mobileOpen, toggle } = useSidebar();
const mobileMenuOpen = ref(false);
const commandPaletteOpen = ref(false);
const route = useRoute();
const router = useRouter();

// Swipe depuis bord gauche (<30px) vers la droite (>60px) → ouvre le menu
let _swipeStartX = 0;
let _swipeStartY = 0;

function onSwipeStart(e: TouchEvent) {
  const t = e.touches[0];
  if (!t) return;
  _swipeStartX = t.clientX;
  _swipeStartY = t.clientY;
}

function onSwipeEnd(e: TouchEvent) {
  if (!isMobile.value || mobileMenuOpen.value) return;
  const t = e.changedTouches[0];
  if (!t) return;
  const dx = t.clientX - _swipeStartX;
  const dy = Math.abs(t.clientY - _swipeStartY);
  if (_swipeStartX < 30 && dx > 60 && dy < 80) mobileMenuOpen.value = true;
}

onMounted(() => {
  document.addEventListener('touchstart', onSwipeStart, { passive: true });
  document.addEventListener('touchend', onSwipeEnd, { passive: true });
});

onUnmounted(() => {
  document.removeEventListener('touchstart', onSwipeStart);
  document.removeEventListener('touchend', onSwipeEnd);
});

const isSubPage = computed(() => {
  const path = route.path;
  const rootPages = [
    '/dashboard',
    '/ruchers',
    '/ruches',
    '/interventions',
    '/hausses',
    '/production',
    '/transhumance',
    '/elevage',
    '/stocks',
    '/finances',
    '/clients',
    '/analytics',
    '/calendrier',
    '/alertes',
    '/meteo',
    '/parametres',
    '/guide',
    '/admin/users',
    '/declarations/napi',
    '/exports',
    '/conformite/ordonnances',
    '/conformite/visites-sanitaires',
    '/conformite/mortalites',
    '/conformite/veterinaires',
    '/transhumance/emplacements',
    '/finances/bons-livraison',
    '/stocks/alertes',
    '/elevage/reines',
    '/elevage/lignees',
    '/elevage/greffage',
  ];
  return isMobile.value && !rootPages.includes(path);
});

const pageTitle = computed(() => {
  const path = route.path;
  const exact: Record<string, string> = {
    '/dashboard': 'Tableau de bord',
    '/ruchers': 'Ruchers',
    '/ruches': 'Ruches',
    '/interventions': 'Interventions',
    '/interventions/nouvelle': 'Nouvelle intervention',
    '/interventions/groupe': 'Intervention groupée',
    '/hausses': 'Hausses',
    '/production': 'Production',
    '/transhumance': 'Transhumance',
    '/transhumance/emplacements': 'Emplacements',
    '/elevage': 'Élevage reines',
    '/elevage/reines': 'Reines',
    '/elevage/lignees': 'Lignées',
    '/elevage/greffage': 'Greffage',
    '/stocks': 'Stocks',
    '/stocks/alertes': 'Alertes stock',
    '/finances': 'Finances',
    '/finances/bons-livraison': 'Bons de livraison',
    '/clients': 'Clients',
    '/analytics': 'Analytics',
    '/calendrier': 'Calendrier',
    '/meteo': 'Météo',
    '/alertes': 'Alertes',
    '/declarations/napi': 'Déclaration NAPI',
    '/exports': "Registre d'élevage",
    '/conformite/ordonnances': 'Ordonnances',
    '/conformite/visites-sanitaires': 'Visites sanitaires',
    '/conformite/mortalites': 'Mortalités',
    '/conformite/veterinaires': 'Vétérinaires',
    '/parametres': 'Paramètres',
    '/guide': 'Guide',
    '/admin/users': 'Administration',
  };
  if (exact[path]) return exact[path];
  if (path.startsWith('/ruchers/')) return 'Détail rucher';
  if (path.startsWith('/ruches/')) return 'Détail ruche';
  if (path.startsWith('/interventions/')) return 'Intervention';
  if (path.startsWith('/finances/facture/')) return 'Facture';
  if (path.startsWith('/finances/bons-livraison/')) return 'Bon de livraison';
  if (path.startsWith('/clients/')) return 'Fiche client';
  if (path.startsWith('/production/')) return 'Production';
  if (path.startsWith('/transhumance/')) return 'Transhumance';
  if (path.startsWith('/elevage/')) return 'Élevage';
  if (path.startsWith('/parametres/')) return 'Paramètres';
  return '';
});

function handleBack() {
  document.documentElement.setAttribute('data-nav', 'back');
  router.back();
  setTimeout(() => document.documentElement.removeAttribute('data-nav'), 400);
}

function handleKeydown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
    event.preventDefault();
    commandPaletteOpen.value = !commandPaletteOpen.value;
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
});
</script>
