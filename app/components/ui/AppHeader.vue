<template>
  <header
    class="sticky top-0 z-30 flex h-[var(--header-height)] items-center justify-between border-b border-stone-200/60 bg-white/80 px-4 backdrop-blur-xl lg:px-6"
  >
    <!-- Left: Hamburger + Page title -->
    <div class="flex items-center gap-3">
      <button
        v-if="showMenuButton"
        type="button"
        class="flex h-10 w-10 items-center justify-center rounded-xl text-stone-600 transition-colors duration-[var(--duration-fast)] hover:bg-stone-100"
        @click="$emit('toggle-menu')"
      >
        <UIcon name="i-lucide-menu" class="h-5 w-5" />
      </button>
      <h2 v-if="title" class="text-lg font-semibold text-stone-900">
        {{ title }}
      </h2>
    </div>

    <!-- Right: Actions -->
    <div class="flex items-center gap-1.5">
      <!-- Notifications — link to alertes -->
      <NuxtLink
        to="/alertes"
        class="relative flex h-10 w-10 items-center justify-center rounded-xl text-stone-500 transition-colors duration-[var(--duration-fast)] hover:bg-stone-100 hover:text-stone-700"
      >
        <UIcon name="i-lucide-bell" class="h-5 w-5" />
        <span
          v-if="alertCount > 0"
          class="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
        >
          {{ alertCount > 99 ? '99+' : alertCount }}
        </span>
      </NuxtLink>

      <!-- User dropdown -->
      <UDropdownMenu :items="userMenuItems" :content="{ align: 'end' }">
        <button
          type="button"
          class="flex h-10 w-10 items-center justify-center rounded-xl transition-colors duration-[var(--duration-fast)] hover:bg-stone-100"
        >
          <div
            class="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold text-amber-700"
          >
            {{ initials }}
          </div>
        </button>
      </UDropdownMenu>
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
}>();

const authStore = useAuthStore();
const { dashboard } = useDashboard();

const initials = computed(() => authStore.initials || '?');
const alertCount = computed(() => dashboard.value?.kpis.alertesActives ?? 0);

const userMenuItems = computed(() => [
  [
    {
      label: 'Parametres',
      icon: 'i-lucide-settings',
      to: '/parametres',
    },
  ],
  [
    {
      label: 'Se deconnecter',
      icon: 'i-lucide-log-out',
      click: () => handleLogout(),
    },
  ],
]);

function handleLogout() {
  authStore.reset();
  navigateTo('/login');
}
</script>
