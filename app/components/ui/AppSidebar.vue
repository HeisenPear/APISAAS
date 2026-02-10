<template>
  <aside
    class="fixed left-0 top-0 z-50 flex h-dvh flex-col bg-[var(--surface-sidebar)] transition-[width] duration-[var(--duration-base)]"
    :class="collapsed ? 'w-[var(--sidebar-collapsed-width)]' : 'w-[var(--sidebar-width)]'"
  >
    <!-- Logo -->
    <div class="flex h-16 items-center gap-3 px-5">
      <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/20">
        <UIcon name="i-lucide-hexagon" class="h-5 w-5 text-amber-400" />
      </div>
      <span v-if="!collapsed" class="truncate text-sm font-semibold text-white">
        Apiculture 360°
      </span>
    </div>

    <!-- Navigation -->
    <nav class="sidebar-scroll flex-1 overflow-y-auto px-3 py-2">
      <ul class="flex flex-col gap-0.5">
        <li v-for="item in mainNavItems" :key="item.to">
          <NuxtLink
            :to="item.to"
            class="group flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2 text-stone-400 transition-all duration-[var(--duration-fast)] hover:bg-[var(--surface-sidebar-hover)] hover:text-white"
            active-class="!bg-[var(--surface-sidebar-active)] !text-white border-l-2 border-amber-500"
          >
            <UIcon :name="item.icon" class="h-5 w-5 shrink-0" />
            <span v-if="!collapsed" class="truncate text-sm font-medium">
              {{ item.label }}
            </span>
          </NuxtLink>
        </li>
      </ul>
    </nav>

    <!-- Settings section -->
    <div class="border-t border-white/10 px-3 py-2">
      <NuxtLink
        to="/parametres"
        class="flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2 text-stone-400 transition-all duration-[var(--duration-fast)] hover:bg-[var(--surface-sidebar-hover)] hover:text-white"
        active-class="!bg-[var(--surface-sidebar-active)] !text-white"
      >
        <UIcon name="i-lucide-settings" class="h-5 w-5 shrink-0" />
        <span v-if="!collapsed" class="truncate text-sm font-medium"> Parametres </span>
      </NuxtLink>
    </div>

    <!-- Collapse toggle -->
    <div class="border-t border-white/10 px-3 py-3">
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
interface NavItem {
  icon: string;
  label: string;
  to: string;
}

defineProps<{
  collapsed: boolean;
}>();

defineEmits<{
  'toggle-collapse': [];
}>();

const mainNavItems: NavItem[] = [
  { icon: 'i-lucide-layout-dashboard', label: 'Tableau de bord', to: '/dashboard' },
  { icon: 'i-lucide-map-pin', label: 'Ruchers', to: '/ruchers' },
  { icon: 'i-lucide-box', label: 'Ruches', to: '/ruches' },
  { icon: 'i-lucide-clipboard-check', label: 'Inspections', to: '/inspections' },
  { icon: 'i-lucide-droplets', label: 'Production', to: '/production' },
  { icon: 'i-lucide-warehouse', label: 'Stocks', to: '/stocks' },
  { icon: 'i-lucide-wallet', label: 'Finances', to: '/finances' },
  { icon: 'i-lucide-users', label: 'Clients', to: '/clients' },
  { icon: 'i-lucide-calendar', label: 'Calendrier', to: '/calendrier' },
  { icon: 'i-lucide-cloud-sun', label: 'Meteo', to: '/meteo' },
];
</script>
