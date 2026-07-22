<template>
  <header class="app-header sticky top-0 z-30">
    <!-- Safe-area spacer (notch iOS PWA standalone) -->
    <div class="safe-area-top shrink-0" />

    <!-- ─── Mobile header ─────────────────────────────────── -->
    <div class="mobile-nav-row lg:hidden">
      <!-- Back sur les sous-pages ; le menu complet s'ouvre via l'onglet « Plus » -->
      <button
        v-if="showBack"
        class="mobile-nav-back-btn shrink-0 flex items-center gap-0.5 px-1 h-11 min-w-11 rounded-lg active:bg-black/5 transition-colors touch-manipulation"
        style="-webkit-tap-highlight-color: transparent"
        aria-label="Retour"
        @click="$emit('go-back')"
      >
        <UIcon name="i-lucide-chevron-left" class="h-[24px] w-[24px]" style="color: #007aff" />
        <span class="text-[17px]" style="color: #007aff">Retour</span>
      </button>

      <!-- Titre aligné à gauche -->
      <h1 class="mobile-nav-title flex-1 truncate">{{ title }}</h1>

      <!-- Alertes (cloche + pastille) -->
      <NuxtLink to="/alertes" class="mobile-nav-btn relative shrink-0" aria-label="Alertes">
        <UIcon name="i-lucide-bell" class="h-[22px] w-[22px]" />
        <span
          v-if="alertCount > 0"
          class="absolute right-2.5 top-2.5 h-2 w-2 rounded-full"
          style="background-color: var(--status-warn)"
        />
      </NuxtLink>

      <!-- Recherche -->
      <button class="mobile-nav-btn shrink-0" aria-label="Rechercher" @click="$emit('open-search')">
        <UIcon name="i-lucide-search" class="h-[22px] w-[22px]" />
      </button>
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
          <span v-if="breadcrumbGroup" class="text-[var(--text-tertiary)]">{{
            breadcrumbGroup
          }}</span>
          <UIcon
            v-if="breadcrumbGroup"
            name="i-lucide-chevron-right"
            class="h-3 w-3 text-[var(--text-tertiary)]"
          />
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
          <kbd
            class="ml-auto rounded bg-white/70 px-1.5 py-0.5 text-[10.5px] font-medium text-[var(--text-tertiary)] shadow-sm"
            >⌘K</kbd
          >
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
          to="/outils"
          class="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] transition-colors duration-[var(--duration-fast)] hover:bg-[var(--surface-muted)]"
          title="Outils pratiques"
        >
          <UIcon name="i-lucide-calculator" class="h-4 w-4" />
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
  showBack?: boolean;
}>();

defineEmits<{
  'toggle-menu': [];
  'open-search': [];
  'go-back': [];
}>();

const route = useRoute();
const { dashboard } = useDashboard();

const alertCount = computed(() => dashboard.value?.kpis.alertesActives ?? 0);

const breadcrumbGroup = computed(() => {
  const path = route.path;
  if (path === '/dashboard') return null;
  if (['/alertes', '/calendrier', '/meteo', '/tournee'].some((p) => path.startsWith(p)))
    return 'Pilotage';
  if (
    [
      '/ruchers',
      '/ruches',
      '/interventions',
      '/hausses',
      '/production',
      '/transhumance',
      '/elevage',
    ].some((p) => path.startsWith(p))
  )
    return 'Cheptel';
  if (['/stocks', '/finances', '/clients', '/analytics'].some((p) => path.startsWith(p)))
    return 'Affaires';
  if (['/declarations', '/exports', '/conformite'].some((p) => path.startsWith(p)))
    return 'Conformité';
  return null;
});
</script>

<style scoped>
/* ── Outer header — desktop default, mobile override ── */
.app-header {
  background: rgba(250, 249, 246, 0.92);
  border-bottom: 1px solid var(--border-default);
}

@media (min-width: 1024px) {
  .app-header {
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }
}

@media (max-width: 1023px) {
  .app-header {
    background: #fff;
    border-bottom: 0.5px solid #e7e5e0;
  }
}

/* ── Mobile nav row ── */
.mobile-nav-row {
  display: flex;
  align-items: center;
  height: 44px;
  padding: 0 16px;
  gap: 4px;
}

.mobile-nav-btn {
  /* 44×44 minimum — cible tactile Apple HIG / WCAG 2.5.5 */
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000;
  background: none;
  border: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.mobile-nav-back-btn {
  padding-left: 0;
}

.mobile-nav-title {
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.005em;
  color: #000;
}

/* ── Desktop icon buttons ── */
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
