<template>
  <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <!-- Breadcrumbs -->
      <nav
        v-if="breadcrumbs && breadcrumbs.length"
        class="mb-1 flex items-center gap-1 text-[11px] text-[var(--text-tertiary)]"
      >
        <template v-for="(crumb, i) in breadcrumbs" :key="i">
          <NuxtLink
            v-if="crumb.to"
            :to="crumb.to"
            class="transition-colors hover:text-[var(--honey-deep)] hover:underline"
          >
            {{ crumb.label }}
          </NuxtLink>
          <span v-else class="text-[var(--text-tertiary)]">{{ crumb.label }}</span>
          <UIcon
            v-if="i < breadcrumbs.length - 1"
            name="i-lucide-chevron-right"
            class="h-2.5 w-2.5 text-[var(--text-quaternary)]"
          />
        </template>
      </nav>

      <h1 class="text-[26px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
        {{ title }}
      </h1>
      <p v-if="description" class="mt-1 text-[13.5px] text-[var(--text-secondary)]">
        {{ description }}
      </p>
    </div>

    <!-- `flex-wrap` : deux actions un peu longues (« Inviter des membres » +
         « Paramètres association ») font 386 px, et la seconde sortait de
         l'écran sur un téléphone de 360 px — sous le `overflow-x-hidden` du
         shell, donc inatteignable. Le correctif est ici plutôt que page par
         page : cet en-tête est partagé. -->
    <div class="flex shrink-0 flex-wrap items-center gap-2">
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
