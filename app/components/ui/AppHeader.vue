<template>
  <header
    class="sticky top-0 z-40 flex h-[var(--header-height)] items-center justify-between border-b border-stone-200/60 bg-white/80 px-6 backdrop-blur-xl lg:px-8"
  >
    <!-- Left: Page title -->
    <div class="flex items-center gap-3">
      <h2 v-if="title" class="text-lg font-semibold text-stone-900">
        {{ title }}
      </h2>
    </div>

    <!-- Right: Actions -->
    <div class="flex items-center gap-2">
      <!-- Command palette trigger -->
      <button
        type="button"
        class="flex h-9 items-center gap-2 rounded-xl border border-stone-200/60 bg-stone-50 px-3 text-sm text-stone-400 transition-all duration-[var(--duration-fast)] hover:border-stone-300 hover:bg-stone-100 hover:text-stone-600"
        @click="$emit('open-command-palette')"
      >
        <UIcon name="i-lucide-search" class="h-4 w-4" />
        <span class="hidden md:inline">Rechercher...</span>
        <kbd
          class="hidden rounded-md border border-stone-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-stone-400 md:inline"
        >
          &#8984;K
        </kbd>
      </button>

      <!-- Notifications -->
      <button
        type="button"
        class="relative flex h-10 w-10 items-center justify-center rounded-xl text-stone-500 transition-colors duration-[var(--duration-fast)] hover:bg-stone-100 hover:text-stone-700"
      >
        <UIcon name="i-lucide-bell" class="h-5 w-5" />
        <span
          v-if="notificationCount > 0"
          class="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white"
        >
          {{ notificationCount > 99 ? '99+' : notificationCount }}
        </span>
      </button>

      <!-- User dropdown -->
      <UDropdownMenu :items="userMenuItems" :content="{ align: 'end' }">
        <button
          type="button"
          class="flex h-10 w-10 items-center justify-center rounded-xl transition-colors duration-[var(--duration-fast)] hover:bg-stone-100"
        >
          <div
            class="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold text-amber-700"
          >
            {{ userInitials }}
          </div>
        </button>
      </UDropdownMenu>
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
}>();

defineEmits<{
  'open-command-palette': [];
}>();

const notificationCount = ref(3);
const userInitials = ref('AB');

const userMenuItems = computed(() => [
  [
    {
      label: 'Mon profil',
      icon: 'i-lucide-user',
      to: '/parametres/profil',
    },
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
  navigateTo('/login');
}
</script>
