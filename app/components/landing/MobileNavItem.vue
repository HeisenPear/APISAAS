<template>
  <NuxtLink
    :to="to"
    class="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-stone-50 active:scale-95 transition-all group"
    @click="$emit('click')"
  >
    <div
      class="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center group-hover:bg-amber-50 transition-colors"
    >
      <UIcon
        :name="icon"
        class="w-4 h-4 text-stone-500 group-hover:text-amber-600 transition-colors"
      />
    </div>
    <span class="text-sm font-medium text-stone-700">{{ label }}</span>
    <UIcon name="i-lucide-chevron-right" class="w-4 h-4 text-stone-300 ml-auto" />
  </NuxtLink>
</template>

<script setup lang="ts">
defineProps<{
  to: string;
  label: string;
  icon: string;
}>();

defineEmits<{
  click: [];
}>();
</script>
