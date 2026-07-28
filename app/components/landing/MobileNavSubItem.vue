<template>
  <component
    :is="external ? 'a' : 'NuxtLink'"
    :href="external ? to : undefined"
    :to="external ? undefined : to"
    :target="external ? '_blank' : undefined"
    :rel="external ? 'noopener noreferrer' : undefined"
    class="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 text-sm text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 transition-all"
  >
    {{ label }}
    <UIcon v-if="external" name="i-lucide-external-link" class="w-3 h-3 ml-auto opacity-50" />
  </component>
</template>

<script setup lang="ts">
defineProps<{
  to: string;
  label: string;
  external?: boolean;
}>();
</script>
