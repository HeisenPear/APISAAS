<template>
  <!-- Desktop: pill-shaped row -->
  <div class="hidden items-center gap-1.5 sm:flex">
    <NuxtLink
      v-for="action in actions"
      :key="action.to"
      :to="action.to"
      class="flex items-center gap-1.5 rounded-full border border-stone-200/60 bg-white px-3.5 py-2 text-[13px] font-medium text-stone-700 shadow-sm transition-all duration-[var(--duration-fast)] hover:-translate-y-px hover:border-amber-200 hover:shadow-md"
    >
      <UIcon :name="action.icon" class="h-4 w-4 text-amber-600" />
      {{ action.label }}
    </NuxtLink>
  </div>

  <!-- Mobile: FAB -->
  <div class="fixed bottom-6 right-6 z-40 sm:hidden">
    <Transition name="fab-menu">
      <div v-if="open" class="absolute bottom-16 right-0 mb-2 flex flex-col items-end gap-2">
        <NuxtLink
          v-for="(action, i) in actions"
          :key="action.to"
          :to="action.to"
          class="flex items-center gap-2.5 whitespace-nowrap rounded-2xl bg-white px-4 py-3 text-[13px] font-medium text-stone-800 shadow-lg ring-1 ring-stone-200/60 transition-all"
          :style="{ transitionDelay: `${(actions.length - 1 - i) * 30}ms` }"
          @click="open = false"
        >
          <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50">
            <UIcon :name="action.icon" class="h-4 w-4 text-amber-600" />
          </div>
          {{ action.label }}
        </NuxtLink>
      </div>
    </Transition>

    <button
      type="button"
      class="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg shadow-amber-500/25 transition-all duration-[var(--duration-base)] ease-[var(--ease-out-expo)] hover:bg-amber-600 hover:shadow-xl active:scale-95"
      @click="open = !open"
    >
      <UIcon
        name="i-lucide-plus"
        class="h-6 w-6 transition-transform duration-[var(--duration-base)] ease-[var(--ease-out-expo)]"
        :class="open ? 'rotate-45' : ''"
      />
    </button>
  </div>

  <!-- Backdrop -->
  <Transition name="fade">
    <div
      v-if="open"
      class="fixed inset-0 z-30 bg-black/20 backdrop-blur-[2px] sm:hidden"
      @click="open = false"
    />
  </Transition>
</template>

<script setup lang="ts">
const open = ref(false);

const actions = [
  {
    label: 'Intervention',
    icon: 'i-lucide-clipboard-plus',
    to: '/interventions/nouvelle',
  },
  {
    label: 'Recolte',
    icon: 'i-lucide-droplets',
    to: '/production/recoltes/new',
  },
  {
    label: 'Stock',
    icon: 'i-lucide-package',
    to: '/stocks?action=mouvement',
  },
];
</script>

<style scoped>
.fab-menu-enter-active,
.fab-menu-leave-active {
  transition: all var(--duration-base) var(--ease-out-expo);
}
.fab-menu-enter-from,
.fab-menu-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.95);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--duration-fast) ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
