<template>
  <UModal
    :open="open"
    @update:open="
      (val: boolean) => {
        if (!val) emit('cancel');
      }
    "
  >
    <template #content>
      <div class="p-6">
        <!-- Icon -->
        <div
          class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
          :class="variant === 'danger' ? 'bg-red-50' : 'bg-amber-50'"
        >
          <UIcon
            :name="variant === 'danger' ? 'i-lucide-triangle-alert' : 'i-lucide-alert-circle'"
            class="h-6 w-6"
            :class="variant === 'danger' ? 'text-red-600' : 'text-amber-600'"
          />
        </div>

        <!-- Title -->
        <h3 class="text-center text-lg font-semibold text-stone-900">
          {{ title }}
        </h3>

        <!-- Message -->
        <p class="mt-2 text-center text-sm text-stone-500">
          {{ message }}
        </p>

        <!-- Actions -->
        <div class="mt-6 flex items-center justify-end gap-3">
          <UButton variant="ghost" color="neutral" class="min-h-[44px]" @click="emit('cancel')">
            Annuler
          </UButton>
          <UButton
            :color="variant === 'danger' ? 'error' : 'warning'"
            class="min-h-[44px]"
            @click="emit('confirm')"
          >
            {{ confirmLabel }}
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    open: boolean;
    title: string;
    message: string;
    variant?: 'danger' | 'warning';
    confirmLabel?: string;
  }>(),
  {
    variant: 'danger',
    confirmLabel: 'Confirmer',
  },
);

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();
</script>
