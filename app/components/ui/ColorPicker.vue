<template>
  <div class="flex flex-wrap gap-2">
    <!-- Preset colors -->
    <button
      v-for="color in PRESET_COLORS"
      :key="color"
      type="button"
      class="h-7 w-7 rounded-full border-2 transition-all hover:scale-110"
      :class="modelValue === color ? 'border-stone-900 scale-110' : 'border-transparent'"
      :style="{ backgroundColor: color }"
      :title="color"
      @click="emit('update:modelValue', color)"
    />

    <!-- None -->
    <button
      type="button"
      class="flex h-7 w-7 items-center justify-center rounded-full border-2 border-dashed border-stone-300 transition-all hover:border-stone-400"
      :class="!modelValue ? 'border-stone-900' : ''"
      title="Aucune couleur"
      @click="emit('update:modelValue', null)"
    >
      <UIcon name="i-lucide-x" class="h-3 w-3 text-stone-400" />
    </button>

    <!-- Custom hex input -->
    <div class="flex items-center gap-1.5">
      <input
        :value="modelValue ?? ''"
        type="color"
        class="h-7 w-7 cursor-pointer rounded-full border-0 bg-transparent p-0"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      >
      <span class="text-xs text-stone-400">{{ modelValue ?? 'Aucune' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const PRESET_COLORS = [
  '#F5A623', // Honey
  '#EF4444', // Red
  '#F97316', // Orange
  '#EAB308', // Yellow
  '#22C55E', // Green
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#78716C', // Stone
];

defineProps<{ modelValue: string | null | undefined }>();
const emit = defineEmits<{ 'update:modelValue': [value: string | null] }>();
</script>
