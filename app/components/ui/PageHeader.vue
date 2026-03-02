<template>
  <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div class="flex items-start gap-3">
      <!-- Accent bar -->
      <div class="mt-1 hidden h-7 w-1 shrink-0 rounded-full bg-amber-400 sm:block" />

      <div>
        <!-- Breadcrumbs -->
        <nav
          v-if="breadcrumbs && breadcrumbs.length"
          class="mb-0.5 flex items-center gap-1 text-xs text-stone-400"
        >
          <template v-for="(crumb, i) in breadcrumbs" :key="i">
            <NuxtLink v-if="crumb.to" :to="crumb.to" class="transition-colors hover:text-amber-600">
              {{ crumb.label }}
            </NuxtLink>
            <span v-else>{{ crumb.label }}</span>
            <UIcon
              v-if="i < breadcrumbs.length - 1"
              name="i-lucide-chevron-right"
              class="h-3 w-3"
            />
          </template>
        </nav>

        <h1 class="text-2xl font-bold tracking-tight text-stone-900">
          {{ title }}
        </h1>
        <p v-if="description" class="mt-1 text-sm text-stone-500">
          {{ description }}
        </p>
      </div>
    </div>

    <div class="flex shrink-0 items-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  description?: string;
  breadcrumbs?: Array<{ label: string; to?: string }>;
}>();
</script>
