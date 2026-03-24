<template>
  <aside
    class="fixed left-0 top-0 flex h-dvh flex-col bg-[var(--surface-sidebar)]"
    :class="[
      isMobile
        ? 'z-50 w-[var(--sidebar-width)] transition-transform duration-[var(--duration-base)]'
        : 'z-50 transition-[width] duration-[var(--duration-base)]',
      isMobile
        ? mobileOpen
          ? 'translate-x-0'
          : '-translate-x-full'
        : collapsed
          ? 'w-[var(--sidebar-collapsed-width)]'
          : 'w-[var(--sidebar-width)]',
    ]"
  >
    <!-- Logo -->
    <div class="flex h-16 items-center gap-3 px-5">
      <img src="/logo.jpg" alt="APIGO" class="h-8 w-8 shrink-0 rounded-lg object-cover" />
      <span v-if="!collapsed || isMobile" class="truncate text-sm font-semibold text-white">
        APIGO
      </span>
    </div>

    <!-- Navigation -->
    <nav class="sidebar-scroll flex-1 overflow-y-auto px-3 py-2">
      <ul class="flex flex-col gap-0.5">
        <li v-for="item in mainNavItems" :key="item.to">
          <NuxtLink
            :to="item.to"
            class="group flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2 text-stone-400 transition-all duration-[var(--duration-fast)] hover:bg-[var(--surface-sidebar-hover)] hover:text-white"
            :class="{ 'opacity-60': item.feature && !gating.can(item.feature) }"
            active-class="!bg-[var(--surface-sidebar-active)] !text-white border-l-2 border-amber-500"
          >
            <UIcon :name="item.icon" class="h-5 w-5 shrink-0" />
            <span v-if="!collapsed || isMobile" class="flex-1 truncate text-sm font-medium">
              {{ item.label }}
            </span>
            <!-- Cadenas si feature bloquée (jamais pour admin) -->
            <UIcon
              v-if="(!collapsed || isMobile) && item.feature && !gating.can(item.feature)"
              name="i-lucide-lock"
              class="ml-auto h-3.5 w-3.5 shrink-0 text-stone-500"
            />
          </NuxtLink>
        </li>
      </ul>
    </nav>

    <!-- Jauge ruches + badge admin -->
    <div v-if="!collapsed || isMobile" class="border-t border-white/10 px-4 py-3">
      <!-- Jauge ruches -->
      <template>
        <UiUsageMeter
          v-if="gating.usageData.value"
          :current="gating.usageData.value.usage.ruches?.current ?? 0"
          :max="gating.usageData.value.usage.ruches?.max ?? 1"
          label="Ruches"
        />
        <UButton
          v-if="gating.isAtLimit('ruches')"
          size="xs"
          color="primary"
          variant="soft"
          to="/tarifs"
          block
          class="mt-2"
        >
          Augmenter la limite →
        </UButton>
      </template>
    </div>

    <!-- Settings section -->
    <div class="border-t border-white/10 px-3 py-2">
      <NuxtLink
        to="/parametres"
        class="flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2 text-stone-400 transition-all duration-[var(--duration-fast)] hover:bg-[var(--surface-sidebar-hover)] hover:text-white"
        active-class="!bg-[var(--surface-sidebar-active)] !text-white"
      >
        <UIcon name="i-lucide-settings" class="h-5 w-5 shrink-0" />
        <span v-if="!collapsed || isMobile" class="truncate text-sm font-medium"> Parametres </span>
      </NuxtLink>
      <NuxtLink
        to="/association"
        class="flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2 text-stone-400 transition-all duration-[var(--duration-fast)] hover:bg-[var(--surface-sidebar-hover)] hover:text-white"
        active-class="!bg-[var(--surface-sidebar-active)] !text-white"
      >
        <UIcon name="i-lucide-users" class="h-5 w-5 shrink-0" />
        <span v-if="!collapsed || isMobile" class="truncate text-sm font-medium">
          Association
        </span>
      </NuxtLink>
    </div>

    <!-- Collapse toggle (desktop only) -->
    <div v-if="!isMobile" class="border-t border-white/10 px-3 py-3">
      <button
        type="button"
        class="flex min-h-[44px] w-full items-center justify-center gap-3 rounded-xl px-3 py-2 text-stone-500 transition-all duration-[var(--duration-fast)] hover:bg-[var(--surface-sidebar-hover)] hover:text-white"
        @click="$emit('toggle-collapse')"
      >
        <UIcon
          :name="collapsed ? 'i-lucide-panel-left-open' : 'i-lucide-panel-left-close'"
          class="h-5 w-5 shrink-0"
        />
        <span v-if="!collapsed" class="truncate text-sm font-medium"> Replier </span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { PlanFeatures } from '~/config/plans';

interface NavItem {
  icon: string;
  label: string;
  to: string;
  feature?: keyof PlanFeatures;
}

defineProps<{
  collapsed: boolean;
  mobileOpen: boolean;
  isMobile: boolean;
}>();

defineEmits<{
  'toggle-collapse': [];
}>();

const gating = useGating();

// Charger l'usage au montage (une fois)
onMounted(() => {
  gating.refreshUsage();
});

const mainNavItems: NavItem[] = [
  { icon: 'i-lucide-layout-dashboard', label: 'Tableau de bord', to: '/dashboard' },
  { icon: 'i-lucide-map-pin', label: 'Ruchers', to: '/ruchers' },
  { icon: 'i-lucide-box', label: 'Ruches', to: '/ruches' },
  { icon: 'i-lucide-activity', label: 'Interventions', to: '/interventions' },
  { icon: 'i-lucide-layers-2', label: 'Hausses', to: '/hausses' },
  { icon: 'i-lucide-droplets', label: 'Production', to: '/production', feature: 'production' },
  { icon: 'i-lucide-warehouse', label: 'Stocks', to: '/stocks', feature: 'stocksBasique' },
  { icon: 'i-lucide-wallet', label: 'Finances', to: '/finances', feature: 'facturationPdf' },
  { icon: 'i-lucide-users', label: 'Clients', to: '/clients', feature: 'clients' },
  { icon: 'i-lucide-calendar', label: 'Calendrier', to: '/calendrier' },
  { icon: 'i-lucide-cloud-sun', label: 'Meteo', to: '/meteo' },
  {
    icon: 'i-lucide-bar-chart-2',
    label: 'Analytics',
    to: '/analytics',
    feature: 'analyticsRentabilite',
  },
];
</script>
