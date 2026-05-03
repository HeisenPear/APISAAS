<template>
  <header
    class="app-header sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--border-default)] px-4 backdrop-blur-md lg:px-6"
    style="background: rgba(250,249,246,0.85)"
  >
    <!-- Mobile -->
    <div class="lg:hidden flex items-center justify-between px-4 h-12">
      <!-- Titre de la page contextuel -->
      <h1 class="text-[17px] font-semibold truncate">
        {{ title }}
      </h1>

      <!-- Actions droite -->
      <div class="flex items-center gap-1">
        <!-- Recherche (ouvre le command palette en plein écran) -->
        <button
          class="header-icon-btn"
          @click="$emit('open-search')"
          aria-label="Rechercher"
        >
          <UIcon name="i-lucide-search" />
        </button>

        <!-- Alertes -->
        <NuxtLink to="/alertes" class="header-icon-btn relative">
          <UIcon name="i-lucide-bell" />
          <span v-if="alertCount > 0" class="header-badge">{{ alertCount }}</span>
        </NuxtLink>

        <!-- Guide -->
        <NuxtLink to="/guide" class="header-icon-btn" aria-label="Aide">
          <UIcon name="i-lucide-help-circle" />
        </NuxtLink>
      </div>
    </div>

    <!-- Desktop (inchangé) -->
    <div class="hidden lg:flex items-center justify-between w-full">
      <!-- Left: hamburger + breadcrumb -->
      <div class="flex items-center gap-3">
        <button
          v-if="showMenuButton"
          type="button"
          class="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors duration-[var(--duration-fast)] hover:bg-[var(--surface-muted)]"
          @click="$emit('toggle-menu')"
        >
          <UIcon name="i-lucide-menu" class="h-4.5 w-4.5" />
        </button>
        <!-- Breadcrumb -->
        <nav class="flex items-center gap-1.5 text-[13px]">
          <span v-if="breadcrumbGroup" class="text-[var(--text-tertiary)]">{{ breadcrumbGroup }}</span>
          <UIcon v-if="breadcrumbGroup" name="i-lucide-chevron-right" class="h-3 w-3 text-[var(--text-tertiary)]" />
          <span class="font-semibold text-[var(--text-primary)]">{{ title }}</span>
        </nav>
      </div>

      <!-- Center: search -->
      <div class="w-[280px]">
        <button
          data-tutorial="search"
          type="button"
          class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-sunk)]"
          style="background: var(--surface-muted)"
          @click="$emit('open-search')"
        >
          <UIcon name="i-lucide-search" class="h-3.5 w-3.5 shrink-0" />
          <span>Rechercher ruche, intervention…</span>
          <kbd class="ml-auto rounded bg-white/70 px-1.5 py-0.5 text-[10.5px] font-medium text-[var(--text-tertiary)] shadow-sm">⌘K</kbd>
        </button>
      </div>

      <!-- Right: bell + help + actions -->
      <div class="flex items-center gap-1.5">
        <NuxtLink
          to="/alertes"
          class="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] transition-colors duration-[var(--duration-fast)] hover:bg-[var(--surface-muted)]"
        >
          <UIcon name="i-lucide-bell" class="h-4 w-4" />
          <span
            v-if="alertCount > 0"
            class="absolute right-1 top-1 h-2 w-2 rounded-full"
            style="background-color: var(--status-warn)"
          />
        </NuxtLink>
        <NuxtLink
          to="/guide"
          class="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] transition-colors duration-[var(--duration-fast)] hover:bg-[var(--surface-muted)]"
          title="Guide d'utilisation"
        >
          <UIcon name="i-lucide-help-circle" class="h-4 w-4" />
        </NuxtLink>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  showMenuButton?: boolean;
}>();

defineEmits<{
  'toggle-menu': [];
  'open-search': [];
}>();

const route = useRoute();
const { dashboard } = useDashboard();

const alertCount = computed(() => dashboard.value?.kpis.alertesActives ?? 0);

// Breadcrumb group based on current route path
const breadcrumbGroup = computed(() => {
  const path = route.path;
  if (path === '/dashboard') return null;
  if (['/alertes', '/calendrier', '/meteo'].some((p) => path.startsWith(p))) return 'Pilotage';
  if (
    ['/ruchers', '/ruches', '/interventions', '/hausses', '/production', '/transhumance', '/elevage'].some((p) =>
      path.startsWith(p),
    )
  )
    return 'Cheptel';
  if (['/stocks', '/finances', '/clients', '/analytics'].some((p) => path.startsWith(p))) return 'Affaires';
  if (['/declarations', '/exports', '/conformite'].some((p) => path.startsWith(p))) return 'Conformité';
  return null;
});
</script>

<style scoped>
.header-icon-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  color: var(--text-secondary);
  transition: background 150ms;
  -webkit-tap-highlight-color: transparent;
}
.header-icon-btn:active {
  background: var(--surface-muted);
}
.header-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--status-bad);
}
</style>
