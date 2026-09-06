<template>
  <div class="mx-auto max-w-3xl space-y-5">
    <!-- Retour -->
    <NuxtLink
      to="/copilote"
      class="inline-flex items-center gap-1.5 text-[12.5px] font-medium transition-colors"
      style="color: var(--text-tertiary)"
      @mouseenter="($event.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'"
      @mouseleave="($event.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)'"
    >
      <UIcon name="i-lucide-arrow-left" class="h-3.5 w-3.5" />
      Maya
    </NuxtLink>

    <div
      class="rounded-[16px] border bg-white p-5 sm:p-6"
      style="border-color: var(--border-default)"
    >
      <IaMayaFenetres />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' });

useHead({ title: "Fenêtres d'intervention — Maya" });
</script>
