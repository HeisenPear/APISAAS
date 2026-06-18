<template>
  <div class="flex gap-1 border-b" style="border-color: var(--border-default)">
    <NuxtLink
      v-for="tab in tabs"
      :key="tab.to"
      :to="tab.to"
      class="relative -mb-px flex items-center gap-1.5 px-4 py-2.5 text-[13.5px] font-medium transition-colors"
      :class="
        isActive(tab.to)
          ? 'text-[var(--honey-deep)]'
          : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
      "
    >
      <UIcon :name="tab.icon" class="h-4 w-4" />
      {{ tab.label }}
      <span
        v-if="isActive(tab.to)"
        class="absolute inset-x-0 -bottom-px h-0.5 rounded-full"
        style="background: var(--honey)"
      />
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();

const tabs = [
  { to: '/admin/users', label: 'Abonnements', icon: 'i-lucide-credit-card' },
  { to: '/admin/analytics', label: 'Analytics', icon: 'i-lucide-activity' },
  { to: '/admin/demos', label: 'Démos', icon: 'i-lucide-calendar-check' },
];

function isActive(to: string): boolean {
  return route.path === to;
}
</script>
