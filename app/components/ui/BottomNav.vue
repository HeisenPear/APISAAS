<template>
  <!-- Visible UNIQUEMENT < 1024px -->
  <nav class="bottom-nav">
    <NuxtLink
      v-for="tab in tabs"
      :key="tab.icon"
      :to="tab.to && !tab.isMenu && !tab.isAction ? tab.to : undefined"
      :class="[
        'bottom-nav-item',
        { active: activeTab === tab.to },
        { 'is-action': tab.isAction },
      ]"
      @click="tab.isMenu ? emit('open-drawer') : undefined"
    >
      <!-- Bouton central FAB "+" -->
      <div v-if="tab.isAction" class="bottom-nav-fab">
        <UIcon :name="tab.icon" class="text-xl text-white" />
      </div>

      <!-- Tab standard -->
      <template v-else>
        <div class="bottom-nav-icon-wrapper">
          <UIcon :name="tab.icon" class="text-xl" />
          <!-- Badge alertes non lues -->
          <span v-if="tab.badge && unreadCount > 0" class="bottom-nav-badge">
            {{ unreadCount > 9 ? '9+' : unreadCount }}
          </span>
        </div>
        <span class="bottom-nav-label">{{ tab.label }}</span>
      </template>
    </NuxtLink>
  </nav>
</template>

<script setup lang="ts">
const route = useRoute();
const { dashboard } = useDashboard();

const tabs = [
  { to: '/dashboard', icon: 'i-lucide-home', label: 'Accueil', match: '/dashboard' },
  { to: '/ruchers', icon: 'i-lucide-map-pin', label: 'Ruchers', match: '/ruchers' },
  { to: '/interventions/nouvelle', icon: 'i-lucide-plus-circle', label: '', match: null, isAction: true },
  { to: '/alertes', icon: 'i-lucide-bell', label: 'Alertes', match: '/alertes', badge: true },
  { to: null, icon: 'i-lucide-menu', label: 'Plus', match: null, isMenu: true },
];

const activeTab = computed(() =>
  tabs.find(t => t.match && route.path.startsWith(t.match))?.to ?? null
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
  align-items: flex-end;
  justify-content: space-around;
  height: calc(56px + env(safe-area-inset-bottom, 0px));
  padding-bottom: env(safe-area-inset-bottom, 0px);
  background: var(--surface-card);
  border-top: 1px solid var(--border-default);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.bottom-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  flex: 1;
  height: 56px;
  color: var(--text-tertiary);
  transition: color 200ms var(--ease-out-expo);
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
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

/* FAB central "+" */
.bottom-nav-fab {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--honey);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(245, 166, 35, 0.35);
  transform: translateY(-8px);
  transition: transform 150ms var(--ease-out-expo), box-shadow 150ms;
}

.bottom-nav-fab:active {
  transform: translateY(-8px) scale(0.92);
}

/* Safe area padding pour le contenu principal */
@media (max-width: 1023px) {
  :root {
    --bottom-nav-height: calc(56px + env(safe-area-inset-bottom, 0px));
  }
}
</style>