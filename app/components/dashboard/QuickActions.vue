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

  <!-- Mobile: FAB removed (replaced by bottom nav FAB) -->
  <!-- <div class="fixed bottom-6 right-6 z-40 sm:hidden"> -->
  <!-- ... FAB removed, replaced by bottom nav "+" -->
  <!-- </div> -->

  <!-- Backdrop removed (FAB removed) -->
  <!-- <Transition name="fade"> -->
  <!--   <div -->
  <!--     v-if="open" -->
  <!--     class="fixed inset-0 z-30 bg-black/20 backdrop-blur-[2px] sm:hidden" -->
  <!--     @click="open = false" -->
  <!--   /> -->
  <!-- </Transition> -->
</template>

<script setup lang="ts">
// const open = ref(false); // Removed - FAB replaced by bottom nav

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
