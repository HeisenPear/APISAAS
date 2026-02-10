<template>
  <div class="flex flex-col items-center justify-center px-6 py-16 text-center">
    <!-- Icon -->
    <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
      <UIcon :name="icon" class="h-7 w-7 text-stone-400" />
    </div>

    <!-- Title -->
    <h3 class="text-base font-semibold text-stone-900">
      {{ title }}
    </h3>

    <!-- Description -->
    <p class="mt-1 max-w-sm text-sm text-stone-500">
      {{ description }}
    </p>

    <!-- Action button -->
    <UButton v-if="actionLabel" class="mt-5 min-h-[44px]" color="primary" @click="emit('action')">
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
