<template>
  <nav class="bottom-nav">
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
</script>

<style scoped>
/* position:fixed ancrée au bas du viewport visuel iOS — indépendante de h-dvh.
   iOS WebKit calcule 100dvh incorrectement au lancement PWA standalone ;
   fixed+bottom:0 est la seule valeur fiable dès le premier frame. */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 40;
  display: flex;
  align-items: stretch;
  background: #fff;
  border-top: 0.5px solid #e7e5e0;
  /* 50px onglets + safe area home indicator */
  height: calc(50px + env(safe-area-inset-bottom, 0px));
  padding-bottom: env(safe-area-inset-bottom, 0px);
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

.bottom-nav-action .bottom-nav-label {
  color: #9ca3af;
}

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
    --bottom-nav-height: calc(50px + constant(safe-area-inset-bottom, 0px));
    --bottom-nav-height: calc(50px + env(safe-area-inset-bottom, 0px));
  }
}
</style>
