<template>
  <header class="app-header sticky top-0 z-30 border-b border-[var(--border-default)] backdrop-blur-md" style="background: rgba(250,249,246,0.92)">
    <!-- Safe-area spacer (notch iOS PWA standalone) -->
    <div class="shrink-0" style="height: env(safe-area-inset-top, 0px)" />

    <!-- ─── Mobile header ─────────────────────────────────── -->
    <div class="flex h-14 items-center gap-2 px-4 lg:hidden">
      <!-- Burger -->
      <button
        class="header-icon-btn shrink-0"
        aria-label="Menu"
        @click="$emit('toggle-menu')"
      >
        <UIcon name="i-lucide-menu" class="h-5 w-5" />
      </button>

      <!-- Titre (centré visuellement) -->
      <h1 class="flex-1 truncate text-center text-[16px] font-semibold text-[var(--text-primary)]">
        {{ title }}
      </h1>

      <!-- Actions droite -->
      <div class="flex shrink-0 items-center gap-0.5">
        <button
          class="header-icon-btn"
          aria-label="Rechercher"
          @click="$emit('open-search')"
        >
          <UIcon name="i-lucide-search" class="h-5 w-5" />
        </button>
        <NuxtLink to="/alertes" class="header-icon-btn relative">
          <UIcon name="i-lucide-bell" class="h-5 w-5" />
          <span v-if="alertCount > 0" class="header-badge" />
        </NuxtLink>
      </div>
    </div>

    <!-- ─── Desktop header ────────────────────────────────── -->
    <div class="hidden h-16 items-center justify-between px-6 lg:flex">
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

      <!-- Right: bell + help -->
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
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  color: var(--text-secondary);
  transition: background 150ms;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
.header-icon-btn:active {
  background: var(--surface-muted);
}
.header-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--status-bad);
}
</style>
