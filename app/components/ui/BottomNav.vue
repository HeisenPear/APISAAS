<template>
  <!-- Visible UNIQUEMENT < 1024px -->
  <nav class="bottom-nav">
    <template v-for="tab in tabs" :key="tab.icon">
      <!-- FAB central "+" — bouton absolu qui dépasse la nav -->
      <div v-if="tab.isAction" class="bottom-nav-fab-wrapper">
        <NuxtLink :to="tab.to!" class="bottom-nav-fab" aria-label="Nouvelle intervention">
          <UIcon :name="tab.icon" class="h-6 w-6 text-white" />
        </NuxtLink>
      </div>

      <!-- Bouton menu (ouvre le drawer sidebar) -->
      <button
        v-else-if="tab.isMenu"
        type="button"
        class="bottom-nav-item"
        @click="emit('open-drawer')"
      >
        <div class="bottom-nav-icon-wrapper">
          <UIcon :name="tab.icon" class="text-xl" />
        </div>
        <span class="bottom-nav-label">{{ tab.label }}</span>
      </button>

      <!-- Tab standard (navigation) -->
      <NuxtLink
        v-else
        :to="tab.to!"
        class="bottom-nav-item"
        :class="{ active: activeTab === tab.to }"
      >
        <div class="bottom-nav-icon-wrapper">
          <UIcon :name="tab.icon" class="text-xl" />
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
  to: string | null;
  icon: string;
  label: string;
  match: string | null;
  isAction?: boolean;
  isMenu?: boolean;
  badge?: boolean;
}

const route = useRoute();
const { dashboard } = useDashboard();

const tabs: Tab[] = [
  { to: '/dashboard', icon: 'i-lucide-home', label: 'Accueil', match: '/dashboard' },
  { to: '/ruchers', icon: 'i-lucide-map-pin', label: 'Ruchers', match: '/ruchers' },
  { to: '/interventions/nouvelle', icon: 'i-lucide-plus', label: '', match: null, isAction: true },
  { to: '/alertes', icon: 'i-lucide-bell', label: 'Alertes', match: '/alertes', badge: true },
  { to: null, icon: 'i-lucide-menu', label: 'Menu', match: null, isMenu: true },
];

const activeTab = computed(() =>
  tabs.find(t => 'match' in t && t.match && route.path.startsWith(t.match))?.to ?? null
);

const unreadCount = computed(() => dashboard.value?.kpis.alertesActives ?? 0);

const emit = defineEmits<{
  'open-drawer': [];
}>();
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 40;
  display: flex;
  align-items: stretch;
  justify-content: space-around;
  height: calc(56px + env(safe-area-inset-bottom, 0px));
  padding-bottom: env(safe-area-inset-bottom, 0px);
  background: rgba(250, 249, 246, 0.95);
  border-top: 1px solid var(--border-default);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

/* Tab standard */
.bottom-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  flex: 1;
  height: 56px;
  color: var(--text-tertiary);
  transition: color 200ms var(--ease-out-expo);
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  background: none;
  border: none;
  cursor: pointer;
}

.bottom-nav-item.active {
  color: var(--honey-deep);
}

.bottom-nav-icon-wrapper {
  position: relative;
}

.bottom-nav-badge {
  position: absolute;
  top: -4px;
  right: -8px;
  min-width: 16px;
  height: 16px;
  border-radius: 999px;
  background: var(--status-bad);
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

/* FAB wrapper — prend la même place qu'un tab normal, débordement visible */
.bottom-nav-fab-wrapper {
  flex: 1;
  position: relative;
  /* overflow: visible par défaut — le FAB peut dépasser en haut */
}

/* FAB cercle — positionné absolument, dépasse de 8px au-dessus de la nav */
.bottom-nav-fab {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--honey);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(245, 166, 35, 0.40);
  transition: box-shadow 150ms, background 150ms, opacity 150ms;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

/* Zone de clic élargie par pseudo-élément (silent hitarea) */
.bottom-nav-fab::before {
  content: '';
  position: absolute;
  inset: -10px;
  border-radius: 50%;
}

.bottom-nav-fab:active {
  opacity: 0.85;
  box-shadow: 0 2px 8px rgba(245, 166, 35, 0.30);
}

/* Safe area padding pour le contenu principal */
@media (max-width: 1023px) {
  :root {
    --bottom-nav-height: calc(56px + env(safe-area-inset-bottom, 0px));
  }
}
</style>
