<template>
  <div class="flex min-h-dvh flex-col bg-[var(--surface-primary)]">
    <!-- Minimal header -->
    <header
      class="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-stone-200/60 bg-white/80 px-4 backdrop-blur-xl"
    >
      <NuxtLink to="/dashboard" class="flex items-center gap-2">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
          <UIcon name="i-lucide-hexagon" class="h-5 w-5 text-honey-deep" />
        </div>
        <span class="text-sm font-semibold text-stone-900">Mode terrain</span>
      </NuxtLink>

      <NuxtLink
        to="/dashboard"
        class="flex h-10 w-10 items-center justify-center rounded-xl text-stone-500 transition-colors duration-[var(--duration-fast)] hover:bg-stone-100 hover:text-stone-700"
      >
        <UIcon name="i-lucide-x" class="h-5 w-5" />
      </NuxtLink>
    </header>

    <!-- Full screen content -->
    <main class="app-content flex-1 px-4 py-4">
      <slot />
    </main>

    <!-- Bottom navigation bar -->
    <nav
      class="sticky bottom-0 z-40 flex h-16 items-center justify-around border-t border-stone-200/60 bg-white/90 backdrop-blur-xl safe-area-pb"
    >
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-1 text-stone-400 transition-colors duration-[var(--duration-fast)]"
        active-class="text-honey-deep"
      >
        <UIcon :name="item.icon" class="h-6 w-6" />
        <span class="text-[10px] font-medium">{{ item.label }}</span>
      </NuxtLink>
    </nav>
  </div>
</template>

<script setup lang="ts">
interface NavItem {
  icon: string;
  label: string;
  to: string;
}

const navItems: NavItem[] = [
  { icon: 'i-lucide-map-pin', label: 'Ruchers', to: '/ruchers' },
  { icon: 'i-lucide-zap', label: 'Intervention', to: '/interventions/nouvelle' },
  { icon: 'i-lucide-home', label: 'Accueil', to: '/dashboard' },
  { icon: 'i-lucide-droplets', label: 'Production', to: '/production' },
  { icon: 'i-lucide-cloud-sun', label: 'Meteo', to: '/meteo' },
];
</script>
