<template>
  <nav ref="navEl" class="bottom-nav">
    <template v-for="tab in tabs" :key="tab.id">
      <!-- Center action — black square -->
      <NuxtLink
        v-if="tab.isAction"
        to="/interventions/nouvelle"
        class="bottom-nav-tab bottom-nav-action"
        aria-label="Nouvelle intervention"
      >
        <div class="bottom-nav-add">
          <UIcon name="i-lucide-plus" class="h-6 w-6" style="color: #fff" />
        </div>
        <span class="bottom-nav-label">{{ tab.label }}</span>
      </NuxtLink>

      <!-- Standard nav tab -->
      <NuxtLink v-else :to="tab.to" class="bottom-nav-tab" :class="{ active: isActiveTab(tab) }">
        <span v-if="isActiveTab(tab)" class="bottom-nav-indicator" />
        <div class="bottom-nav-icon">
          <UIcon :name="tab.icon" class="h-[22px] w-[22px]" />
          <span v-if="tab.badge && unreadCount > 0" class="bottom-nav-badge">
            {{ unreadCount > 9 ? '9+' : unreadCount }}
          </span>
        </div>
        <span class="bottom-nav-label">{{ tab.label }}</span>
      </NuxtLink>
    </template>
  </nav>
</template>

<script setup lang="ts">
interface Tab {
  id: string;
  to: string;
  icon: string;
  label: string;
  match: string | null;
  isAction?: boolean;
  badge?: boolean;
}

const route = useRoute();
const { dashboard } = useDashboard();

const tabs: Tab[] = [
  {
    id: 'home',
    to: '/dashboard',
    icon: 'i-lucide-home',
    label: "Aujourd'hui",
    match: '/dashboard',
  },
  { id: 'ruchers', to: '/ruchers', icon: 'i-lucide-map-pin', label: 'Ruchers', match: '/ruchers' },
  {
    id: 'add',
    to: '/interventions/nouvelle',
    icon: 'i-lucide-plus',
    label: 'Saisir',
    match: null,
    isAction: true,
  },
  {
    id: 'calendrier',
    to: '/calendrier',
    icon: 'i-lucide-calendar',
    label: 'Calendrier',
    match: '/calendrier',
  },
  {
    id: 'alertes',
    to: '/alertes',
    icon: 'i-lucide-bell',
    label: 'Alertes',
    match: '/alertes',
    badge: true,
  },
];

function isActiveTab(tab: Tab): boolean {
  return !!(tab.match && route.path.startsWith(tab.match));
}

const unreadCount = computed(() => dashboard.value?.kpis.alertesActives ?? 0);

defineEmits<{ 'open-drawer': [] }>();

// ─── Fix iOS PWA standalone : tab bar « flottante » au lancement ───
// La nav est en position:fixed bottom:0. Au lancement d'une PWA installée,
// iOS positionne l'élément fixe contre un viewport pas encore stabilisé, et
// comme le défilement se fait dans un conteneur interne (pas le document),
// aucun scroll ne déclenche le recalcul : la barre reste « décollée » du bas
// tant qu'on n'a pas fait un geste de rafraîchissement.
// Forcer un reflow synchrone (display none → reflow → restore) recale la barre
// contre le viewport réel. Pas de flicker : tout se passe dans un seul tick JS,
// aucun paint intermédiaire n'a lieu avant la restauration du display.
const navEl = ref<HTMLElement | null>(null);

function recalerBottomNav() {
  const el = navEl.value;
  if (!el) return;
  const prev = el.style.display;
  el.style.display = 'none';
  void el.offsetHeight; // force le reflow synchrone
  el.style.display = prev;
}

onMounted(() => {
  // Plusieurs tentatives : le timing de lancement et la stabilisation de
  // safe-area-inset-bottom varient selon l'appareil.
  requestAnimationFrame(recalerBottomNav);
  setTimeout(recalerBottomNav, 120);
  setTimeout(recalerBottomNav, 400);
  // Retour d'arrière-plan / bfcache (réveil de la PWA).
  window.addEventListener('pageshow', recalerBottomNav);
  window.addEventListener('orientationchange', recalerBottomNav);
});

onUnmounted(() => {
  window.removeEventListener('pageshow', recalerBottomNav);
  window.removeEventListener('orientationchange', recalerBottomNav);
});
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  /* inset-block-end/inline plutot que bottom/left/right : meme effet mais
     evite toute ambiguite si un futur conteneur logique est introduit */
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 40;
  display: flex;
  align-items: stretch;
  background: #fff;
  /* max() protege contre une valeur env() nulle ou negative sur certaines
     versions iOS — le fond blanc descend toujours jusqu'au vrai bas d'ecran */
  height: calc(50px + constant(safe-area-inset-bottom, 0px)); /* iOS 11.0–11.2 */
  height: calc(50px + max(env(safe-area-inset-bottom, 0px), 0px));
  padding-bottom: constant(safe-area-inset-bottom, 0px); /* iOS 11.0–11.2 */
  padding-bottom: max(env(safe-area-inset-bottom, 0px), 0px);
}

/* Filet de securite mode PWA installe (standalone) : un pseudo-element
   prolonge le fond blanc sous la nav. Si jamais iOS laisse un gap residuel
   (shell sans viewport-fit=cover), il est comble en blanc plutot que de
   laisser apparaitre le fond de page. Invisible dans le cas nominal car
   sous le bord bas de l'ecran. N'utilise pas clip-path (qui clipperait le
   badge de notification deborde en haut des onglets). */
.bottom-nav::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  height: 80px;
  background: #fff;
  pointer-events: none;
}

.bottom-nav-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  position: relative;
  padding-top: 8px;
  color: #9ca3af;
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.bottom-nav-tab.active {
  color: #000;
}

/* Honey indicator bar pinned to the very top of the tab */
.bottom-nav-indicator {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 2px;
  border-radius: 99px;
  background: #f5a623;
}

.bottom-nav-icon {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bottom-nav-badge {
  position: absolute;
  top: -4px;
  right: -8px;
  min-width: 16px;
  height: 16px;
  border-radius: 999px;
  background: #b54545;
  color: white;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}

.bottom-nav-label {
  font-size: 10px;
  font-weight: 500;
  line-height: 1;
}

/* Action tab: label always stays gray */
.bottom-nav-action .bottom-nav-label {
  color: #9ca3af;
}

/* Black square action button */
.bottom-nav-add {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: #000;
  color: #fff;
  display: grid;
  place-items: center;
  margin-bottom: 6px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

@media (min-width: 1024px) {
  .bottom-nav {
    display: none;
  }
}

@media (max-width: 1023px) {
  :root {
    --bottom-nav-height: calc(50px + constant(safe-area-inset-bottom, 0px)); /* iOS 11.0–11.2 */
    --bottom-nav-height: calc(50px + env(safe-area-inset-bottom, 0px));
  }
}
</style>
