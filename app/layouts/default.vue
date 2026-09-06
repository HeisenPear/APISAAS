<template>
  <div class="flex h-[var(--app-height,100dvh)] overflow-x-hidden bg-[var(--surface-primary)]">
    <!-- Sidebar sombre — desktop uniquement.
         Le gabarit (afficher/décaler) est piloté par CSS (`lg:`), JAMAIS par
         `isMobile` : au rendu serveur la largeur d'écran est inconnue, donc
         `isMobile` y vaut toujours `false`. Vue ne recolle PAS un écart de
         `class`/`style` à l'hydratation (seuls les listeners sont patchés) —
         le décalage de sidebar restait donc collé au DOM sur mobile.
         Le `v-if` reste pour ne pas monter la sidebar pour rien sur mobile,
         le wrapper CSS évite qu'elle clignote avant l'hydratation. -->
    <div class="hidden lg:contents">
      <UiAppSidebar
        v-if="!isMobile"
        :collapsed="collapsed"
        :mobile-open="false"
        :is-mobile="false"
        @toggle-collapse="toggle"
      />
    </div>

    <!-- Drawer mobile "Menu" (design clair iOS) — ouvert par le burger -->
    <ClientOnly>
      <UiMobileMenu v-if="isMobile" :open="mobileOpen" @close="closeMobile" />
    </ClientOnly>

    <!-- Décalage = largeur de la sidebar, en CSS pure : `ml-0` par défaut (donc
         sur mobile), la marge desktop n'existe qu'à partir de `lg`. Seul
         `collapsed` reste en JS — il vaut `false` des deux côtés au premier
         rendu, donc aucun écart d'hydratation. -->
    <div
      class="ml-0 flex h-[var(--app-height,100dvh)] flex-1 flex-col overflow-hidden transition-[margin] duration-[var(--duration-base)]"
      :class="[
        collapsed ? 'lg:ml-[var(--sidebar-collapsed-width)]' : 'lg:ml-[var(--sidebar-width)]',
      ]"
    >
      <UiAppHeader
        :title="pageTitle"
        :show-menu-button="isMobile"
        :show-back="isSubPage"
        @toggle-menu="toggle()"
        @open-search="commandPaletteOpen = true"
        @go-back="handleBack"
      />

      <!-- Bannière trial (masquée pour admin) -->
      <UiTrialBanner />

      <!-- Contenu scrollable — overflow ici, pas sur la colonne parente.
           Le padding-bas mobile (hauteur de la BottomNav fixed, sinon le contenu
           passe sous la barre) est porté par `.app-content` dans main.css, en
           media query — surtout pas par un `:style` conditionné à `isMobile`,
           qu'une hydratation ne rattraperait pas. -->
      <main class="app-content flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 lg:px-8 lg:py-8">
        <div class="mx-auto max-w-[var(--content-max-width)]">
          <InvitationsBanner />
          <WorkspaceBanner />
          <slot />
        </div>
      </main>

      <!-- BottomNav épinglée en bas du viewport (position:fixed dans le composant) -->
      <ClientOnly>
        <UiBottomNav v-if="isMobile" @open-drawer="toggle()" />
      </ClientOnly>
    </div>

    <UiAppCommandPalette :open="commandPaletteOpen" @close="commandPaletteOpen = false" />

    <ClientOnly>
      <UiOfflineBanner />
      <UiPwaInstallPrompt />
      <UiFeedbackModal />
      <UiTutorialOverlay />
      <!-- Notes de patch éphémères : une fois par version, à la première
           connexion suivant la mise à jour (jamais pour un nouvel inscrit). -->
      <UiPatchNotesModal />
      <!-- Modal d'upgrade — ouvert automatiquement sur un 402 « limite/plan atteint ». -->
      <UiUpgradeModal v-model="showUpgradeModal" />
      <!-- Maya — présence adaptative (§7bis) : la BULLE « morph » est la surface
           unique (desktop + mobile), affichée dès que la présence n'est pas « pause ».
           · « partout »  → bulle + cartes proactives (DashboardMayaCard) ;
           · « discrète » → bulle seule, jamais proactive ;
           · « pause »    → rien.
           La gestion (partout/discrète/pause) s'ouvre depuis l'entrée sidebar « Maya ». -->
      <IaMayaBubble v-if="maya.bubbleDisponible" />
      <IaMayaPresenceSettings :open="maya.settingsOpen" @update:open="maya.closeSettings()" />
      <!-- Réveil vocal « Salut Maya » (opt-in) — écoute au premier plan et ouvre
           la bulle sur la phrase de réveil. Sans rendu. -->
      <IaMayaReveil v-if="maya.bubbleDisponible" />
      <!-- Le Seuil : le passage de l'onboarding au tableau de bord. Ne se
           déclenche que sur `?welcome=1`, une seule fois, puis nettoie l'URL. -->
      <IaMayaSeuil />
      <!-- Les présentations de Maya aux comptes installés AVANT elle : la
           première fois qu'ils la touchent, elle se présente. Montée quelle que
           soit la présence — un compte « en pause » y a droit par la barre
           latérale. Ne se joue jamais pour un nouvel inscrit (pré-crédité). -->
      <IaMayaPresentation />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
const { isMobile, collapsed, mobileOpen, toggle, closeMobile } = useSidebar();
const maya = useMayaStore();
const { showUpgradeModal } = useSubscription();
const commandPaletteOpen = ref(false);
const route = useRoute();
const router = useRouter();

// iOS PWA : window.innerHeight est immédiatement correct, contrairement à dvh
function setAppHeight() {
  document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
}

// Swipe depuis bord gauche (<30px) vers la droite (>60px) → ouvre le sidebar
let _swipeStartX = 0;
let _swipeStartY = 0;

function onSwipeStart(e: TouchEvent) {
  const t = e.touches[0];
  if (!t) return;
  _swipeStartX = t.clientX;
  _swipeStartY = t.clientY;
}

function onSwipeEnd(e: TouchEvent) {
  if (!isMobile.value || mobileOpen.value) return;
  const t = e.changedTouches[0];
  if (!t) return;
  const dx = t.clientX - _swipeStartX;
  const dy = Math.abs(t.clientY - _swipeStartY);
  if (_swipeStartX < 30 && dx > 60 && dy < 80) toggle();
}

onMounted(() => {
  setAppHeight();
  window.addEventListener('resize', setAppHeight);
  document.addEventListener('touchstart', onSwipeStart, { passive: true });
  document.addEventListener('touchend', onSwipeEnd, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener('resize', setAppHeight);
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
    '/tournee',
    '/meteo',
    '/parametres',
    '/guide',
    '/outils',
    '/admin/users',
    '/declarations/napi',
    '/exports',
    '/conformite/ordonnances',
    '/conformite/visites-sanitaires',
    '/conformite/mortalites',
    '/conformite/veterinaires',
    '/transhumance/emplacements',
    '/transhumance/carte',
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
    '/transhumance/carte': 'Carte mellifère',
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
    '/tournee': 'Ma tournée',
    '/alertes': 'Alertes',
    '/declarations/napi': 'Déclaration NAPI',
    '/exports': "Registre d'élevage",
    '/conformite/ordonnances': 'Ordonnances',
    '/conformite/visites-sanitaires': 'Visites sanitaires',
    '/conformite/mortalites': 'Mortalités',
    '/conformite/veterinaires': 'Vétérinaires',
    '/parametres': 'Paramètres',
    '/guide': 'Guide',
    '/outils': 'Outils pratiques',
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
