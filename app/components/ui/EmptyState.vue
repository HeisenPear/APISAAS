<template>
  <div class="flex flex-col items-center justify-center py-16 px-8 text-center">
    <!-- Icon -->
    <div class="w-14 h-14 rounded-[14px] bg-[var(--surface-muted)] flex items-center justify-center mb-5">
      <UIcon :name="icon" class="h-6 w-6 text-[var(--text-tertiary)]" />
    </div>

    <!-- Title -->
    <h3 class="text-[18px] font-semibold text-[var(--text-primary)] mb-2">
      {{ title }}
    </h3>

    <!-- Description -->
    <p class="text-[14px] text-[var(--text-tertiary)] max-w-sm leading-relaxed mb-6">
      {{ description }}
    </p>

    <!-- Action button -->
    <UButton v-if="actionLabel" color="primary" @click="emit('action')">
      {{ actionLabel }}
    </UButton>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
}>();

const emit = defineEmits<{
  action: [];
}>();
</script>
